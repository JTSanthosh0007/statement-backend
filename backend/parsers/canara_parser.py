import re
import logging
from typing import List, Dict

def categorize_canara_transaction(description, amount):
    description = description.lower()
    # Kotak-style rules
    if 'salary' in description:
        return 'income'
    if 'swiggy' in description or 'zomato' in description or 'restaurant' in description:
        return 'food'
    if 'upi' in description or 'imps' in description or 'neft' in description:
        return 'transfer'
    if 'atm' in description or 'cash withdrawal' in description:
        return 'transfer'
    if 'pos ' in description or 'pos/' in description:
        return 'shopping'
    if 'emi' in description or 'loan' in description:
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
        if any(keyword in description for keyword in keywords):
            return category
    if amount and amount > 10000:
        if amount > 0:
            return 'income'
        else:
            return 'finance'
    return 'miscellaneous expenses'

def parse_canara_statement(text: str) -> List[Dict]:
    """
    Robustly parses Canara Bank statement text and returns a list of transactions.
    Handles multi-line particulars, Opening Balance, and both credit/debit.
    Uses reverse split for columns to handle inconsistent spacing.
    """
    # Log the raw extracted text for debugging
    logging.basicConfig(filename='canara_parser_debug.log', level=logging.INFO, format='%(asctime)s %(message)s')
    logging.info('Extracted PDF text:\n' + text)
    
    lines = text.splitlines()
    transactions = []
    current = None
    particulars_lines = []
    date_pattern = re.compile(r"^(\d{2}-\d{2}-\d{4})")
    opening_balance_line = re.compile(r"Opening Balance", re.IGNORECASE)

    for line in lines:
        line = line.rstrip()
        date_match = date_pattern.match(line)
        if date_match:
            # Save previous transaction if any
            if current:
                current['particulars'] = '\n'.join(particulars_lines).strip()
                amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
                current['category'] = categorize_canara_transaction(current['particulars'], amount)
                transactions.append(current)
                particulars_lines = []
            # Reverse split for last 3 columns (balance, withdrawals, deposits)
            parts = re.split(r'\s{2,}|\t+', line)
            parts = [p for p in parts if p.strip()]
            if len(parts) < 5:
                continue  # Not a valid transaction line
            date = parts[0]
            balance = parts[-1]
            withdrawals = parts[-2]
            deposits = parts[-3]
            particulars = ' '.join(parts[1:-3])
            if opening_balance_line.search(particulars):
                continue
            current = {
                'date': date,
                'particulars': particulars.strip(),
                'deposits': float(deposits.replace(',', '')) if deposits else 0.0,
                'withdrawals': float(withdrawals.replace(',', '')) if withdrawals else 0.0,
                'balance': float(balance.replace(',', '')) if balance else 0.0,
            }
            particulars_lines = [particulars.strip()]
        else:
            # Multi-line particulars (not a new transaction)
            if current is not None and line.strip():
                particulars_lines.append(line.strip())
    # Save last transaction
    if current:
        current['particulars'] = '\n'.join(particulars_lines).strip()
        amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
        current['category'] = categorize_canara_transaction(current['particulars'], amount)
        transactions.append(current)
    return transactions

def get_category_breakdown(transactions):
    breakdown = {}
    total = sum(abs(txn['deposits'] if txn['deposits'] > 0 else txn['withdrawals']) for txn in transactions)
    for txn in transactions:
        cat = txn.get('category', 'Others')
        amount = abs(txn['deposits'] if txn['deposits'] > 0 else txn['withdrawals'])
        if cat not in breakdown:
            breakdown[cat] = {'amount': 0, 'count': 0}
        breakdown[cat]['amount'] += amount
        breakdown[cat]['count'] += 1
    for cat in breakdown:
        breakdown[cat]['percentage'] = (breakdown[cat]['amount'] / total * 100) if total else 0
    return breakdown
