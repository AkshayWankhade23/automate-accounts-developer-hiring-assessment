from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .models import ReceiptFile, Receipt
import os
import magic
import uuid
from datetime import datetime
import PyPDF2
import re
import random
import json
from groq import Groq
from dateutil import parser as dateutil_parser

# Configure Groq client with API key (should be in settings.py in production)
GROQ_API_KEY = "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" # Replace with your actual API key or use env var

def extract_receipt_data_with_ai(text):
    print("text:", text)  
    """
    Use Groq API with LLaMA 4 to extract structured receipt data.
    This provides much more accurate extraction than regex patterns.
    """
    try:
        # Initialize Groq client
        client = Groq(api_key=GROQ_API_KEY)
        
        # Create the prompt with the receipt text
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": "\"Extract below fields from the provided text.\"\n\npurchased_at\tDate and time of purchase (extracted from receipt)\nmerchant_name\tMerchant name (extracted from receipt)\ntotal_amount\tTotal amount spent (extracted from receipt)\ncurrency\tCurrency used in transaction\ntax_amount\tTax amount (extracted from receipt)\nsubtotal_amount\tSubtotal amount before tax (extracted from receipt)\npayment_method\tPayment method used (extracted from receipt)\nreceipt_number\tReceipt/invoice/transaction number (extracted from receipt)"
                },
                {
                    "role": "user",
                    "content": text
                },
                {
                    "role": "assistant",
                    "content": "Here are the extracted fields:\n\n* **purchased_at**: [date/time]\n* **merchant_name**: [merchant]\n* **total_amount**: [amount]"
                },
                {
                    "role": "user",
                    "content": ""
                },
                {
                    "role": "assistant",
                    "content": "Here are the extracted fields:\n\n* **purchased_at**: [date/time]\n* **merchant_name**: [merchant]\n* **total_amount**: [amount]\n* **currency**: [currency]\n* **tax_amount**: [tax]\n* **subtotal_amount**: [subtotal]\n* **payment_method**: [payment]\n* **receipt_number**: [receipt number]"
                }
            ],
            temperature=1,  # Higher temperature for more creative outputs
            max_completion_tokens=8192,
            top_p=1,
        )
        
        # Extract the response
        response_content = completion.choices[0].message.content
        
        # Extract the fields from the response
        print(f"AI Response: {response_content}")
        
        # Initialize extraction results
        extracted_data = {
            'merchant_name': "Unknown Merchant",
            'total_amount': 0.0,
            'purchased_at': datetime.now(),
            'currency': 'USD',
            'tax_amount': None,
            'subtotal_amount': None,
            'payment_method': None,
            'receipt_number': None
        }
        
        # Extract merchant name
        merchant_match = re.search(r'\*\*merchant_name\*\*:\s*(.+?)(?:\n|$|\*\*)', response_content)
        if merchant_match:
            extracted_data['merchant_name'] = merchant_match.group(1).strip()
        
        # Extract total amount
        total_match = re.search(r'\*\*total_amount\*\*:\s*\$?(\d+[,\.]?\d*)', response_content)
        if total_match:
            # Remove commas from numbers like 2,254.00
            total_amount_str = total_match.group(1).replace(',', '')
            extracted_data['total_amount'] = float(total_amount_str)
        
        # Extract date
        date_match = re.search(r'\*\*purchased_at\*\*:\s*(.+?)(?:\n|$|\*\*)', response_content)
        if date_match:
            date_str = date_match.group(1).strip()
            try:
                # Try to parse various date formats
                extracted_data['purchased_at'] = dateutil_parser.parse(date_str)
            except:
                print(f"Failed to parse date: {date_str}")
                # Keep default (current date)
                pass
        
        # Extract currency
        currency_match = re.search(r'\*\*currency\*\*:\s*(.+?)(?:\n|$|\*\*)', response_content)
        if currency_match:
            currency = currency_match.group(1).strip()
            if currency and currency != "(not explicitly mentioned" and "assume" not in currency.lower():
                extracted_data['currency'] = currency
        
        # Extract tax amount
        tax_match = re.search(r'\*\*tax_amount\*\*:\s*\$?(\d+[,\.]?\d*)', response_content)
        if tax_match:
            tax_amount_str = tax_match.group(1).replace(',', '')
            extracted_data['tax_amount'] = float(tax_amount_str)
        
        # Extract subtotal
        subtotal_match = re.search(r'\*\*subtotal_amount\*\*:\s*\$?(\d+[,\.]?\d*)', response_content)
        if subtotal_match:
            subtotal_amount_str = subtotal_match.group(1).replace(',', '')
            extracted_data['subtotal_amount'] = float(subtotal_amount_str)
        
        # Extract payment method
        payment_match = re.search(r'\*\*payment_method\*\*:\s*(.+?)(?:\n|$|\*\*)', response_content)
        if payment_match:
            extracted_data['payment_method'] = payment_match.group(1).strip()
        
        # Extract receipt number
        receipt_match = re.search(r'\*\*receipt_number\*\*:\s*(.+?)(?:\n|$|\*\*)', response_content)
        if receipt_match:
            extracted_data['receipt_number'] = receipt_match.group(1).strip()
        
        return extracted_data
    
    except Exception as e:
        print(f"Error in AI extraction: {str(e)}")
        # Return fallback data
        return {
            'merchant_name': "Error extracting merchant",
            'total_amount': 0.0,
            'purchased_at': datetime.now(),
            'currency': 'USD',
            'tax_amount': None,
            'subtotal_amount': None,
            'payment_method': None,
            'receipt_number': None
        }

