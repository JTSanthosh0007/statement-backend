import pdfplumber
import fitz  # PyMuPDF
import re
from datetime import datetime
from typing import Dict, List, Any
import PyPDF2
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_phonepe_statement(pdf_path: str) -> Dict[str, Any]:
    """
    Parse PhonePe statement PDF and extract transaction details in the format:
    Date, Time, Transaction Details, Type, Amount
    Args:
        pdf_path (str): Path to the PDF file
    Returns:
        Dict containing:
        - transactions: List of transaction details
        - pageCount: Number of pages
    """
    # Security: Check file existence and type
    if not os.path.isfile(pdf_path):
        logger.error(f"File does not exist or is not a file: {pdf_path}")
        return {'transactions': [], 'pageCount': 0}
    if not pdf_path.lower().endswith('.pdf'):
        logger.error(f"File is not a PDF: {pdf_path}")
        return {'transactions': [], 'pageCount': 0}
    
    # Get page count efficiently
    page_count = len(PyPDF2.PdfReader(pdf_path).pages)
    transactions: List[Dict[str, Any]] = []
    
    # Pre-compile regex patterns for performance
    time_regex = re.compile(r'\d{1,2}:\d{2} (am|pm|AM|PM)')
    amount_regex = re.compile(r'[^\d.]')
    
    # Start with text extraction using PyMuPDF (fitz) which is faster
    with fitz.open(pdf_path) as doc:
        all_text = ""
        for page in doc:
            all_text += page.get_text()
    
    # Try to extract using regex patterns first - fastest method
    txn_pattern = re.compile(
        r'(?P<date>[A-Za-z]{3} \d{1,2}, \d{4})\s+(?P<time>\d{1,2}:\d{2} ?[apAP][mM])?\s*(?P<details>.+?)\s+(?P<type>DEBIT|CREDIT)\s*[\u20b9INR ]+(?P<amount>[\d,]+)',
        re.IGNORECASE
    )
    
    # Process regex matches
    for match in txn_pattern.finditer(all_text):
        date_str = match.group('date')
        time_str = match.group('time') or ''
        details = match.group('details').strip()
        txn_type = match.group('type').upper()
        amount_str = match.group('amount')
        
        try:
            date_obj = datetime.strptime(f"{date_str} {time_str}".strip(), "%b %d, %Y %I:%M %p") if time_str else datetime.strptime(date_str, "%b %d, %Y")
            date_fmt = date_obj.strftime("%Y-%m-%d")
            time_fmt = date_obj.strftime("%I:%M %p") if time_str else ''
        except Exception:
            date_fmt = date_str
            time_fmt = time_str
            
        amount = float(amount_str.replace(',', ''))
        if txn_type == 'DEBIT':
            amount = -abs(amount)
        else:
            amount = abs(amount)
            
        transactions.append({
            'date': date_fmt,
            'time': time_fmt,
            'transaction_details': details,
            'type': txn_type,
            'amount': amount
        })
    
    # If no transactions found with regex, fall back to pdfplumber (more intensive but handles complex layouts)
    if not transactions:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Heuristic: Look for header row and skip
                        if (len(row) >= 4 and
                            (row[0] and "Date" in row[0]) and (row[1] and "Transaction" in row[1]) and (row[2] and "Type" in row[2]) and (row[3] and "Amount" in row[3])):
                            continue
                        if len(row) >= 4:
                            date_str = row[0].strip() if row[0] else ''
                            time_str = ''
                            # Sometimes time is in the second column
                            if row[1] and isinstance(row[1], str) and time_regex.match(row[1]):
                                time_str = row[1].strip()
                                details = row[2].strip() if len(row) > 2 and row[2] else ''
                                txn_type = row[3].strip() if len(row) > 3 and row[3] else ''
                                amount_str = row[4].strip() if len(row) > 4 and row[4] else ''
                            else:
                                details = row[1].strip() if row[1] else ''
                                txn_type = row[2].strip() if row[2] else ''
                                amount_str = row[3].strip() if row[3] else ''
                            # Parse date and time
                            dt_str = f"{date_str} {time_str}".strip()
                            try:
                                date_obj = datetime.strptime(dt_str, "%b %d, %Y %I:%M %p") if time_str else datetime.strptime(date_str, "%b %d, %Y")
                                date_fmt = date_obj.strftime("%Y-%m-%d")
                                time_fmt = date_obj.strftime("%I:%M %p") if time_str else ''
                            except Exception:
                                date_fmt = date_str
                                time_fmt = time_str
                            # Parse amount
                            amount = float(amount_regex.sub('', amount_str.replace(',', ''))) if amount_str else 0.0
                            if 'debit' in txn_type.lower():
                                amount = -abs(amount)
                            elif 'credit' in txn_type.lower():
                                amount = abs(amount)
                            transactions.append({
                                'date': date_fmt,
                                'time': time_fmt,
                                'transaction_details': details,
                                'type': txn_type,
                                'amount': amount
                            })
                            
    # Categorize transactions
    transactions = categorize_transactions(transactions)
    return {
        'transactions': transactions,
        'pageCount': page_count
    }

