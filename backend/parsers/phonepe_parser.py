import pdfplumber
import fitz  # PyMuPDF
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
import PyPDF2
import logging
import os
import io
from functools import lru_cache
import concurrent.futures
from multiprocessing import cpu_count

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pre-compile regex patterns for global use
TIME_REGEX = re.compile(r'\d{1,2}:\d{2} (am|pm|AM|PM)')
AMOUNT_REGEX = re.compile(r'[^\d.]')
TXN_PATTERN = re.compile(
    r'(?P<date>[A-Za-z]{3} \d{1,2}, \d{4})\s+(?P<time>\d{1,2}:\d{2} ?[apAP][mM])?\s*(?P<details>.+?)\s+(?P<type>DEBIT|CREDIT)\s*[\u20b9INR ]+(?P<amount>[\d,]+)',
    re.IGNORECASE
)

@lru_cache(maxsize=128)
def parse_date_time(date_str: str, time_str: str = '') -> Tuple[str, str]:
    """Parse date and time strings with caching for performance"""
    try:
        if time_str:
            date_obj = datetime.strptime(f"{date_str} {time_str}".strip(), "%b %d, %Y %I:%M %p")
            return date_obj.strftime("%Y-%m-%d"), date_obj.strftime("%I:%M %p")
        else:
            date_obj = datetime.strptime(date_str, "%b %d, %Y")
            return date_obj.strftime("%Y-%m-%d"), ''
    except Exception:
        return date_str, time_str

def extract_text_from_page(page) -> str:
    """Extract text from a PDF page using PyMuPDF"""
    return page.get_text()

def process_regex_match(match) -> Dict[str, Any]:
    """Process a single regex match into a transaction dictionary"""
    date_str = match.group('date')
    time_str = match.group('time') or ''
    details = match.group('details').strip()
    txn_type = match.group('type').upper()
    amount_str = match.group('amount')
    
    date_fmt, time_fmt = parse_date_time(date_str, time_str)
    
    amount = float(amount_str.replace(',', ''))
    if txn_type == 'DEBIT':
        amount = -abs(amount)
    else:
        amount = abs(amount)
        
    return {
        'date': date_fmt,
        'time': time_fmt,
        'transaction_details': details,
        'type': txn_type,
        'amount': amount
    }

def extract_transactions_with_regex(text: str) -> List[Dict[str, Any]]:
    """Extract transactions using regex with early return optimization"""
    transactions = []
    for match in TXN_PATTERN.finditer(text):
        transactions.append(process_regex_match(match))
    return transactions

def process_table_row(row) -> Dict[str, Any]:
    """Process a single table row into a transaction dictionary"""
    if len(row) < 4:
        return None
    
    date_str = row[0].strip() if row[0] else ''
    time_str = ''
    
    # Skip header rows
    if date_str and "Date" in date_str:
        return None
    
    # Sometimes time is in the second column
    if row[1] and isinstance(row[1], str) and TIME_REGEX.match(row[1]):
        time_str = row[1].strip()
        details = row[2].strip() if len(row) > 2 and row[2] else ''
        txn_type = row[3].strip() if len(row) > 3 and row[3] else ''
        amount_str = row[4].strip() if len(row) > 4 and row[4] else ''
    else:
        details = row[1].strip() if row[1] else ''
        txn_type = row[2].strip() if row[2] else ''
        amount_str = row[3].strip() if row[3] else ''
    
    # Parse date and time
    date_fmt, time_fmt = parse_date_time(date_str, time_str)
    
    # Parse amount
    if not amount_str:
        return None
    
    amount = float(AMOUNT_REGEX.sub('', amount_str.replace(',', '')))
    if 'debit' in txn_type.lower():
        amount = -abs(amount)
    elif 'credit' in txn_type.lower():
        amount = abs(amount)
    
    return {
        'date': date_fmt,
        'time': time_fmt,
        'transaction_details': details,
        'type': txn_type,
        'amount': amount
    }

def process_page_tables(page) -> List[Dict[str, Any]]:
    """Process all tables in a page"""
    transactions = []
    tables = page.extract_tables()
    for table in tables:
        for row in table:
            transaction = process_table_row(row)
            if transaction:
                transactions.append(transaction)
    return transactions

