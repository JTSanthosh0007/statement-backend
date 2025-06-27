import re
import logging
from typing import List, Dict

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
                transactions.append(current)
                particulars_lines = []
            # Reverse split for last 3 columns (balance, withdrawals, deposits)
            parts = re.split(r'\s{2,}|\t+', line)
            # Remove empty strings
            parts = [p for p in parts if p.strip()]
            if len(parts) < 5:
                continue  # Not a valid transaction line
            date = parts[0]
            # The last three are always deposits, withdrawals, balance (may be empty)
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
        transactions.append(current)
    return transactions
