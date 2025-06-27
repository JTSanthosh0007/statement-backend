from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn
from statement_parser import StatementParser
import io
import fitz  # PyMuPDF
import pdfplumber
import pandas as pd
import re
import logging
import time
import os
import tempfile
from parsers.kotak_parser import parse_kotak_statement
from parsers.phonepe_parser import parse_phonepe_statement
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Statement Analyzer API", version="1.0.0")

# Increase max upload size (example: 100 MB)
class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        max_body_size = 100 * 1024 * 1024  # 100 MB
        if int(request.headers.get("content-length", 0)) > max_body_size:
            from starlette.responses import Response
            return Response("File too large", status_code=413)
        return await call_next(request)

app.add_middleware(LimitUploadSizeMiddleware)

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
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            results = parse_phonepe_statement(tmp_path)
            if not results or 'transactions' not in results:
                logger.warning("No transactions extracted from PhonePe statement.")
                return {
                    "transactions": [],
                    "summary": {"totalSpent": 0, "totalReceived": 0},
                    "categoryBreakdown": {},
                    "pageCount": 0
                }
            transactions = results.get('transactions', [])
            # Calculate summary
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
            # Build category breakdown (optional, can be extended)
            category_map = {}
            for t in transactions:
                cat = t.get('type', 'Others')
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
            logger.error(f"Error parsing PhonePe statement: {e}")
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
        logger.error(f"Error in /analyze-phonepe endpoint: {e}")
        return {
            "transactions": [],
            "summary": {"totalSpent": 0, "totalReceived": 0},
            "categoryBreakdown": {},
            "pageCount": 0,
            "error": str(e)
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
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            results = parse_kotak_statement(tmp_path)
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