class ReceiptUploadView(APIView):
    """API endpoint for uploading receipt files (PDF only)."""
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        
        # Check if file was provided
        if not file_obj:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file type
        file_mime = magic.from_buffer(file_obj.read(1024), mime=True)
        file_obj.seek(0)  # Reset file pointer after reading
        
        if file_mime != 'application/pdf':
            return Response(
                {
                    'error': 'Invalid file type. Only PDF files are allowed.',
                    'file_type': file_mime
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        original_name = file_obj.name
        unique_filename = f"{uuid.uuid4()}_{original_name}"
        
        # Define storage path
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'receipts')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        # Create database record
        receipt_file = ReceiptFile.objects.create(
            file_name=original_name,
            file_path=os.path.join('receipts', unique_filename),
            is_valid=True,
            is_processed=False
        )
        
        return Response({
            'id': receipt_file.id,
            'file_name': receipt_file.file_name,
            'message': 'Receipt file uploaded successfully'
        }, status=status.HTTP_201_CREATED)

class ReceiptValidateView(APIView):
    """API endpoint for validating previously uploaded receipt files."""
    
    def post(self, request, *args, **kwargs):
        receipt_id = request.data.get('receipt_id')
        
        # Check if receipt ID was provided
        if not receipt_id:
            return Response(
                {'error': 'No receipt ID provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the receipt file record
            receipt_file = ReceiptFile.objects.get(id=receipt_id)
        except ReceiptFile.DoesNotExist:
            return Response(
                {'error': f'Receipt with ID {receipt_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if file exists on disk
        file_path = os.path.join(settings.MEDIA_ROOT, receipt_file.file_path)
        if not os.path.exists(file_path):
            receipt_file.is_valid = False
            receipt_file.invalid_reason = "File not found on disk"
            receipt_file.save()
            return Response(
                {
                    'id': receipt_file.id,
                    'is_valid': False,
                    'invalid_reason': "File not found on disk"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file as PDF
        try:
            with open(file_path, 'rb') as f:
                file_mime = magic.from_buffer(f.read(1024), mime=True)
                
            if file_mime != 'application/pdf':
                receipt_file.is_valid = False
                receipt_file.invalid_reason = f"Invalid file type: {file_mime}. Only PDF files are allowed."
                receipt_file.save()
                return Response(
                    {
                        'id': receipt_file.id,
                        'is_valid': False,
                        'invalid_reason': receipt_file.invalid_reason
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # File is valid
            receipt_file.is_valid = True
            receipt_file.invalid_reason = None
            receipt_file.save()
            
            return Response({
                'id': receipt_file.id,
                'is_valid': True,
                'message': 'Receipt file validated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            receipt_file.is_valid = False
            receipt_file.invalid_reason = f"Validation error: {str(e)}"
            receipt_file.save()
            return Response(
                {
                    'id': receipt_file.id,
                    'is_valid': False,
                    'invalid_reason': receipt_file.invalid_reason
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def extract_receipt_data(file_path):
    """
    Extract data from receipt PDF files using Groq AI with LLaMA 4.
    Falls back to basic regex extraction if AI extraction fails.
    """
    try:
        # Open the PDF file
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            # Extract text from all pages
            for page_num in range(len(reader.pages)):
                text += reader.pages[page_num].extract_text()
                print(f"Extracted text from page {page_num+1}")
        
        # First attempt: Use AI for extraction
        if text.strip():  # Only if we have text
            try:
                print("Attempting AI-based extraction...")
                ai_results = extract_receipt_data_with_ai(text)
                
                # If we got valid results from AI, return them
                if (ai_results and 
                    ai_results['merchant_name'] != "Error extracting merchant" and
                    ai_results['merchant_name'] != "Unknown Merchant"):
                    print("AI extraction successful!")
                    return ai_results
                else:
                    print("AI extraction returned incomplete results, falling back to regex")
            except Exception as ai_error:
                print(f"AI extraction failed with error: {str(ai_error)}")
                print("Falling back to regex-based extraction...")
        
        # Fall back to regex-based extraction if AI failed or returned incomplete results
        print("Using regex-based extraction...")
        
        # Extract merchant name (simplistic approach)
        merchant_patterns = [
            r'(MERCHANT|STORE|RESTAURANT|VENDOR)[:]\s*([A-Za-z0-9\s&\'-]+)',
            r'^([A-Z][A-Za-z0-9\s&\'-]+)$',  # Often the first capitalized line
        ]
        merchant_name = "Unknown Merchant"
        for pattern in merchant_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            if matches:
                merchant_name = matches[0][1] if isinstance(matches[0], tuple) else matches[0]
                merchant_name = merchant_name.strip()
                break
        
        # Extract total amount
        amount_patterns = [
            r'(TOTAL|AMOUNT|SUM)[:]\s*[$]?(\d+\.\d{2})',
            r'[$](\d+\.\d{2})',
        ]
        total_amount = 0.0
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Take the largest amount as the total
                amounts = [float(match[1]) if isinstance(match, tuple) else float(match) for match in matches]
                if amounts:
                    total_amount = max(amounts)
                    break
        
        # Extract date (assuming format MM/DD/YYYY or similar)
        date_patterns = [
            r'(DATE|PURCHASED)[:]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ]
        purchased_at = datetime.now()  # Default to current date
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                date_str = matches[0][1] if isinstance(matches[0], tuple) else matches[0]
                # Try to parse the date (simplistic approach)
                try:
                    # Handle different date formats
                    if '/' in date_str:
                        month, day, year = date_str.split('/')
                    else:
                        month, day, year = date_str.split('-')
                    
                    # Adjust year if needed
                    if len(year) == 2:
                        year = '20' + year
                    
                    purchased_at = datetime(int(year), int(month), int(day))
                    break
                except:
                    pass  # If parsing fails, keep the default date
        
        # Extract tax amount
        tax_pattern = r'(TAX|VAT|GST)[:]\s*[$]?(\d+\.\d{2})'
        tax_amount = None
        tax_matches = re.findall(tax_pattern, text, re.IGNORECASE)
        if tax_matches:
            tax_amount = float(tax_matches[0][1])
        
        # Extract subtotal
        subtotal_pattern = r'(SUBTOTAL|SUB-TOTAL)[:]\s*[$]?(\d+\.\d{2})'
        subtotal_amount = None
        subtotal_matches = re.findall(subtotal_pattern, text, re.IGNORECASE)
        if subtotal_matches:
            subtotal_amount = float(subtotal_matches[0][1])
        
        # Extract payment method
        payment_pattern = r'(PAYMENT|PAID BY|METHOD)[:]\s*([A-Za-z]+)'
        payment_method = None
        payment_matches = re.findall(payment_pattern, text, re.IGNORECASE)
        if payment_matches:
            payment_method = payment_matches[0][1]
        
        # Extract receipt number
        receipt_number_pattern = r'(RECEIPT|INVOICE|ORDER)[\s#:]*([A-Za-z0-9-]+)'
        receipt_number = None
        receipt_matches = re.findall(receipt_number_pattern, text, re.IGNORECASE)
        if receipt_matches:
            receipt_number = receipt_matches[0][1]
        
        return {
            'merchant_name': merchant_name,
            'total_amount': total_amount,
            'purchased_at': purchased_at,
            'tax_amount': tax_amount,
            'subtotal_amount': subtotal_amount,
            'payment_method': payment_method,
            'receipt_number': receipt_number,
            'currency': 'USD',  # Default currency
        }
    except Exception as e:
        # Log the error in a real implementation
        print(f"Error extracting data: {str(e)}")
        # Return fallback data
        return {
            'merchant_name': "Error extracting merchant",
            'total_amount': 0.0,
            'purchased_at': datetime.now(),
            'currency': 'USD',
        }

class ReceiptProcessView(APIView):
    """API endpoint for processing receipt files and extracting information."""
    
    def post(self, request, *args, **kwargs):
        receipt_id = request.data.get('receipt_id')
        
        # Check if receipt ID was provided
        if not receipt_id:
            return Response(
                {'error': 'No receipt ID provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the receipt file record
            receipt_file = ReceiptFile.objects.get(id=receipt_id)
        except ReceiptFile.DoesNotExist:
            return Response(
                {'error': f'Receipt with ID {receipt_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if receipt is valid
        if not receipt_file.is_valid:
            return Response(
                {
                    'error': f'Receipt file is invalid: {receipt_file.invalid_reason}',
                    'id': receipt_file.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if receipt is already processed
        if receipt_file.is_processed:
            return Response(
                {
                    'error': 'Receipt file has already been processed',
                    'id': receipt_file.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if file exists on disk
        file_path = os.path.join(settings.MEDIA_ROOT, receipt_file.file_path)
        if not os.path.exists(file_path):
            receipt_file.is_valid = False
            receipt_file.invalid_reason = "File not found on disk"
            receipt_file.save()
            return Response(
                {
                    'error': 'File not found on disk',
                    'id': receipt_file.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Extract data from receipt file using OCR/AI
            # First extract text from the PDF
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                # Extract text from all pages
                for page_num in range(len(reader.pages)):
                    text += reader.pages[page_num].extract_text()
                    
            # Now pass the extracted text to the AI extraction function
            extracted_data = extract_receipt_data_with_ai(text)
            
            # Create Receipt record with extracted data
            receipt = Receipt.objects.create(
                receipt_file=receipt_file,
                merchant_name=extracted_data['merchant_name'],
                total_amount=extracted_data['total_amount'],
                purchased_at=extracted_data['purchased_at'],
                currency=extracted_data['currency'],
                tax_amount=extracted_data.get('tax_amount'),
                subtotal_amount=extracted_data.get('subtotal_amount'),
                payment_method=extracted_data.get('payment_method'),
                receipt_number=extracted_data.get('receipt_number')
            )
            
            # Update receipt_file record
            receipt_file.is_processed = True
            receipt_file.save()
            
            return Response({
                'id': receipt_file.id,
                'receipt_id': receipt.id,
                'merchant_name': receipt.merchant_name,
                'total_amount': str(receipt.total_amount),  # Convert Decimal to string for JSON serialization
                'purchased_at': receipt.purchased_at.isoformat(),
                'currency': receipt.currency,
                'tax_amount': str(receipt.tax_amount) if receipt.tax_amount else None,
                'subtotal_amount': str(receipt.subtotal_amount) if receipt.subtotal_amount else None,
                'payment_method': receipt.payment_method,
                'receipt_number': receipt.receipt_number,
                'message': 'Receipt processed successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    'error': f'Error processing receipt: {str(e)}',
                    'id': receipt_file.id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReceiptListView(APIView):
    """API endpoint for listing all receipts."""
    
    def get(self, request, *args, **kwargs):
        # Get all receipts that have been processed
        receipts = Receipt.objects.select_related('receipt_file').filter(
            receipt_file__is_processed=True
        ).order_by('-purchased_at')
        
        # Format the response data
        receipts_data = []
        for receipt in receipts:
            receipts_data.append({
                'id': receipt.id,
                'receipt_file_id': receipt.receipt_file.id,
                'merchant_name': receipt.merchant_name,
                'total_amount': str(receipt.total_amount),
                'purchased_at': receipt.purchased_at.isoformat(),
                'currency': receipt.currency,
                'file_name': receipt.receipt_file.file_name,
                'created_at': receipt.created_at.isoformat()
            })
        
        return Response(receipts_data, status=status.HTTP_200_OK)

class ReceiptDetailView(APIView):
    """API endpoint for retrieving a specific receipt by ID."""
    
    def get(self, request, receipt_id, *args, **kwargs):
        try:
            # Get the specific receipt
            receipt = Receipt.objects.select_related('receipt_file').get(id=receipt_id)
            
            # Format the detailed response data
            receipt_data = {
                'id': receipt.id,
                'receipt_file_id': receipt.receipt_file.id,
                'merchant_name': receipt.merchant_name,
                'total_amount': str(receipt.total_amount),
                'purchased_at': receipt.purchased_at.isoformat(),
                'currency': receipt.currency,
                'tax_amount': str(receipt.tax_amount) if receipt.tax_amount else None,
                'subtotal_amount': str(receipt.subtotal_amount) if receipt.subtotal_amount else None,
                'payment_method': receipt.payment_method,
                'receipt_number': receipt.receipt_number,
                'file_name': receipt.receipt_file.file_name,
                'file_path': receipt.receipt_file.file_path,
                'created_at': receipt.created_at.isoformat(),
                'updated_at': receipt.updated_at.isoformat()
            }
            
            return Response(receipt_data, status=status.HTTP_200_OK)
            
        except Receipt.DoesNotExist:
            return Response(
                {'error': f'Receipt with ID {receipt_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
