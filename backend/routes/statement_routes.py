import io
import fitz  # PyMuPDF
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from parsers.kotak_parser import parse_kotak_statement
from statement_parser import StatementParser

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
        
        # Calculate highest and lowest amounts
        highest_amount = df['amount'].max() if not df.empty else 0
        lowest_amount = df['amount'].min() if not df.empty else 0
        
        # Find transactions with highest and lowest amounts
        highest_transaction = df.loc[df['amount'].idxmax()].to_dict() if not df.empty else None
        lowest_transaction = df.loc[df['amount'].idxmin()].to_dict() if not df.empty else None
        
        summary_details = {
            'totalReceived': total_credit,
            'totalSpent': total_debit,
            'balance': total_credit + total_debit,
            'creditCount': len(df[df['amount'] > 0]),
            'debitCount': len(df[df['amount'] < 0]),
            'totalTransactions': len(df),
            'highestAmount': highest_amount,
            'lowestAmount': lowest_amount,
            'highestTransaction': highest_transaction,
            'lowestTransaction': lowest_transaction
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

        # Calculate highest and lowest amounts
        transactions = result['transactions']
        if transactions:
            amounts = [t['amount'] for t in transactions]
            highest_amount = max(amounts)
            lowest_amount = min(amounts)
            
            # Find transactions with highest and lowest amounts
            highest_transaction = next((t for t in transactions if t['amount'] == highest_amount), None)
            lowest_transaction = next((t for t in transactions if t['amount'] == lowest_amount), None)
        else:
            highest_amount = 0
            lowest_amount = 0
            highest_transaction = None
            lowest_transaction = None

        # Format the response
        response = {
            'transactions': result['transactions'],
            'summary': {
                'totalReceived': result['summary']['total_credit'],
                'totalSpent': result['summary']['total_debit'],
                'balance': result['summary']['net_balance'],
                'creditCount': result['summary']['credit_count'],
                'debitCount': result['summary']['debit_count'],
                'totalTransactions': result['summary']['total_transactions'],
                'highestAmount': highest_amount,
                'lowestAmount': lowest_amount,
                'highestTransaction': highest_transaction,
                'lowestTransaction': lowest_transaction
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

def parse_statement(file_stream, statement_type):
    """Parse statement using the StatementParser class."""
    try:
        from statement_parser import StatementParser
        parser = StatementParser(file_stream)
        df = parser.parse()
        
        if df.empty:
            return {
                'transactions': [],
                'summary': {
                    'total_credit': 0,
                    'total_debit': 0,
                    'net_balance': 0,
                    'credit_count': 0,
                    'debit_count': 0,
                    'total_transactions': 0
                },
                'pages': []
            }
        
        # Convert DataFrame to list of dictionaries
        transactions = []
        for _, row in df.iterrows():
            transactions.append({
                'date': row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                'amount': float(row['amount']),
                'description': str(row['description']),
                'category': str(row['category'])
            })
        
        # Calculate summary
        total_credit = df[df['amount'] > 0]['amount'].sum()
        total_debit = df[df['amount'] < 0]['amount'].sum()
        credit_count = len(df[df['amount'] > 0])
        debit_count = len(df[df['amount'] < 0])
        
        return {
            'transactions': transactions,
            'summary': {
                'total_credit': float(total_credit),
                'total_debit': float(total_debit),
                'net_balance': float(total_credit + total_debit),
                'credit_count': int(credit_count),
                'debit_count': int(debit_count),
                'total_transactions': len(df)
            },
            'pages': []
        }
        
    except Exception as e:
        print(f"Error parsing statement: {e}")
        return {
            'transactions': [],
            'summary': {
                'total_credit': 0,
                'total_debit': 0,
                'net_balance': 0,
                'credit_count': 0,
                'debit_count': 0,
                'total_transactions': 0
            },
            'pages': []
        } 