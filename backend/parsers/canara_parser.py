import re
import logging
from typing import List, Dict
import traceback

def categorize_canara_transaction(description, amount):
    """Categorize transactions based on description and amount"""
    if not description:
        return 'Others'
        
    description = str(description).lower()
    # Kotak-style rules
    if 'salary' in description:
        return 'Income'
    if 'swiggy' in description or 'zomato' in description or 'restaurant' in description:
        return 'Food & Dining'
    if 'upi' in description or 'imps' in description or 'neft' in description:
        return 'Transfer'
    if 'atm' in description or 'cash withdrawal' in description:
        return 'Transfer'
    if 'pos ' in description or 'pos/' in description:
        return 'Shopping'
    if 'emi' in description or 'loan' in description:
        return 'EMI & Loans'
        
    categories = {
        'Food & Dining': ['restaurant', 'food', 'swiggy', 'zomato', 'dining', 'cafe', 'hotel', 'eat', 'kitchen'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'retail', 'store', 'shop', 'mall', 'purchase'],
        'Travel': ['uber', 'ola', 'metro', 'petrol', 'fuel', 'travel', 'irctc', 'railway', 'bus', 'flight', 'airline'],
        'Bills & Utilities': ['electricity', 'water', 'gas', 'mobile', 'phone', 'internet', 'dth', 'recharge', 'bill', 'utility'],
        'Entertainment': ['movie', 'netflix', 'prime', 'hotstar', 'subscription', 'game', 'sport', 'ticket'],
        'EMI & Loans': ['emi', 'loan', 'interest', 'insurance', 'premium', 'investment', 'mortgage', 'repayment'],
        'Health & Medical': ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine', 'health', 'clinic'],
        'Education': ['school', 'college', 'tuition', 'course', 'fee', 'education', 'university', 'institute', 'training'],
        'Income': ['salary', 'interest earned', 'dividend', 'refund', 'cashback', 'income', 'stipend', 'bonus'],
        'Transfer': ['transfer', 'sent', 'received', 'payment', 'deposit', 'withdraw', 'upi', 'neft', 'rtgs', 'imps'],
        'Groceries': ['grocery', 'supermarket', 'mart', 'fruit', 'vegetable', 'food store', 'kirana'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in description for keyword in keywords):
            return category
            
    if amount:
        if amount > 10000:
            if amount > 0:
                return 'Income'
            else:
                return 'EMI & Loans'
                
    return 'Others'

def parse_canara_statement(text: str) -> List[Dict]:
    """
    Parses Canara Bank statement text with improved error handling and multiple format support
    """
    try:
        # Configure logging for debugging
        logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
        logger = logging.getLogger(__name__)
        
        logger.info('Starting to parse Canara Bank statement')
        logger.info(f'Text length: {len(text)}')
        
        if not text or len(text) < 100:
            logger.error(f"Insufficient text extracted: {text[:100]}")
            raise ValueError("No valid text content found in the PDF. Please check if this is a valid Canara Bank statement.")
            
        lines = text.splitlines()
        transactions = []
        current = None
        particulars_lines = []
        
        # Support multiple date formats used by Canara Bank
        date_patterns = [
            re.compile(r"^(\d{2}-\d{2}-\d{4})"),  # DD-MM-YYYY
            re.compile(r"^(\d{2}/\d{2}/\d{4})"),  # DD/MM/YYYY
            re.compile(r"^(\d{2}\.\d{2}\.\d{4})"),  # DD.MM.YYYY
            re.compile(r"^(\d{2}-[A-Za-z]{3}-\d{2})"),  # DD-MMM-YY format
        ]
        
        number_pattern = re.compile(r"^[\d,]+\.\d{2}$")
        opening_balance_line = re.compile(r"Opening Balance|Balance (B/F|B/D)", re.IGNORECASE)
        
        # Transaction pattern - more comprehensive
        transaction_pattern = re.compile(r"(BY|TO)?\s*(CASH|TRANSFER|NEFT|RTGS|IMPS|UPI|CHEQUE|CHQ|WITHDRAWAL|DEPOSIT)", re.IGNORECASE)
        
        idx = 0
        while idx < len(lines):
            line = lines[idx].strip()
            
            # Check if line matches any date pattern
            date_match = None
            date_str = None
            for pattern in date_patterns:
                match = pattern.match(line)
                if match:
                    date_match = match
                    date_str = match.group(1)
                    break
                    
            if date_match:
                # Save previous transaction if any
                if current:
                    current['particulars'] = '\n'.join(particulars_lines).strip()
                    amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
                    current['category'] = categorize_canara_transaction(current['particulars'], amount)
                    transactions.append(current)
                    logger.info(f"Added transaction: {current['date']} - {current['particulars'][:30]}...")
                    particulars_lines = []
                    
                # Start new transaction with just the date
                date = date_str
                particulars = line[len(date):].strip()
                
                if opening_balance_line.search(particulars):
                    current = None
                    particulars_lines = []
                    idx += 1
                    continue
                    
                current = {
                    'date': date,
                    'particulars': '',
                    'deposits': 0.0,
                    'withdrawals': 0.0,
                    'balance': 0.0,
                    'description': '',
                }
                
                if particulars:
                    particulars_lines = [particulars]
                else:
                    particulars_lines = []
                    
                idx += 1
                # Collect particulars until we hit a number line or next date
                while idx < len(lines):
                    next_line = lines[idx].strip()
                    
                    # Check if next line is a new date
                    next_is_date = False
                    for pattern in date_patterns:
                        if pattern.match(next_line):
                            next_is_date = True
                            break
                            
                    if next_is_date:
                        break
                        
                    if number_pattern.match(next_line):
                        # This is likely an amount or balance line
                        try:
                            # Check if the next line is also a number (for balance)
                            amount_val = float(next_line.replace(',', ''))
                            deposits = withdrawals = 0.0
                            balance = 0.0
                            
                            lookahead = idx + 1
                            if lookahead < len(lines) and number_pattern.match(lines[lookahead].strip()):
                                # Two consecutive number lines: first is amount, second is balance
                                balance_val = float(lines[lookahead].strip().replace(',', ''))
                                
                                # Heuristic: if particulars contain 'CR' or 'credit', treat as deposit
                                particulars_text = '\n'.join(particulars_lines).upper()
                                if ('CR' in particulars_text or 'CREDIT' in particulars_text or 
                                    'DEPOSIT' in particulars_text or 'RECEIVED' in particulars_text):
                                    deposits = amount_val
                                else:
                                    withdrawals = amount_val
                                    
                                balance = balance_val
                                idx += 1  # Skip the balance line
                                logger.info(f"Extracted: deposits={deposits}, withdrawals={withdrawals}, balance={balance}")
                            else:
                                # Only one number line: could be balance or amount
                                # Heuristic: if particulars contain 'CR' or 'credit', treat as deposit
                                particulars_text = '\n'.join(particulars_lines).upper()
                                if ('CR' in particulars_text or 'CREDIT' in particulars_text or 
                                    'DEPOSIT' in particulars_text or 'RECEIVED' in particulars_text):
                                    deposits = amount_val
                                elif ('DR' in particulars_text or 'DEBIT' in particulars_text or 
                                      'WITHDRAWAL' in particulars_text or 'PAID' in particulars_text):
                                    withdrawals = amount_val
                                else:
                                    # If we can't tell, use transaction_pattern to help identify
                                    if transaction_pattern.search(particulars_text):
                                        if any(word in particulars_text for word in ['DEPOSIT', 'CREDIT', 'RECEIVED']):
                                            deposits = amount_val
                                        else:
                                            withdrawals = amount_val
                                    else:
                                        # If we still can't tell, treat as balance
                                        balance = amount_val
                                        
                                logger.info(f"Extracted (single line): deposits={deposits}, withdrawals={withdrawals}, balance={balance}")
                                
                            current['deposits'] = deposits
                            current['withdrawals'] = withdrawals
                            current['balance'] = balance
                        except Exception as e:
                            logger.error(f"Error parsing amount: {str(e)}")
                            
                        idx += 1
                        continue
                    elif opening_balance_line.search(next_line):
                        idx += 1
                        continue
                    else:
                        particulars_lines.append(next_line)
                        idx += 1
                        
                continue  # Go to next line (date or end)
            else:
                idx += 1
                
        # Save last transaction
        if current:
            current['particulars'] = '\n'.join(particulars_lines).strip()
            amount = current['deposits'] if current['deposits'] > 0 else -current['withdrawals']
            current['category'] = categorize_canara_transaction(current['particulars'], amount)
            transactions.append(current)
            logger.info(f"Added final transaction: {current['date']} - {current['particulars'][:30]}...")
            
        # Verify we have at least some transactions
        if not transactions:
            logger.error("No transactions found in the statement")
            raise ValueError("No transactions found in the PDF. Please make sure this is a valid Canara Bank statement.")
            
        logger.info(f'Successfully parsed {len(transactions)} transactions')
        return transactions
        
    except Exception as e:
        logging.error(f"Error parsing Canara Bank statement: {str(e)}")
        logging.error(traceback.format_exc())
        # Re-raise with informative message
        raise ValueError(f"Failed to parse Canara Bank statement: {str(e)}")

def get_category_breakdown(transactions):
    """Generate category breakdown with improved error handling"""
    try:
        breakdown = {}
        total_amount = 0
        
        # Calculate total amount for percentage calculation
        for txn in transactions:
            amount = abs(txn['deposits'] if txn['deposits'] > 0 else txn['withdrawals'])
            total_amount += amount
            
        # Group by category
        for txn in transactions:
            cat = txn.get('category', 'Others')
            amount = abs(txn['deposits'] if txn['deposits'] > 0 else txn['withdrawals'])
            
            if cat not in breakdown:
                breakdown[cat] = {'amount': 0, 'count': 0, 'percentage': 0}
                
            breakdown[cat]['amount'] += amount
            breakdown[cat]['count'] += 1
            
        # Calculate percentages
        if total_amount > 0:
            for cat in breakdown:
                breakdown[cat]['percentage'] = round((breakdown[cat]['amount'] / total_amount * 100), 2)
                
        return breakdown
        
    except Exception as e:
        logging.error(f"Error generating category breakdown: {str(e)}")
        # Return empty breakdown rather than failing
        return {'Others': {'amount': 0, 'count': 0, 'percentage': 0}}
