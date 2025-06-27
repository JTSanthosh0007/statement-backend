import re
from typing import List, Dict

def parse_canara_statement(text: str) -> List[Dict]:
    """
    Parses Canara Bank statement text and returns a list of transactions.
    Each transaction is a dict with date, particulars, deposits, withdrawals, balance.
    """
    lines = text.splitlines()
    transactions = []
    pattern = re.compile(r"(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,.]*)\s+([\d,.]*)\s+([\d,.]+)")
    for line in lines:
        match = pattern.match(line)
        if match:
            date, particulars, deposits, withdrawals, balance = match.groups()
            transactions.append({
                "date": date,
                "particulars": particulars.strip(),
                "deposits": float(deposits.replace(",", "")) if deposits else 0.0,
                "withdrawals": float(withdrawals.replace(",", "")) if withdrawals else 0.0,
                "balance": float(balance.replace(",", "")),
            })
    return transactions
