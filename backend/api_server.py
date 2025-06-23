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
        "lines_per_page": [],
        "transactions_found": 0,
        "sample_matches": [],
        "tables_found": 0,
        "methods_used": [],
        "errors": [],
        "first_20_lines": []
    }
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        content = await file.read()
        transactions = []
        all_lines = []
        methods_used = []
        sample_matches = []
        tables_found = 0
        # 1. Try pdfplumber first for tables and text
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                debug_info["pages"] = len(pdf.pages)
                methods_used.append("pdfplumber")
                for page_num, page in enumerate(pdf.pages):
                    page_lines = []
                    # Table extraction
                    tables = page.extract_tables()
                    if tables:
                        tables_found += len(tables)
                        for table in tables:
                            for row in table:
                                row_str = ' | '.join([str(cell) for cell in row if cell])
                                page_lines.append(row_str)
                    # Fallback: extract_text line by line
                    text = page.extract_text() or ''
                    for line in text.split('\n'):
                        page_lines.append(line.strip())
                    # Log first 20 lines for this page
                    if page_num == 0:
                        debug_info["first_20_lines"] = page_lines[:20]
                    debug_info["lines_per_page"].append(len(page_lines))
                    all_lines.extend(page_lines)
        except Exception as e:
            logger.error(f"pdfplumber extraction error: {e}")
            debug_info["errors"].append(f"pdfplumber: {e}")
        debug_info["tables_found"] = tables_found
        # 2. If no lines found, fallback to fitz
        if not all_lines:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                debug_info["pages"] = doc.page_count
                methods_used.append("fitz")
                for page_num in range(doc.page_count):
                    page = doc.load_page(page_num)
                    text = page.get_text("text")
                    page_lines = [line.strip() for line in text.split('\n')]
                    if page_num == 0:
                        debug_info["first_20_lines"] = page_lines[:20]
                    debug_info["lines_per_page"].append(len(page_lines))
                    all_lines.extend(page_lines)
                doc.close()
            except Exception as e:
                logger.error(f"fitz extraction error: {e}")
                debug_info["errors"].append(f"fitz: {e}")
        # 3. Regex match for transaction lines
        txn_pattern = re.compile(r'(\d{2}-\d{2}-\d{4}).*?([\u20B9₹RsINR]+\s*\d+[,.\d]*)', re.IGNORECASE)
        for line in all_lines:
            if not line:
                continue
            match = txn_pattern.search(line)
            if match:
                logger.info(f"Found line: {line}")
                sample_matches.append(line)
                # Extract date, description, amount
                date_str = match.group(1)
                amount_str = match.group(2)
                desc = line
                try:
                    date = pd.to_datetime(date_str, format='%d-%m-%Y')
                except Exception:
                    date = pd.Timestamp.now()
                # Clean amount
                amount = float(re.sub(r'[^\d.]', '', amount_str.replace(',', '')))
                is_debit = any(word in line.lower() for word in ['dr', 'debit', 'paid', 'sent', 'payment'])
                if is_debit:
                    amount = -amount
                transactions.append({
                    'date': date,
                    'description': desc,
                    'amount': amount,
                    'category': 'PhonePe'
                })
        debug_info["transactions_found"] = len(transactions)
        debug_info["sample_matches"] = sample_matches[:5]
        debug_info["methods_used"] = methods_used
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