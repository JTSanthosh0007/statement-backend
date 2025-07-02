import pandas as pd
import plotly.express as px
import pdfplumber
from pathlib import Path
import io
import re
from pdfminer.layout import LAParams
import PyPDF2
import fitz  #  PyMuPDF
import traceback  # Import traceback for detailed error logging
import logging  # Import logging for error handling
import plotly.graph_objects as go
from datetime import datetime
import json
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StatementParser:
    def __init__(self, file_obj):
        """
        Initializes the parser with a file-like object.
        :param file_obj: An object with 'name' attribute and a 'read()' method.
        """
        self.file_obj = file_obj
        self.filename = file_obj.name

    def parse(self):
        """Parse the uploaded file into a standardized DataFrame"""
        if self.filename.endswith('.pdf'):
            return self._parse_pdf()
        else:
            raise ValueError("Unsupported file format")

    def _parse_pdf(self):
        """Handle PDF parsing with a more robust strategy."""
        try:
            if hasattr(self.file_obj, 'seek'):
                self.file_obj.seek(0)
            
            # Use PyMuPDF (fitz) for reliable text extraction
            doc = fitz.open(stream=self.file_obj, filetype="pdf")
            
            first_page_text = ""
            if doc.page_count > 0:
                first_page_text = doc[0].get_text()
            
            # Detect PhonePe statement
            is_phonepe = any(keyword in first_page_text.lower() for keyword in ['phonepe', 'phone pe', 'statement of transactions'])
            
            if is_phonepe:
                logger.info("Detected PhonePe statement. Using PyMuPDF parser.")
                return self._parse_phonepe_with_fitz(doc)

            # If not PhonePe, you can add other parsers or fall back to the old one.
            # For now, we'll assume the main goal is to fix PhonePe.
            logger.info("Not a PhonePe statement, using default parser.")
            # Fallback to existing pdfplumber logic if needed
            # Note: This part might need the file stream reset again.
            if hasattr(self.file_obj, 'seek'):
                self.file_obj.seek(0)
            return self._parse_with_pdfplumber()

        except Exception as e:
            error_msg = f"Error processing PDF: {str(e)}"
            logger.error(error_msg)
            # Return an empty DataFrame on failure
            return pd.DataFrame({'date': [], 'amount': [], 'category': []})

    def _parse_phonepe_with_fitz(self, doc):
        """Parse a PhonePe statement using text extracted by PyMuPDF."""
        all_text = ""
        for page in doc:
            all_text += page.get_text("text") + "\n"
        doc.close()

        lines = all_text.split('\n')
        all_transactions = []
        
        # Regex patterns for PhonePe statements
        date_patterns = [
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})',
            r'(\d{1,2}-\d{1,2}-\d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})'
        ]
        amount_pattern = r'(?:₹|Rs|INR)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)'

        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip common header/footer lines
            if any(header in line.lower() for header in ['statement', 'page', 'transaction id', 'opening balance', 'closing balance']):
                continue
            
            date_match = None
            for pattern in date_patterns:
                match = re.search(pattern, line)
                if match:
                    date_match = match.group(1)
                    break
            
            if date_match:
                amount_match = re.search(amount_pattern, line)
                if amount_match:
                    amount_str = amount_match.group(1).replace(',', '')
                    amount = float(amount_str)
                    
                    is_debit = any(word in line.lower() for word in ['paid', 'payment', 'sent', 'debit'])
                    if is_debit:
                        amount = -amount
                    
                    try:
                        date = pd.to_datetime(date_match)
                    except ValueError:
                        date = pd.Timestamp.now()
                    
                    all_transactions.append({
                        'date': date,
                        'description': line,
                        'amount': amount,
                        'category': self._categorize_transaction(line)
                    })
        
        if not all_transactions:
            logger.warning("No transactions extracted from PhonePe statement.")
            return pd.DataFrame()

        df = pd.DataFrame(all_transactions)
        return df.sort_values('date', ascending=False)
        
    def _parse_with_pdfplumber(self):
        """The original parsing logic using pdfplumber as a fallback."""
        with pdfplumber.open(self.file_obj) as pdf:
            # ... (The existing pdfplumber logic from the old _parse_pdf)
            # This is a simplified placeholder
            if len(pdf.pages) > 0:
                logger.info(f"Processing with pdfplumber... {len(pdf.pages)} pages.")
            return pd.DataFrame() # Placeholder for the original implementation

    def _extract_transaction_from_line(self, line):
        """Extract transaction details from a single line of text"""
        # Pattern 1: Date at start, amount at end
        pattern1 = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}).*?((?:CREDIT|DEBIT|Paid|Received)).*?(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 2: Date with time
        pattern2 = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(.*?)(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 3: Simplified date and amount
        pattern3 = r'(\d{1,2}/\d{1,2}/\d{4}).*?(?:₹|Rs|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 4: PhonePe specific pattern with date and amount
        pattern4 = r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}).*?(?:₹|Rs|INR)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        # Pattern 5: PhonePe specific pattern with date format DD-MM-YYYY
        pattern5 = r'(\d{1,2}-\d{1,2}-\d{4}).*?(?:₹|Rs|INR)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        
        match = None
        amount_str = None
        date_str = None
        description = None
        txn_type = None
        
        # Try each pattern
        if re.search(pattern1, line, re.IGNORECASE):
            match = re.search(pattern1, line, re.IGNORECASE)
            date_str = match.group(1)
            txn_type = match.group(2)
            amount_str = match.group(3)
            description = line
        elif re.search(pattern2, line, re.IGNORECASE):
            match = re.search(pattern2, line, re.IGNORECASE)
            date_str = match.group(1)
            description = match.group(3)
            amount_str = match.group(4)
            txn_type = 'CREDIT' if 'credit' in line.lower() else 'DEBIT'
        elif re.search(pattern3, line, re.IGNORECASE):
            match = re.search(pattern3, line, re.IGNORECASE)
            date_str = match.group(1)
            amount_str = match.group(2)
            description = line
            txn_type = 'CREDIT' if 'credit' in line.lower() else 'DEBIT'
        elif re.search(pattern4, line, re.IGNORECASE):
            match = re.search(pattern4, line, re.IGNORECASE)
            date_str = match.group(1)
            amount_str = match.group(2)
            description = line
            # For PhonePe, determine transaction type based on keywords
            txn_type = 'CREDIT' if any(word in line.lower() for word in ['received', 'refund', 'cashback']) else 'DEBIT'
        elif re.search(pattern5, line, re.IGNORECASE):
            match = re.search(pattern5, line, re.IGNORECASE)
            date_str = match.group(1)
            amount_str = match.group(2)
            description = line
            # For PhonePe, determine transaction type based on keywords
            txn_type = 'CREDIT' if any(word in line.lower() for word in ['received', 'refund', 'cashback']) else 'DEBIT'
        
        if match and amount_str:
            # Clean amount string
            amount = float(amount_str.replace(',', ''))
            
            # Determine transaction type
            is_debit = any(word in line.lower() for word in ['debit', 'paid', 'payment', 'withdraw', 'sent'])
            if is_debit:
                amount = -amount
            
            # Parse date
            try:
                if '/' in date_str:
                    date = pd.to_datetime(date_str, format='%d/%m/%Y')
                elif '-' in date_str:
                    date = pd.to_datetime(date_str, format='%d-%m-%Y')
                else:
                    date = pd.to_datetime(date_str)
            except Exception as e:
                logger.error(f"Date parsing error: {str(e)} for date string: {date_str}")
                # Fallback to current date if parsing fails
                date = pd.Timestamp.now()
            
            # Extract merchant/recipient name for better description
            merchant_match = re.search(r'to\s+([A-Za-z0-9\s]+)', line, re.IGNORECASE)
            if merchant_match:
                merchant = merchant_match.group(1).strip()
                description = f"Payment to {merchant}"
            
            return {
                'date': date,
                'amount': amount,
                'description': description.strip() if description else 'Transaction',
                'category': self._categorize_transaction(description if description else ''),
                'type': 'DEBIT' if is_debit else 'CREDIT'
            }
        
        return None

    def _extract_text_with_pymupdf(self, page_num):
        """Extract text from a specific page using PyMuPDF"""
        try:
            # Reset cursor and read the stream for PyMuPDF
            if hasattr(self.file_obj, 'seek'):
                self.file_obj.seek(0)
            
            doc = fitz.open(stream=self.file_obj.read(), filetype="pdf")
            page = doc[page_num - 1]
            text = page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"PyMuPDF extraction error: {str(e)}")
            return ""

    def _categorize_transaction(self, description):
        """Categorize transaction based on description"""
        description = description.lower()
        
        categories = {
            'Food & Dining': [
                'food', 'restaurant', 'cafe', 'coffee', 'swiggy', 'zomato', 'hotel', 'eatery', 'kitchen', 'dine', 'meal', 'lunch', 'dinner', 'breakfast',
                'dominos', 'pizza', 'dhaba', 'biryani', 'snacks', 'bakery', 'sweets', 'juice', 'milk', 'tea', 'beverage', 'bar', 'pub', 'canteen', 'tiffin', 'mess'
            ],
            'Groceries': [
                'grocery', 'vegetable', 'fruit', 'supermarket', 'kirana', 'bigbasket', 'grofers', 'blinkit', 'reliance fresh', 'more retail', 'mart', 'bazaar', 'market', 'hypermarket', 'provision store', 'departmental store'
            ],
            'Shopping': [
                'amazon', 'flipkart', 'myntra', 'shop', 'store', 'retail', 'purchase', 'buy', 'mall', 'ajio', 'nykaa', 'tatacliq', 'meesho', 'snapdeal', 'lifestyle', 'shoppers stop', 'westside', 'pantaloons', 'fashion', 'clothing', 'footwear', 'accessories', 'jewelry', 'electronics', 'mobile', 'laptop', 'tv', 'furniture', 'appliances', 'toys', 'sports', 'beauty', 'personal care', 'baby products'
            ],
            'Subscriptions': [
                'netflix', 'prime', 'hotstar', 'spotify', 'apple music', 'subscription', 'monthly plan', 'zee5', 'sonyliv', 'gaana', 'wynk', 'saavn'
            ],
            'Kids': [
                'toys', 'kids', 'baby', 'school fees', 'childcare', 'playschool', 'nursery', 'daycare'
            ],
            'Home Improvement': [
                'furniture', 'appliances', 'renovation', 'paint', 'decor', 'home center', 'ikea', 'pepperfry', 'urban ladder', 'homelane'
            ],
            'Festivals & Gifts': [
                'diwali', 'christmas', 'eid', 'pongal', 'rakhi', 'gift', 'festival', 'present', 'offering'
            ],
            'Travel Insurance': [
                'travel insurance', 'trip insurance', 'flight insurance'
            ],
            'Charity & Social': [
                'ngo', 'charity', 'donation', 'fundraiser', 'crowdfunding', 'temple', 'church', 'mosque'
            ],
            'Dining Out': [
                'dineout', 'fine dining', 'buffet', 'brunch', 'bar', 'pub', 'restaurant', 'cafe'
            ],
            'Fitness & Sports': [
                'gym', 'yoga', 'fitness', 'sports', 'marathon', 'cycling', 'swimming', 'workout', 'zumba'
            ],
            'Electronics & Gadgets': [
                'electronics', 'gadget', 'mobile', 'laptop', 'tv', 'smart watch', 'headphones', 'earphones', 'tablet'
            ],
            'Beauty & Wellness': [
                'beauty', 'spa', 'salon', 'wellness', 'skincare', 'makeup', 'cosmetics', 'grooming'
            ],
            'Automobile': [
                'car', 'bike', 'auto', 'petrol', 'diesel', 'service', 'insurance', 'toll', 'parking', 'fuel'
            ],
            'Stationery & Books': [
                'stationery', 'books', 'novel', 'magazine', 'library', 'textbook', 'pen', 'notebook'
            ],
            'Transportation': [
                'uber', 'ola', 'metro', 'bus', 'train', 'flight', 'airline', 'travel', 'taxi', 'cab', 'auto', 'rickshaw', 'petrol', 'diesel', 'fuel', 'yulu', 'rapido', 'irctc', 'makemytrip', 'redbus', 'goibibo', 'toll', 'parking', 'fastag'
            ],
            'Bills & Utilities': [
                'electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'bill', 'recharge', 'dth', 'broadband', 'wifi', 'utility', 'service', 'jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'tata power', 'adani', 'bescom', 'tangedco', 'mahadiscom', 'postpaid', 'prepaid', 'cylinder', 'maintenance', 'society'
            ],
            'Health & Medical': [
                'hospital', 'clinic', 'pharmacy', 'medical', 'doctor', 'health', 'medicine', 'drug', 'healthcare', 'dental', 'lab', 'test', 'apollo', 'medplus', 'netmeds', 'pharmeasy', 'diagnostic', 'consultation', 'treatment', 'therapy', 'ayurveda', 'yoga'
            ],
            'Education': [
                'school', 'college', 'university', 'course', 'training', 'class', 'tuition', 'education', 'learning', 'study', 'book', 'stationery', 'byju', 'unacademy', 'vedantu', 'exam', 'test series', 'workshop', 'coaching', 'fees'
            ],
            'Travel': [
                'hotel', 'booking', 'trip', 'tour', 'vacation', 'holiday', 'resort', 'stay', 'accommodation', 'flight', 'airbnb', 'makemytrip', 'goibibo', 'yatra', 'abhibus', 'irctc', 'travel'
            ],
            'Personal Care': [
                'salon', 'spa', 'beauty', 'gym', 'fitness', 'parlour', 'cosmetics', 'grooming', 'wellness', 'haircut', 'massage', 'makeup'
            ],
            'Pets': [
                'pet', 'dog', 'cat', 'vet', 'petcare', 'pet shop', 'pet food', 'boarding', 'grooming'
            ],
            'Investments': [
                'investment', 'mutual fund', 'stock', 'share', 'equity', 'demat', 'trading', 'portfolio', 'dividend', 'interest', 'sip', 'fd', 'rd', 'nps', 'pension', 'lic', 'insurance', 'premium', 'policy', 'ulip', 'bond', 'gold', 'ppf', 'elss', 'etf', 'ipo', 'brokerage', 'securities'
            ],
            'Insurance': [
                'insurance', 'policy', 'premium', 'coverage', 'claim', 'life', 'health', 'vehicle', 'max bupa', 'hdfc ergo', 'icici lombard', 'sbi general', 'bajaj allianz', 'star health', 'new india assurance', 'oriental insurance', 'national insurance', 'united india insurance', 'reliance general', 'tata aig', 'future generali', 'iffco tokio', 'cholamandalam', 'raheja qbe', 'aditya birla health', 'niva bupa'
            ],
            'Rent': [
                'rent', 'lease', 'housing', 'accommodation', 'property', 'pg', 'hostel', 'tenant', 'landlord', 'flat', 'apartment', 'room', 'house rent', 'rent payment'
            ],
            'EMI & Loans': [
                'emi', 'loan', 'credit', 'finance', 'installment', 'repayment', 'personal loan', 'home loan', 'car loan', 'auto loan', 'education loan', 'gold loan', 'overdraft', 'repay', 'borrow', 'lending', 'nbfc', 'bank loan', 'credit card', 'debit card', 'standing instruction', 'si', 'mandate', 'autopay', 'ecs', 'nach', 'auto debit'
            ],
            'Gifts & Donations': [
                'gift', 'donation', 'charity', 'contribute', 'present', 'offering', 'ngo', 'temple', 'church', 'mosque', 'zakat', 'tithe', 'fundraiser', 'crowdfunding'
            ],
            'Taxes & Fees': [
                'tax', 'gst', 'fee', 'charge', 'penalty', 'fine', 'income tax', 'tds', 'service tax', 'cess', 'stamp duty', 'registration', 'processing fee', 'late fee', 'convenience fee', 'surcharge'
            ],
            'Transfer': [
                'transfer', 'sent', 'received', 'upi', 'phonepe', 'gpay', 'paytm', 'payment', 'pay', 'wallet', 'neft', 'imps', 'rtgs', 'withdraw', 'deposit', 'cash', 'atm', 'cheque', 'dd', 'pay to', 'received from', 'trf', 'chq', 'vpa', 'fund transfer', 'money transfer', 'account transfer', 'self transfer'
            ],
            'Others': []
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

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide a PDF file path"}))
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        # The main entry point for CLI now needs to open the file first
        with open(file_path, "rb") as f:
            # Create a file-like object similar to what FastAPI provides
            from io import BytesIO
            file_like_obj = BytesIO(f.read())
            file_like_obj.name = Path(file_path).name
            
            parser = StatementParser(file_like_obj)
            df = parser.parse()
        
        if df.empty or len(df) == 1 and df.iloc[0]['amount'] == 0:
            print(json.dumps({"error": "No valid transactions found in the PDF"}))
            sys.exit(1)
        
        logger.info("Calculating summary statistics...")
        # Calculate summary statistics
        total_received = df[df['amount'] > 0]['amount'].sum()
        total_spent = df[df['amount'] < 0]['amount'].sum()
        credit_count = len(df[df['amount'] > 0])
        debit_count = len(df[df['amount'] < 0])
        logger.info("Summary statistics calculated.")
        
        # Calculate highest and lowest transaction
        if not df.empty:
            # Exclude zero-amount transactions
            nonzero_df = df[df['amount'] != 0]
            if not nonzero_df.empty:
                # Highest (by absolute value)
                highest_idx = nonzero_df['amount'].abs().idxmax()
                highest_row = nonzero_df.loc[highest_idx]
                summary_highest = {
                    'date': str(highest_row['date']),
                    'amount': float(highest_row['amount']),
                    'description': str(highest_row['description'])
                }
                highest_amount = float(highest_row['amount'])
                # Lowest (by absolute value, but not the same as highest)
                # If only one transaction, lowest = highest
                if len(nonzero_df) > 1:
                    # Remove the highest row and find the next lowest
                    rest_df = nonzero_df.drop(highest_idx)
                    lowest_idx = rest_df['amount'].abs().idxmin()
                    lowest_row = rest_df.loc[lowest_idx]
                else:
                    lowest_row = highest_row
                summary_lowest = {
                    'date': str(lowest_row['date']),
                    'amount': float(lowest_row['amount']),
                    'description': str(lowest_row['description'])
                }
                lowest_amount = float(lowest_row['amount'])
            else:
                summary_highest = None
                highest_amount = 0
                summary_lowest = None
                lowest_amount = 0
        else:
            summary_highest = None
            highest_amount = 0
            summary_lowest = None
            lowest_amount = 0
        
        logger.info("Calculating category breakdown...")
        # Calculate category breakdown
        category_breakdown = {}
        for category in df['category'].unique():
            logger.info(f"Processing category: {category}")
            category_amount = df[df['category'] == category]['amount'].sum()
            category_count = len(df[df['category'] == category])
            category_breakdown[category] = {
                'amount': category_amount,
                'percentage': (abs(category_amount) / abs(total_spent)) * 100 if total_spent != 0 else 0,
                'count': category_count
            }
        logger.info("Category breakdown calculated.")

        logger.info("Preparing chart data...")
        # Prepare chart data
        chart_data = {
            'data': {
                'labels': list(category_breakdown.keys()),
                'datasets': [{
                    'data': [abs(cat['amount']) for cat in category_breakdown.values()],
                    'backgroundColor': [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                    ]
                }]
            }
        }
        logger.info("Chart data prepared.")

        logger.info("Preparing final response...")
        # Convert Timestamp objects to ISO format strings
        df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        # Prepare response
        response = {
            'transactions': df.to_dict('records'),
            'summary': {
                'totalReceived': total_received,
                'totalSpent': total_spent,
                'balance': total_received + total_spent,
                'creditCount': credit_count,
                'debitCount': debit_count,
                'totalTransactions': len(df),
                'highestAmount': highest_amount,
                'lowestAmount': lowest_amount,
                'highestTransaction': summary_highest,
                'lowestTransaction': summary_lowest
            },
            'categoryBreakdown': category_breakdown,
            'chartData': chart_data,
            'pageCount': len(PyPDF2.PdfReader(open(file_path, "rb")).pages)
        }
        logger.info("Final response prepared.")

        logger.info("Printing JSON response...")
        print(json.dumps(response))
        logger.info("JSON response printed.")
        
    except Exception as e:
        logger.error(f"Exception in main execution: {e}")
        print(json.dumps({
            "error": str(e),
            "details": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 

app = FastAPI()

@app.post("/analyze-pdf/")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Analyzes an uploaded PDF file.

    This endpoint reads the uploaded PDF, validates it, and extracts
    basic information like the number of pages.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        # 1. Read the uploaded file into memory
        pdf_bytes = await file.read()
        
        # 2. Wrap the bytes in a BytesIO object to make it a seekable file-like object
        pdf_stream = io.BytesIO(pdf_bytes)

        # 3. Use fitz.open() to open the PDF from the stream
        #    The 'stream' argument requires the file extension to be specified.
        with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
            
            # 4. Analyze the PDF
            num_pages = doc.page_count
            logger.info(f"Successfully opened '{file.filename}'. It has {num_pages} page(s).")
            
            # Example: Extract text from the first page
            first_page_text = ""
            if num_pages > 0:
                first_page = doc.load_page(0)
                first_page_text = first_page.get_text()

            # 5. Return a success response
            return JSONResponse(
                status_code=200,
                content={
                    "filename": file.filename,
                    "message": "PDF analyzed successfully",
                    "page_count": num_pages,
                    "first_page_text_sample": first_page_text[:200] + "..." if first_page_text else "No text found."
                }
            )

    except Exception as e:
        logger.error(f"Failed to process PDF {file.filename}: {str(e)}")
        # Handle errors properly
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the PDF: {str(e)}"
        ) 