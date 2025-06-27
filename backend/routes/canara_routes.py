from parsers.canara_parser import parse_canara_statement
from flask import Blueprint, request, jsonify
import io

canara_routes = Blueprint('canara_routes', __name__)

@canara_routes.route('/analyze-canara', methods=['POST'])
def analyze_canara():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    try:
        pdf_contents = file.read()
        file_stream = io.BytesIO(pdf_contents)
        import fitz
        doc = fitz.open(stream=pdf_contents, filetype="pdf")
        text = "\n".join([page.get_text() for page in doc])
        transactions = parse_canara_statement(text)
        # Calculate summary
        total_credit = sum(t['deposits'] for t in transactions)
        total_debit = sum(t['withdrawals'] for t in transactions)
        balance = transactions[-1]['balance'] if transactions else 0
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
            'categoryBreakdown': {},
            'pageCount': doc.page_count,
            'accounts': []
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': 'Failed to analyze Canara statement', 'details': str(e)}), 500
