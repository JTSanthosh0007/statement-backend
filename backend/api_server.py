from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from statement_parser import StatementParser
import io
import fitz
import pdfplumber
import pandas as pd
import re
import logging

app = FastAPI()

# Enable CORS with simpler configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    Root endpoint that provides API information
    """
    return {
        "name": "Statement Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "Analyze financial statements",
            "/analyze-phonepe": "Analyze PhonePe statements",
            "/unlock-pdf": "Unlock password-protected PDF files"
        },
        "status": "online"
    }

class FileObject:
    def __init__(self, filename, content):
        self.name = filename
        self._content = content
        self._io = io.BytesIO(content)

    def read(self, *args):
        return self._io.read(*args)

    def seek(self, offset, whence=0):
        return self._io.seek(offset, whence)

    def tell(self):
        return self._io.tell()

@app.post("/analyze")
async def analyze_statement(
    file: UploadFile = File(...),
    platform: str = Form(...)
):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Read the file content
        content = await file.read()
        
        # Create a proper file-like object
        file_obj = FileObject(file.filename, content)
        
        try:
            # Parse the statement
            parser = StatementParser(file_obj)
            df = parser.parse()
            
            # Convert to dictionary format
            transactions = df.to_dict('records')
            
            # Calculate summary statistics
            total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
            total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)
            
            # Calculate category breakdown
            category_breakdown = {}
            for t in transactions:
                if t['amount'] < 0:  # Only consider spending
                    category = t['category']
                    category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']
            
            return {
                "transactions": transactions,
                "summary": {
                    "totalSpent": total_spent,
                    "totalReceived": total_received
                },
                "categoryBreakdown": category_breakdown
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-phonepe")
async def analyze_phonepe_statement(
    file: UploadFile = File(...),
):
    logger = logging.getLogger(__name__)
    debug_info = {
        "pages": 0,
        "lines": 0,
        "transactions_found": 0,
        "methods_used": [],
        "keywords_matched": [],
        "errors": []
    }
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        content = await file.read()
        transactions = []
        all_text = ""
        methods_used = []
        keywords_matched = set()
        # 1. Try fitz (PyMuPDF) extraction
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            debug_info["pages"] = doc.page_count
            for page in doc:
                page_text = page.get_text("text")
                all_text += page_text + "\n"
            doc.close()
            methods_used.append("fitz")
        except Exception as e:
            logger.error(f"fitz extraction error: {e}")
            debug_info["errors"].append(f"fitz: {e}")
        # 2. Try extracting transactions from fitz text
        lines = all_text.split('\n')
        debug_info["lines"] = len(lines)
        date_patterns = [
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})',
            r'(\d{1,2}-\d{1,2}-\d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})'
        ]
        amount_pattern = r'(?:₹|Rs|INR)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        for line in lines:
            line = line.strip()
            if not line:
                continue
            date_match = None
            for pattern in date_patterns:
                match = re.search(pattern, line)
                if match:
                    date_match = match.group(1)
                    break
            if date_match:
                amount_match = re.search(amount_pattern, line)
                if amount_match:
                    amount_str = amount_match.group(1).replace(',', '')
                    amount = float(amount_str)
                    is_debit = any(word in line.lower() for word in ['paid', 'payment', 'sent', 'debit'])
                    if is_debit:
                        amount = -amount
                    try:
                        date = pd.to_datetime(date_match)
                    except Exception:
                        date = pd.Timestamp.now()
                    # Keyword match
                    for kw in ['phonepe', 'upi', 'transfer', 'payment', 'received', 'sent']:
                        if kw in line.lower():
                            keywords_matched.add(kw)
                    transactions.append({
                        'date': date,
                        'description': line,
                        'amount': amount,
                        'category': 'PhonePe'
                    })
        debug_info["transactions_found"] = len(transactions)
        debug_info["methods_used"] = methods_used.copy()
        debug_info["keywords_matched"] = list(keywords_matched)
        # 3. If no transactions, try pdfplumber (tables and text)
        if not transactions:
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    debug_info["pages"] = len(pdf.pages)
                    methods_used.append("pdfplumber")
                    for page in pdf.pages:
                        # Try table extraction
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                row_str = ' '.join([str(cell) for cell in row if cell])
                                # Try to extract transaction from row string
                                for pattern in date_patterns:
                                    match = re.search(pattern, row_str)
                                    if match:
                                        date_match = match.group(1)
                                        amount_match = re.search(amount_pattern, row_str)
                                        if amount_match:
                                            amount_str = amount_match.group(1).replace(',', '')
                                            amount = float(amount_str)
                                            is_debit = any(word in row_str.lower() for word in ['paid', 'payment', 'sent', 'debit'])
                                            if is_debit:
                                                amount = -amount
                                            try:
                                                date = pd.to_datetime(date_match)
                                            except Exception:
                                                date = pd.Timestamp.now()
                                            for kw in ['phonepe', 'upi', 'transfer', 'payment', 'received', 'sent']:
                                                if kw in row_str.lower():
                                                    keywords_matched.add(kw)
                                            transactions.append({
                                                'date': date,
                                                'description': row_str,
                                                'amount': amount,
                                                'category': 'PhonePe'
                                            })
                        # Try plain text extraction as fallback
                        page_text = page.extract_text() or ''
                        for line in page_text.split('\n'):
                            line = line.strip()
                            if not line:
                                continue
                            date_match = None
                            for pattern in date_patterns:
                                match = re.search(pattern, line)
                                if match:
                                    date_match = match.group(1)
                                    break
                            if date_match:
                                amount_match = re.search(amount_pattern, line)
                                if amount_match:
                                    amount_str = amount_match.group(1).replace(',', '')
                                    amount = float(amount_str)
                                    is_debit = any(word in line.lower() for word in ['paid', 'payment', 'sent', 'debit'])
                                    if is_debit:
                                        amount = -amount
                                    try:
                                        date = pd.to_datetime(date_match)
                                    except Exception:
                                        date = pd.Timestamp.now()
                                    for kw in ['phonepe', 'upi', 'transfer', 'payment', 'received', 'sent']:
                                        if kw in line.lower():
                                            keywords_matched.add(kw)
                                    transactions.append({
                                        'date': date,
                                        'description': line,
                                        'amount': amount,
                                        'category': 'PhonePe'
                                    })
                debug_info["transactions_found"] = len(transactions)
                debug_info["methods_used"] = methods_used.copy()
                debug_info["keywords_matched"] = list(keywords_matched)
            except Exception as e:
                logger.error(f"pdfplumber extraction error: {e}")
                debug_info["errors"].append(f"pdfplumber: {e}")
        # 4. Always return a valid response
        if not transactions:
            logger.warning("No transactions extracted from PhonePe statement.")
            return {
                "transactions": [],
                "summary": {"totalSpent": 0, "totalReceived": 0},
                "categoryBreakdown": {},
                "pageCount": debug_info["pages"],
                "debug": debug_info
            }
        df = pd.DataFrame(transactions)
        total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
        total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)
        category_breakdown = {}
        for t in transactions:
            if t['amount'] < 0:
                category = t['category']
                category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']
        return {
            "transactions": df.to_dict('records'),
            "summary": {
                "totalSpent": total_spent,
                "totalReceived": total_received
            },
            "categoryBreakdown": category_breakdown,
            "pageCount": debug_info["pages"],
            "debug": debug_info
        }
    except Exception as e:
        logger.error(f"Error processing PhonePe statement: {str(e)}")
        return {
            "transactions": [],
            "summary": {"totalSpent": 0, "totalReceived": 0},
            "categoryBreakdown": {},
            "pageCount": 0,
            "debug": {"errors": [str(e)]}
        }

@app.post("/unlock-pdf")
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...)
):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")

        # Read the file content
        content = await file.read()
        
        try:
            # Here we would use a PDF unlocking library
            # For now, just return a placeholder response
            return JSONResponse(
                status_code=200,
                content={"message": "PDF unlocking feature is under development"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error unlocking PDF: {str(e)}")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 