import pdfplumber
import fitz  # PyMuPDF
import re
from datetime import datetime
from typing import Dict, List, Any
import PyPDF2
import io
import logging

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
    page_count = len(PyPDF2.PdfReader(pdf_path).pages)
    transactions = []

    # Try extracting tables with pdfplumber first
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    # Heuristic: Look for header row and skip
                    if (len(row) >= 4 and
                        ("Date" in row[0] and "Transaction" in row[1] and "Type" in row[2] and "Amount" in row[3])):
                        continue
                    if len(row) >= 4:
                        date_str = row[0].strip() if row[0] else ''
                        time_str = ''
                        # Sometimes time is in the second column
                        if re.match(r'\d{1,2}:\d{2} (am|pm|AM|PM)', row[1] or ''):
                            time_str = row[1].strip()
                            details = row[2].strip() if len(row) > 2 else ''
                            txn_type = row[3].strip() if len(row) > 3 else ''
                            amount_str = row[4].strip() if len(row) > 4 else ''
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
                        amount = float(re.sub(r'[^\d.]', '', amount_str.replace(',', ''))) if amount_str else 0.0
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
    # If no transactions found, fallback to text extraction with fitz
    if not transactions:
        doc = fitz.open(pdf_path)
        all_text = "\n".join([page.get_text("text") for page in doc])
        doc.close()
        # Regex pattern for lines like: Feb 14, 2025 07:26 pm Paid to ... DEBIT ₹10,264
        txn_pattern = re.compile(
            r'(?P<date>[A-Za-z]{3} \d{1,2}, \d{4})\s+(?P<time>\d{1,2}:\d{2} ?[apAP][mM])?\s*(?P<details>.+?)\s+(?P<type>DEBIT|CREDIT)\s*[₹INR ]+(?P<amount>[\d,]+)',
            re.IGNORECASE
        )
        for match in txn_pattern.finditer(all_text):
            date_str = match.group('date')
            time_str = match.group('time') or ''
            details = match.group('details').strip()
            txn_type = match.group('type').upper()
            amount_str = match.group('amount')
            try:
                date_obj = datetime.strptime(f"{date_str} {time_str}", "%b %d, %Y %I:%M %p") if time_str else datetime.strptime(date_str, "%b %d, %Y")
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
    transactions = categorize_transactions(transactions)
    return {
        'transactions': transactions,
        'pageCount': page_count
    }

def categorize_phonepe_transaction(description, amount):
    description = description.lower()
    # Comprehensive categories
    categories = {
        'Food & Dining': ['food', 'restaurant', 'cafe', 'coffee', 'swiggy', 'zomato', 'hotel', 'eatery', 'kitchen', 'dine', 'meal', 'lunch', 'dinner', 'breakfast'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'shop', 'store', 'retail', 'purchase', 'buy', 'mart', 'mall', 'bazaar', 'market'],
        'Transportation': ['uber', 'ola', 'metro', 'bus', 'train', 'flight', 'airline', 'travel', 'taxi', 'cab', 'auto', 'rickshaw', 'petrol', 'diesel', 'fuel'],
        'Entertainment': ['movie', 'theatre', 'netflix', 'prime', 'hotstar', 'disney', 'show', 'concert', 'event', 'ticket', 'game', 'gaming', 'play'],
        'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'bill', 'recharge', 'dth', 'broadband', 'wifi', 'utility', 'service'],
        'Health & Medical': ['hospital', 'clinic', 'pharmacy', 'medical', 'doctor', 'health', 'medicine', 'drug', 'healthcare', 'dental', 'lab', 'test'],
        'Education': ['school', 'college', 'university', 'course', 'training', 'class', 'tuition', 'education', 'learning', 'study', 'book', 'stationery'],
        'Travel': ['hotel', 'booking', 'trip', 'travel', 'tour', 'vacation', 'holiday', 'resort', 'stay', 'accommodation'],
        'Personal Care': ['salon', 'spa', 'beauty', 'gym', 'fitness', 'parlour', 'cosmetics', 'grooming', 'wellness'],
        'Investments': ['investment', 'mutual fund', 'stock', 'share', 'equity', 'demat', 'trading', 'portfolio', 'dividend', 'interest'],
        'Insurance': ['insurance', 'policy', 'premium', 'coverage', 'claim', 'life', 'health', 'vehicle'],
        'Rent': ['rent', 'lease', 'housing', 'accommodation', 'property'],
        'EMI & Loans': ['emi', 'loan', 'credit', 'finance', 'installment', 'repayment'],
        'Gifts & Donations': ['gift', 'donation', 'charity', 'contribute', 'present', 'offering'],
        'Taxes & Fees': ['tax', 'gst', 'fee', 'charge', 'penalty', 'fine'],
        'Transfer': ['transfer', 'sent', 'received', 'upi', 'phonepe', 'gpay', 'paytm', 'payment', 'pay', 'wallet'],
    }
    # PhonePe specific merchants and categories
    phonepe_categories = {
        'Food & Dining': ['swiggy', 'zomato', 'dominos', 'pizza', 'food', 'restaurant', 'cafe', 'dhaba', 'kitchen'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'tatacliq', 'nykaa', 'bigbasket', 'grofers', 'blinkit', 'zepto'],
        'Transportation': ['uber', 'ola', 'rapido', 'yulu', 'metro', 'irctc', 'makemytrip', 'redbus', 'goibibo'],
        'Entertainment': ['bookmyshow', 'netflix', 'primevideo', 'hotstar', 'disney', 'sony', 'zee5', 'jiocinema'],
        'Bills & Utilities': ['jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'tata power', 'adani', 'bescom', 'tangedco', 'mahadiscom', 'recharge'],
    }
    # First check for PhonePe specific merchants
    for category, keywords in phonepe_categories.items():
        if any(keyword in description for keyword in keywords):
            return category
    # Then check general categories
    for category, keywords in categories.items():
        if any(keyword in description for keyword in keywords):
            return category
    # Default category
    if 'received' in description or 'refund' in description or 'cashback' in description:
        return 'Income'
    return 'Others'

def categorize_transactions(transactions):
    for transaction in transactions:
        details = transaction.get('transaction_details', '')
        amount = transaction.get('amount', 0)
        transaction['category'] = categorize_phonepe_transaction(details, amount)
        logger.debug(f"[DEBUG] Categorized transaction: {transaction}")
    return transactions

def guess_category(details: str) -> str:
    details = details.lower()
    if "amazon" in details:
        return "Shopping"
    if "swiggy" in details or "zomato" in details:
        return "Food"
    if "paytm" in details:
        return "Wallet"
    if "electricity" in details or "power" in details or "bescom" in details:
        return "Utilities"
    if "petrol" in details or "fuel" in details or "indianoil" in details:
        return "Fuel"
    if "rent" in details:
        return "Rent"
    if "salary" in details or "credited by" in details:
        return "Salary"
    if "phonepe" in details:
        return "UPI Transfer"
    # Add more rules based on your statement's real descriptions!
    return "Others" 