def categorize_phonepe_transaction(description, amount):
    """
    Improved categorization for PhonePe transactions
    """
    if not description:
        return "Others"
        
    description = str(description).strip().lower()
    
    # Common PhonePe transaction patterns
    phonepe_patterns = {
        # Food & Dining
        'Food & Dining': [
            'swiggy', 'zomato', 'dominos', 'pizza', 'food', 'restaurant', 'cafe', 'dhaba', 'kitchen',
            'hotel', 'eatery', 'meal', 'lunch', 'dinner', 'breakfast', 'biryani', 'dosa', 'idli',
            'burger', 'fries', 'chicken', 'ice cream', 'bakery', 'bake', 'coffee', 'tea', 'chai',
            'mcdonald', 'burger king', 'kfc', 'subway', 'eat', 'cafe', 'caffè', 'dhaba', 'fast food'
        ],
        
        # Groceries
        'Groceries': [
            'grocery', 'groceries', 'bigbasket', 'grofers', 'blinkit', 'zepto', 'milk', 'dairy',
            'vegetables', 'fruits', 'bread', 'eggs', 'meat', 'fish', 'rice', 'dal', 'flour', 
            'oil', 'spices', 'masala', 'supermarket', 'market', 'provision', 'dmart', 'reliance fresh',
            'more megastore', 'nature basket', 'big bazar', 'spencers'
        ],
        
        # Shopping
        'Shopping': [
            'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'tatacliq', 'nykaa', 'store',
            'buy', 'shop', 'purchase', 'mall', 'retail', 'clothing', 'apparel', 'shoes', 'footwear',
            'electronics', 'gadgets', 'online shopping', 'marketplace', 'snapdeal', 'ebay', 'croma',
            'reliance digital', 'vijay sales', 'decathlon', 'ikea', 'westside', 'shoppers stop',
            'lifestyle', 'max'
        ],
        
        # Transportation
        'Transportation': [
            'uber', 'ola', 'rapido', 'yulu', 'metro', 'irctc', 'makemytrip', 'redbus', 'goibibo',
            'taxi', 'cab', 'auto', 'rickshaw', 'bus', 'train', 'flight', 'ticket', 'travel', 'transport',
            'bike', 'ride', 'trip', 'journey', 'petrol', 'diesel', 'fuel', 'indigo', 'spicejet', 'vistara',
            'air india'
        ],
        
        # Bills & Utilities
        'Bills & Utilities': [
            'jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'tata power', 'adani', 'bescom', 'tangedco',
            'mahadiscom', 'recharge', 'electricity', 'water', 'gas', 'internet', 'broadband', 'wifi',
            'mobile', 'phone', 'bill', 'dth', 'utility', 'service', 'landline', 'connection', 'postpaid',
            'prepaid', 'payment'
        ],
        
        # EMI & Loans
        'EMI & Loans': [
            'emi', 'loan', 'credit', 'finance', 'installment', 'repayment', 'interest', 'principal',
            'hdfc loan', 'icici loan', 'sbi loan', 'axis loan', 'home loan', 'car loan', 'personal loan',
            'education loan', 'gold loan', 'consumer loan', 'bajaj finance', 'aditya birla finance'
        ],
        
        # Health & Medical
        'Health & Medical': [
            'hospital', 'clinic', 'pharmacy', 'medical', 'doctor', 'health', 'medicine', 'drug',
            'healthcare', 'dental', 'lab', 'test', 'diagnosis', 'treatment', 'consultation', 'prescription',
            'apollo', 'fortis', 'max healthcare', 'medplus', 'apollo pharmacy', 'wellness', 'vitamin',
            'supplement', 'therapy', 'ambulance'
        ],
        
        # Education
        'Education': [
            'school', 'college', 'university', 'course', 'training', 'class', 'tuition', 'education',
            'learning', 'study', 'book', 'stationery', 'fee', 'exam', 'test', 'byju', 'unacademy',
            'udemy', 'coursera', 'khan academy', 'coaching', 'student', 'academy', 'institute'
        ],
        
        # Transfer
        'Transfer': [
            'transfer', 'sent', 'received', 'upi', 'phonepe', 'gpay', 'paytm', 'payment', 'pay',
            'wallet', 'send money', 'money transfer', 'account transfer', 'bank transfer', 'transaction',
            'refund', 'cashback', 'reversal', 'return'
        ],
        
        # Investments
        'Investments': [
            'investment', 'mutual fund', 'stock', 'share', 'equity', 'demat', 'trading', 'portfolio',
            'dividend', 'groww', 'zerodha', 'upstox', 'coin', 'etf', 'bond', 'fd', 'fixed deposit',
            'sip', 'systematic investment', 'nps', 'ppf', 'gold', 'crypto', 'bitcoin'
        ]
    }
    
    # Check for matches in each category
    for category, keywords in phonepe_patterns.items():
        for keyword in keywords:
            if keyword in description:
                return category
    
    # Special handling for transfers with amount direction
    if any(word in description for word in ['transfer', 'sent', 'received']):
        if amount > 0:
            return 'Transfer'
        else:
            return 'Transfer'
    
    # Default category
    if 'received' in description or 'refund' in description or 'cashback' in description:
        return 'Income'
        
    return 'Others'

def categorize_transactions(transactions):
    """
    Apply categorization to all transactions
    """
    for transaction in transactions:
        details = str(transaction.get('transaction_details', '') or '')
        amount = transaction.get('amount', 0)
        transaction['category'] = categorize_phonepe_transaction(details, amount)
        
    return transactions

def guess_category(details: str) -> str:
    """Legacy function kept for backward compatibility"""
    return categorize_phonepe_transaction(details, 0) 