from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn
from statement_parser import StatementParser
import io
import fitz
import pdfplumber
import pandas as pd
import re
import logging
import time
from parsers.kotak_parser import parse_kotak_statement

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
            "/unlock-pdf": "Unlock password-protected PDF files",
            "/analyze-kotak": "Analyze Kotak statements"
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
            
            # Calculate category breakdown
            category_breakdown = {}
            for t in transactions:
                if t['amount'] < 0:  # Only consider spending
                    category = t['category']
                    category_breakdown[category] = category_breakdown.get(category, 0) + t['amount']
            
            # Calculate summary statistics
            total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
            total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)
            
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
        start_time = time.time()
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        content = await file.read()
        transactions = []
        methods_used = []
        tables_found = 0
        # 1. Try pdfplumber for tables (PhonePe format) in batches
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                debug_info["pages"] = len(pdf.pages)
                methods_used.append("pdfplumber")
                if len(pdf.pages) > 800:
                    logger.warning(f"PDF has {len(pdf.pages)} pages, which exceeds the supported limit.")
                    raise HTTPException(status_code=400, detail="PDF too large to analyze (over 800 pages). Please upload a smaller file.")
                if len(pdf.pages) > 100:
                    logger.warning(f"Large PDF detected: {len(pdf.pages)} pages.")
                batch_size = 20  # Set batch size to 20
                batch_times = []
                for batch_start in range(0, len(pdf.pages), batch_size):
                    batch_end = min(batch_start + batch_size, len(pdf.pages))
                    logger.info(f"Processing pages {batch_start+1} to {batch_end} of {len(pdf.pages)} (batch size: {batch_size})")
                    batch_time_start = time.time()
                    for page_num in range(batch_start, batch_end):
                        page = pdf.pages[page_num]
                        page_lines = []
                        tables = page.extract_tables()
                        if tables:
                            tables_found += len(tables)
                            for table in tables:
                                for row in table:
                                    if (len(row) >= 4 and
                                        ("Date" in row[0] and "Transaction" in row[1] and "Type" in row[2] and "Amount" in row[3])):
                                        continue  # skip header
                                    if len(row) >= 4:
                                        date_str = row[0].strip() if row[0] else ''
                                        time_str = ''
                                        if re.match(r'\d{1,2}:\d{2} (am|pm|AM|PM)', row[1] or ''):
                                            time_str = row[1].strip()
                                            details = row[2].strip() if len(row) > 2 else ''
                                            txn_type = row[3].strip() if len(row) > 3 else ''
                                            amount_str = row[4].strip() if len(row) > 4 else ''
                                        else:
                                            details = row[1].strip() if row[1] else ''
                                            txn_type = row[2].strip() if row[2] else ''
                                            amount_str = row[3].strip() if row[3] else ''
                                        dt_str = f"{date_str} {time_str}".strip()
                                        try:
                                            date = pd.to_datetime(dt_str, errors='coerce')
                                        except Exception:
                                            date = pd.NaT
                                        amount = float(re.sub(r'[^\d.]', '', amount_str.replace(',', ''))) if amount_str else 0.0
                                        if 'debit' in txn_type.lower():
                                            amount = -abs(amount)
                                        elif 'credit' in txn_type.lower():
                                            amount = abs(amount)
                                        else:
                                            if 'dr' in amount_str.lower():
                                                amount = -abs(amount)
                                            elif 'cr' in amount_str.lower():
                                                amount = abs(amount)
                                        transactions.append({
                                            'date': date,
                                            'description': details,
                                            'amount': amount,
                                            'category': 'PhonePe',
                                            'type': txn_type
                                        })
                    batch_time_end = time.time()
                    batch_times.append(batch_time_end - batch_time_start)
                # Estimate total time after first batch
                if batch_times:
                    avg_batch_time = sum(batch_times) / len(batch_times)
                    total_batches = (len(pdf.pages) + batch_size - 1) // batch_size
                    estimated_seconds = int(avg_batch_time * total_batches)
                else:
                    estimated_seconds = 0
                # Print first 20 lines of first page for debugging
                if len(pdf.pages) > 0:
                    first_page_text = pdf.pages[0].extract_text() or ''
                    logger.warning('First 20 lines of first page:')
                    for i, line in enumerate(first_page_text.split('\n')[:20]):
                        logger.warning(f'{i+1}: {line}')
        except Exception as e:
            logger.error(f"pdfplumber extraction error: {e}")
            debug_info["errors"].append(f"pdfplumber: {e}")
        debug_info["tables_found"] = tables_found
        # 2. If no transactions, fallback to fitz text/regex
        if not transactions:
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
                doc.close()
            except Exception as e:
                logger.error(f"fitz extraction error: {e}")
                debug_info["errors"].append(f"fitz: {e}")
            # Regex match for transaction lines
            txn_pattern = re.compile(r'(\w+ \d{2}, \d{4}).*?(CREDIT|DEBIT).*?([\u20B9₹RsINR]+\s*\d+[,.\d]*)', re.IGNORECASE)
            for line in page_lines:
                if not line:
                    continue
                match = txn_pattern.search(line)
                if match:
                    date_str = match.group(1)
                    txn_type = match.group(2)
                    amount_str = match.group(3)
                    try:
                        date = pd.to_datetime(date_str, errors='coerce')
                    except Exception:
                        date = pd.NaT
                    amount = float(re.sub(r'[^\d.]', '', amount_str.replace(',', '')))
                    if 'debit' in txn_type.lower():
                        amount = -abs(amount)
                    elif 'credit' in txn_type.lower():
                        amount = abs(amount)
                    transactions.append({
                        'date': date,
                        'description': line,
                        'amount': amount,
                        'category': 'PhonePe',
                        'type': txn_type
                    })
        debug_info["transactions_found"] = len(transactions)
        debug_info["methods_used"] = methods_used
        # 3. Always return a valid response
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
        credit_count = sum(1 for t in transactions if t['amount'] > 0)
        debit_count = sum(1 for t in transactions if t['amount'] < 0)
        total_transactions = len(transactions)
        # Calculate highest and lowest amounts
        if transactions:
            amounts = [abs(t['amount']) for t in transactions if abs(t['amount']) > 0]
            if amounts:
                highest_amount = max(amounts)
                lowest_amount = min(amounts)
                highest_transaction = next((t for t in transactions if abs(t['amount']) == highest_amount), None)
                lowest_transaction = next((t for t in transactions if abs(t['amount']) == lowest_amount), None)
            else:
                highest_amount = 0
                lowest_amount = 0
                highest_transaction = None
                lowest_transaction = None
        else:
            highest_amount = 0
            lowest_amount = 0
            highest_transaction = None
            lowest_transaction = None
        # Build category breakdown
        category_map = {}
        for t in transactions:
            cat = t.get('category', 'Others')
            if cat not in category_map:
                category_map[cat] = {'amount': 0, 'count': 0}
            category_map[cat]['amount'] += abs(t['amount']) if t['amount'] < 0 else 0
            if t['amount'] < 0:
                category_map[cat]['count'] += 1
        # Calculate percentages
        for cat in category_map:
            amt = category_map[cat]['amount']
            category_map[cat]['percentage'] = (amt / abs(total_spent) * 100) if total_spent else 0
        debug_info["analysis_time_seconds"] = round(time.time() - start_time, 2)
        return {
            "transactions": df.to_dict('records'),
            "summary": {
                "totalSpent": total_spent,
                "totalReceived": total_received,
                "creditCount": credit_count,
                "debitCount": debit_count,
                "totalTransactions": total_transactions,
                "highestAmount": highest_amount,
                "lowestAmount": lowest_amount,
                "highestTransaction": highest_transaction,
                "lowestTransaction": lowest_transaction
            },
            "categoryBreakdown": category_map,
            "pageCount": debug_info["pages"],
            "debug": debug_info,
            "estimated_seconds": estimated_seconds
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
        content = await file.read()
        import PyPDF2
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            if pdf_reader.is_encrypted:
                if not pdf_reader.decrypt(password):
                    raise Exception("Incorrect password or unable to decrypt PDF.")
            pdf_writer = PyPDF2.PdfWriter()
            for page in pdf_reader.pages:
                pdf_writer.add_page(page)
            output_stream = io.BytesIO()
            pdf_writer.write(output_stream)
            output_stream.seek(0)
            return StreamingResponse(output_stream, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=unlocked_{file.filename}"})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error unlocking PDF: {str(e)}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-kotak")
async def analyze_kotak_statement(file: UploadFile = File(...)):
    logger = logging.getLogger(__name__)
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        content = await file.read()
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            results = parse_kotak_statement(tmp_path)
            os.unlink(tmp_path)
            if not results or 'transactions' not in results:
                logger.warning("No transactions extracted from Kotak statement.")
                return {
                    "transactions": [],
                    "summary": {"totalSpent": 0, "totalReceived": 0},
                    "categoryBreakdown": {},
                    "pageCount": 0
                }
            # Transform results to match frontend expectations
            transactions = results.get('transactions', [])
            # Calculate summary and category breakdown like PhonePe
            total_spent = sum(t['amount'] for t in transactions if t['amount'] < 0)
            total_received = sum(t['amount'] for t in transactions if t['amount'] > 0)
            credit_count = sum(1 for t in transactions if t['amount'] > 0)
            debit_count = sum(1 for t in transactions if t['amount'] < 0)
            total_transactions = len(transactions)
            # Calculate highest and lowest amounts
            if transactions:
                amounts = [abs(t['amount']) for t in transactions if abs(t['amount']) > 0]
                if amounts:
                    highest_amount = max(amounts)
                    lowest_amount = min(amounts)
                    highest_transaction = next((t for t in transactions if abs(t['amount']) == highest_amount), None)
                    lowest_transaction = next((t for t in transactions if abs(t['amount']) == lowest_amount), None)
                else:
                    highest_amount = 0
                    lowest_amount = 0
                    highest_transaction = None
                    lowest_transaction = None
            else:
                highest_amount = 0
                lowest_amount = 0
                highest_transaction = None
                lowest_transaction = None
            # Build category breakdown
            category_map = {}
            for t in transactions:
                cat = t.get('category', 'Others')
                if cat not in category_map:
                    category_map[cat] = {'amount': 0, 'count': 0}
                category_map[cat]['amount'] += abs(t['amount']) if t['amount'] < 0 else 0
                if t['amount'] < 0:
                    category_map[cat]['count'] += 1
            for cat in category_map:
                amt = category_map[cat]['amount']
                category_map[cat]['percentage'] = (amt / abs(total_spent) * 100) if total_spent else 0
            page_count = results.get('pageCount', 0)
            return {
                "transactions": transactions,
                "summary": {
                    "totalSpent": total_spent,
                    "totalReceived": total_received,
                    "creditCount": credit_count,
                    "debitCount": debit_count,
                    "totalTransactions": total_transactions,
                    "highestAmount": highest_amount,
                    "lowestAmount": lowest_amount,
                    "highestTransaction": highest_transaction,
                    "lowestTransaction": lowest_transaction
                },
                "categoryBreakdown": category_map,
                "pageCount": page_count
            }
        except Exception as e:
            logger.error(f"Error parsing Kotak statement: {e}")
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return {
                "transactions": [],
                "summary": {"totalSpent": 0, "totalReceived": 0},
                "categoryBreakdown": {},
                "pageCount": 0,
                "error": str(e)
            }
    except Exception as e:
        logger.error(f"Error in /analyze-kotak endpoint: {e}")
        return {
            "transactions": [],
            "summary": {"totalSpent": 0, "totalReceived": 0},
            "categoryBreakdown": {},
            "pageCount": 0,
            "error": str(e)
        }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 