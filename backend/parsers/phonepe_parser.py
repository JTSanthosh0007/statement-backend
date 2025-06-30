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

def categorize_phonepe_transaction(details, amount):
    details = details.lower()
    # Kotak-style rules
    if 'salary' in details:
        return 'income'
    if 'swiggy' in details or 'zomato' in details or 'restaurant' in details:
        return 'food'
    if 'upi' in details or 'imps' in details or 'neft' in details:
        return 'transfer'
    if 'atm' in details or 'cash withdrawal' in details:
        return 'transfer'
    if 'pos ' in details or 'pos/' in details:
        return 'shopping'
    if 'emi' in details or 'loan' in details:
        return 'finance'
    categories = {
        'food': ['restaurant', 'food', 'swiggy', 'zomato', 'dining', 'cafe', 'hotel'],
        'shopping': ['amazon', 'flipkart', 'myntra', 'retail', 'store', 'shop', 'mall'],
        'travel': ['uber', 'ola', 'metro', 'petrol', 'fuel', 'travel', 'irctc', 'railway'],
        'bills': ['electricity', 'water', 'gas', 'mobile', 'phone', 'internet', 'dth', 'recharge'],
        'entertainment': ['movie', 'netflix', 'prime', 'hotstar', 'subscription'],
        'finance': ['emi', 'loan', 'interest', 'insurance', 'premium', 'investment'],
        'health': ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine'],
        'education': ['school', 'college', 'tuition', 'course', 'fee'],
        'income': ['salary', 'interest earned', 'dividend', 'refund', 'cashback'],
        'transfer': ['transfer', 'sent', 'received', 'payment', 'deposit', 'withdraw']
    }
    for category, keywords in categories.items():
        if any(keyword in details for keyword in keywords):
            return category
    if amount and amount > 10000:
        if amount > 0:
            return 'income'
        else:
            return 'finance'
    return 'miscellaneous expenses'

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