def parse_phonepe_statement(pdf_path: str) -> Dict[str, Any]:
    """
    Parse PhonePe statement PDF and extract transaction details with optimized performance
    
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
    
    try:
        # Get page count efficiently
        with open(pdf_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            page_count = len(pdf_reader.pages)
    except Exception as e:
        logger.error(f"Error getting page count: {e}")
        return {'transactions': [], 'pageCount': 0}
    
    transactions = []
    
    # Step 1: Fast extraction using PyMuPDF (fitz) with parallel processing
    try:
        doc = fitz.open(pdf_path)
        num_cores = min(cpu_count(), doc.page_count, 8)  # Limit to 8 cores max
        
        # Use parallel processing to extract text from pages
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_cores) as executor:
            page_texts = list(executor.map(extract_text_from_page, [doc[i] for i in range(doc.page_count)]))
        
        all_text = "".join(page_texts)
        doc.close()
        
        # Try to extract using regex patterns first - fastest method
        transactions = extract_transactions_with_regex(all_text)
        
        # If regex found transactions, return early
        if transactions:
            # Categorize transactions
            transactions = categorize_transactions(transactions)
            return {
                'transactions': transactions,
                'pageCount': page_count
            }
    except Exception as e:
        logger.warning(f"Error in fast extraction method: {e}")
    
    # Step 2: Fall back to pdfplumber (more intensive but handles complex layouts)
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_transactions = process_page_tables(page)
                transactions.extend(page_transactions)
    except Exception as e:
        logger.error(f"Error in fallback extraction method: {e}")
    
    # Categorize transactions
    transactions = categorize_transactions(transactions)
    return {
        'transactions': transactions,
        'pageCount': page_count
    }

# Category keywords cache
CATEGORY_KEYWORDS = {
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

@lru_cache(maxsize=256)
def categorize_phonepe_transaction(description, amount):
    """
    Optimized categorization for PhonePe transactions with caching
    """
    if not description:
        return "Others"
        
    description = str(description).strip().lower()
    
    # Check for matches in each category
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in description:
                return category
    
    # Special handling for transfers with amount direction
    if any(word in description for word in ['transfer', 'sent', 'received']):
        return 'Transfer'
    
    # Default category
    if 'received' in description or 'refund' in description or 'cashback' in description:
        return 'Income'
        
    return 'Others'

def categorize_transactions(transactions):
    """
    Apply categorization to all transactions in parallel for large datasets
    """
    if not transactions:
        return []
        
    try:
        if len(transactions) > 100:  # Use parallel processing for large datasets
            with concurrent.futures.ThreadPoolExecutor() as executor:
                # Create a list of tuples (transaction, category)
                results = list(executor.map(
                    lambda t: (t, categorize_phonepe_transaction(
                        str(t.get('transaction_details', '') or ''), 
                        float(t.get('amount', 0))
                    )),
                    transactions
                ))
                
                # Update transactions with categories
                for transaction, category in results:
                    transaction['category'] = category
        else:
            # For small datasets, process sequentially
            for transaction in transactions:
                details = str(transaction.get('transaction_details', '') or '')
                amount = float(transaction.get('amount', 0))
                category = categorize_phonepe_transaction(details, amount)
                transaction['category'] = category
                
        # Verify all transactions have a category
        for transaction in transactions:
            if 'category' not in transaction or not transaction['category']:
                transaction['category'] = 'Others'
                
        # Log some sample transaction categories for debugging
        if transactions:
            sample_size = min(5, len(transactions))
            logger.info(f"Sample transaction categories (first {sample_size}):")
            for i in range(sample_size):
                logger.info(f"Transaction: {transactions[i].get('transaction_details', '')[:30]}... -> Category: {transactions[i].get('category', 'None')}")
        
        return transactions
    except Exception as e:
        logger.error(f"Error in categorize_transactions: {e}")
        # Fallback to ensure we always return something and don't break the frontend
        for transaction in transactions:
            if 'category' not in transaction or not transaction['category']:
                transaction['category'] = 'Others'
        return transactions

def guess_category(details: str) -> str:
    """Legacy function kept for backward compatibility"""
    return categorize_phonepe_transaction(details, 0) 