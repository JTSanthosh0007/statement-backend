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
    Parses Canara Bank statement text where:
    - Each transaction starts with a date (dd-mm-yyyy), which may be on its own line
    - Particulars and amounts may be on subsequent lines
    - Skips 'Opening Balance' lines
    - Correctly parses amounts even if on a separate line
    """
    logging.basicConfig(filename='canara_parser_debug.log', level=logging.INFO, format='%(asctime)s %(message)s')
    logging.info('Extracted PDF text:\n' + text)

    lines = text.splitlines()
    transactions = []
    current = None
    particulars_lines = []
    date_pattern = re.compile(r"^(\d{2}-\d{2}-\d{4})")
    amount_line_pattern = re.compile(r"^(?P<deposits>[\d,]+\.\d{2})?\s*(?P<withdrawals>[\d,]+\.\d{2})?\s*(?P<balance>[\d,]+\.\d{2})$")
    opening_balance_line = re.compile(r"Opening Balance", re.IGNORECASE)

    for idx, line in enumerate(lines):
        line = line.strip()
        date_match = date_pattern.match(line)
        if date_match:
            # Save previous transaction if any
            if current:
                current['particulars'] = '\n'.join(particulars_lines).strip()
                amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
                current['category'] = categorize_canara_transaction(current['particulars'], amount)
                transactions.append(current)
                logging.info(f"Parsed transaction: {current}")
                particulars_lines = []
            # Start new transaction with just the date
            date = date_match.group(1)
            particulars = line[len(date):].strip()
            if opening_balance_line.search(particulars):
                current = None
                particulars_lines = []
                continue
            current = {
                'date': date,
                'particulars': '',
                'deposits': 0.0,
                'withdrawals': 0.0,
                'balance': 0.0,
            }
            if particulars:
                particulars_lines = [particulars]
            else:
                particulars_lines = []
        elif current:
            # Check if this line is an amount line (deposits, withdrawals, balance)
            amt_match = amount_line_pattern.match(line.replace(',', '').replace('  ', ' '))
            if amt_match:
                try:
                    deposits = amt_match.group('deposits')
                    withdrawals = amt_match.group('withdrawals')
                    balance = amt_match.group('balance')
                    current['deposits'] = float(deposits.replace(',', '')) if deposits else 0.0
                    current['withdrawals'] = float(withdrawals.replace(',', '')) if withdrawals else 0.0
                    current['balance'] = float(balance.replace(',', '')) if balance else 0.0
                except Exception as e:
                    logging.error(f"Error parsing amounts on line {idx+1}: {line} | Error: {e}")
            elif opening_balance_line.search(line):
                continue
            else:
                # Multi-line particulars
                particulars_lines.append(line)
    # Save last transaction
    if current:
        current['particulars'] = '\n'.join(particulars_lines).strip()
        amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
        current['category'] = categorize_canara_transaction(current['particulars'], amount)
        transactions.append(current)
        logging.info(f"Parsed transaction: {current}")
    logging.info(f'Parsed {len(transactions)} transactions: {transactions}')
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
