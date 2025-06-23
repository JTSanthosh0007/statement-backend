import io
import fitz  # PyMuPDF
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from parsers.kotak_parser import parse_kotak_statement
from parsers.statement_parser import detect_statement_type, parse_statement, StatementParser

statement_routes = Blueprint('statement_routes', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@statement_routes.route('/analyze-phonepe', methods=['POST'])
def analyze_phonepe():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file provided'}), 400
        
    try:
        # Read file into an in-memory stream
        pdf_contents = file.read()
        file_stream = io.BytesIO(pdf_contents)
        file_stream.seek(0)
        
        # Use StatementParser with the stream
        # Pass the original filename for potential use in the parser
        file_stream.name = file.filename 
        parser = StatementParser(file_stream)
        df = parser.parse()
        
        transactions = df.to_dict('records')
        
        # Calculate summary
        total_credit = df[df['amount'] > 0]['amount'].sum()
        total_debit = df[df['amount'] < 0]['amount'].sum()
        
        summary_details = {
            'totalReceived': total_credit,
            'totalSpent': total_debit,
            'balance': total_credit + total_debit,
            'creditCount': len(df[df['amount'] > 0]),
            'debitCount': len(df[df['amount'] < 0]),
            'totalTransactions': len(df)
        }
        
        # Use existing helper functions
        category_breakdown = calculate_category_breakdown(transactions)
        
        # Build the final response
        response = {
            'transactions': transactions,
            'summary': summary_details,
            'categoryBreakdown': category_breakdown,
            'pageCount': 1, # Placeholder, can be improved
            'accounts': [] # Placeholder
        }
        
        return jsonify(response)

    except Exception as e:
        # Log the full error for debugging
        print(f"Error processing PhonePe statement: {e}")
        return jsonify({
            'error': 'Failed to analyze PhonePe statement',
            'details': str(e)
        }), 500

@statement_routes.route('/analyze-statement', methods=['POST'])
def analyze_statement():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload a PDF file'}), 400

    try:
        # Read file into an in-memory stream to avoid saving to disk
        pdf_contents = file.read()
        file_stream = io.BytesIO(pdf_contents)
        file_stream.seek(0)
        file_stream.name = file.filename

        # We can't easily detect type from a stream without saving,
        # so this route might need rethinking or a different detection method.
        # For now, let's assume a generic parser is used.
        result = parse_statement(file_stream, 'unknown')

        # Format the response
        response = {
            'transactions': result['transactions'],
            'summary': {
                'totalReceived': result['summary']['total_credit'],
                'totalSpent': result['summary']['total_debit'],
                'balance': result['summary']['net_balance'],
                'creditCount': result['summary']['credit_count'],
                'debitCount': result['summary']['debit_count'],
                'totalTransactions': result['summary']['total_transactions']
            },
            'categoryBreakdown': calculate_category_breakdown(result['transactions']),
            'pageCount': len(result.get('pages', [])) if 'pages' in result else 1,
            'accounts': extract_accounts_info(result)
        }
        
        return jsonify(response)

    except Exception as e:
        return jsonify({
            'error': 'Failed to analyze statement',
            'details': str(e)
        }), 500

def calculate_category_breakdown(transactions):
    """Calculate spending breakdown by category."""
    categories = {}
    
    for transaction in transactions:
        category = transaction.get('category', 'Others')
        amount = abs(transaction['amount'])
        
        if category not in categories:
            categories[category] = {
                'amount': 0,
                'count': 0,
                'percentage': 0
            }
            
        categories[category]['amount'] += amount
        categories[category]['count'] += 1
    
    # Calculate total amount for percentage calculation
    total_amount = sum(cat['amount'] for cat in categories.values())
    
    # Calculate percentages
    for category in categories.values():
        category['percentage'] = (category['amount'] / total_amount * 100) if total_amount > 0 else 0
    
    return categories

def extract_accounts_info(result):
    """Extract accounts information from the parsing result."""
    accounts = []
    
    if 'account_info' in result:
        account_info = result['account_info']
        accounts.append({
            'accountName': account_info.get('account_name', ''),
            'accountNumber': account_info.get('account_number', ''),
            'bankLogo': 'kotak',  # You can add bank-specific logic here
            'paymentsMade': {
                'count': result['summary']['debit_count'],
                'total': result['summary']['total_debit']
            },
            'paymentsReceived': {
                'count': result['summary']['credit_count'],
                'total': result['summary']['total_credit']
            }
        })
    
    return accounts 