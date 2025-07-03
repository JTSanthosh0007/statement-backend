from parsers.canara_parser import parse_canara_statement, get_category_breakdown
from flask import Blueprint, request, jsonify
import io
import logging
import traceback
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

canara_routes = Blueprint('canara_routes', __name__)

@canara_routes.route('/analyze-canara', methods=['POST'])
def analyze_canara():
    start_time = time.time()
    logger.info("Starting Canara statement analysis")
    
    if 'file' not in request.files:
        logger.error("No file provided in request")
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        logger.error("Empty filename received")
        return jsonify({'error': 'No file selected'}), 400
        
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        logger.error(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Please upload a PDF file'}), 400
        
    try:
        logger.info(f"Processing file: {file.filename}")
        pdf_contents = file.read()
        
        # Validate PDF contents
        if len(pdf_contents) < 100:
            logger.error("PDF file appears to be empty or corrupted")
            return jsonify({'error': 'The PDF file appears to be empty or corrupted'}), 400
            
        file_stream = io.BytesIO(pdf_contents)
        
        # Try to extract tables with pdfplumber for validation
        import pdfplumber
        try:
            with pdfplumber.open(file_stream) as pdf:
                # Check if PDF is password-protected
                if pdf.is_encrypted:
                    logger.error("PDF file is password-protected")
                    return jsonify({'error': 'This PDF is password-protected. Please unlock it before uploading.'}), 400
                    
                # Check if PDF has pages
                if len(pdf.pages) == 0:
                    logger.error("PDF has no pages")
                    return jsonify({'error': 'The PDF file has no pages'}), 400
                    
                # Log page count
                logger.info(f"PDF has {len(pdf.pages)} pages")
                
                # Try to extract content from the first few pages
                for i, page in enumerate(pdf.pages[:2]):
                    tables = page.extract_tables()
                    logger.info(f"Page {i+1}: Found {len(tables)} tables")
                    
                    # Also extract text to check content
                    text = page.extract_text()
                    if text:
                        # Look for Canara Bank identifiers
                        if 'canara' in text.lower() or 'statement of account' in text.lower():
                            logger.info("PDF appears to be a Canara Bank statement")
                        
        except Exception as e:
            logger.error(f"Error in PDF validation: {str(e)}")
            # Continue with main extraction as this is just validation
        
        # Reset file pointer
        file_stream.seek(0)
        
        # Continue with PyMuPDF extraction
        import fitz
        doc = fitz.open(stream=pdf_contents, filetype="pdf")
        text = "\n".join([page.get_text() for page in doc])
        
        # Check if we extracted any meaningful text
        if not text or len(text.strip()) < 100:
            logger.error("Failed to extract text from PDF")
            return jsonify({'error': 'Could not extract text from the PDF. Please ensure it is a valid Canara Bank statement.'}), 400
            
        logger.info(f"Extracted {len(text)} characters of text")
        logger.debug(f"First 500 chars: {text[:500]}")
        
        # Parse transactions
        logger.info("Starting transaction parsing")
        transactions = parse_canara_statement(text)
        
        if not transactions:
            logger.error("No transactions found in the statement")
            return jsonify({'error': 'No transactions found in the statement. Please ensure this is a valid Canara Bank statement.'}), 400
            
        logger.info(f"Successfully parsed {len(transactions)} transactions")
        
        # Calculate summary
        total_credit = sum(t['deposits'] for t in transactions)
        total_debit = sum(t['withdrawals'] for t in transactions)
        balance = transactions[-1]['balance'] if transactions else 0
        
        # Generate category breakdown
        logger.info("Generating category breakdown")
        category_breakdown = get_category_breakdown(transactions)
        
        # Prepare response
        response = {
            'transactions': transactions,
            'summary': {
                'totalReceived': total_credit,
                'totalSpent': total_debit,
                'balance': balance,
                'creditCount': len([t for t in transactions if t['deposits'] > 0]),
                'debitCount': len([t for t in transactions if t['withdrawals'] > 0]),
                'totalTransactions': len(transactions),
                'highestAmount': max([t['deposits'] for t in transactions] + [0]),
                'lowestAmount': min([t['withdrawals'] for t in transactions] + [0]),
                'highestTransaction': max(transactions, key=lambda t: t['deposits'], default=None),
                'lowestTransaction': min(transactions, key=lambda t: t['withdrawals'], default=None)
            },
            'categoryBreakdown': category_breakdown,
            'pageCount': doc.page_count,
            'accounts': []
        }
        
        processing_time = time.time() - start_time
        logger.info(f"Analysis completed in {processing_time:.2f} seconds")
        
        return jsonify(response)
        
    except ValueError as ve:
        # Handle specific validation errors
        error_message = str(ve)
        logger.error(f"Validation error: {error_message}")
        return jsonify({'error': 'Failed to analyze Canara statement', 'details': error_message}), 400
        
    except Exception as e:
        # Handle unexpected errors
        error_message = str(e)
        logger.error(f"Error analyzing Canara statement: {error_message}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to analyze Canara statement', 'details': error_message}), 500
