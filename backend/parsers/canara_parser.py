import re
from typing import List, Dict

def parse_canara_statement(text: str) -> List[Dict]:
    """
    Parses Canara Bank statement text and returns a list of transactions.
    Handles multi-line particulars, Opening Balance, and both credit/debit.
    """
    lines = text.splitlines()
    transactions = []
    current = None
    particulars_lines = []
    # Regex for a transaction line (date at start, then particulars, then deposit, withdrawal, balance)
    txn_line = re.compile(r"^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,.]*)\s+([\d,.]*)\s+([\d,.]+)$")
    # Regex for opening balance
    opening_balance_line = re.compile(r"Opening Balance", re.IGNORECASE)

    for i, line in enumerate(lines):
        line = line.rstrip()
        match = txn_line.match(line)
        if match:
            # Save previous transaction if any
            if current:
                current['particulars'] = '\n'.join(particulars_lines).strip()
                transactions.append(current)
                particulars_lines = []
            date, particulars, deposits, withdrawals, balance = match.groups()
            # Skip opening balance row
            if opening_balance_line.search(particulars):
                continue
            current = {
                'date': date,
                'particulars': particulars.strip(),
                'deposits': float(deposits.replace(',', '')) if deposits else 0.0,
                'withdrawals': float(withdrawals.replace(',', '')) if withdrawals else 0.0,
                'balance': float(balance.replace(',', '')),
            }
            particulars_lines = [particulars.strip()]
        else:
            # Multi-line particulars (not a new transaction)
            if current is not None:
                if line.strip():
                    particulars_lines.append(line.strip())
    # Save last transaction
    if current:
        current['particulars'] = '\n'.join(particulars_lines).strip()
        transactions.append(current)
    return transactions
