from datetime import datetime
import re
from statement_parser import StatementParser

def parse_phonepe_statement(file_obj):
    """
    Parses a PhonePe bank statement using the StatementParser.
    
    Args:
        file_obj: A file-like object containing the PDF data.
        
    Returns:
        dict: A dictionary containing the extracted transaction data.
    """
    parser = StatementParser(file_obj)
    df = parser.parse()
    
    transactions = df.to_dict('records')
    
    # Calculate summary
    total_credit = df[df['amount'] > 0]['amount'].sum()
    total_debit = df[df['amount'] < 0]['amount'].sum()
    
    summary = {
        'total_credit': total_credit,
        'total_debit': total_debit,
        'net_balance': total_credit + total_debit,
        'credit_count': len(df[df['amount'] > 0]),
        'debit_count': len(df[df['amount'] < 0]),
        'total_transactions': len(df)
    }
    
    return {
        'transactions': transactions,
        'summary': summary,
        'account_info': {}  # Add account info if available
    }

def parse_phonepe_statement_old(file_path):
    """
    Parses a PhonePe bank statement and extracts transaction data.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        dict: A dictionary containing the extracted transaction data, summary,
              and other relevant information.
    """
    # Placeholder for transaction data
    transactions = []
    
    # Placeholder for summary data
    summary = {
        'total_credit': 0,
        'total_debit': 0,
        'net_balance': 0,
        'credit_count': 0,
        'debit_count': 0,
        'total_transactions': 0
    }
    
    # Placeholder for account information
    account_info = {
        'account_name': 'N/A',
        'account_number': 'N/A'
    }

    #
    # TODO: Add logic to parse the PhonePe statement PDF here
    #

    # For now, we'll return a sample transaction for testing purposes
    transactions.append({
        'date': datetime.now().strftime('%Y-%m-%d'),
        'description': 'Test Transaction',
        'amount': 100.0,
        'type': 'credit',
        'category': 'Test'
    })
    
    summary['total_credit'] = 100.0
    summary['credit_count'] = 1
    summary['total_transactions'] = 1
    summary['net_balance'] = 100.0

    return {
        'transactions': transactions,
        'summary': summary,
        'account_info': account_info
    } 