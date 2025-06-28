from django.db import models

# Create your models here.
class ReceiptFile(models.Model):
    """Model to store metadata of uploaded receipt files."""
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=255)
    is_valid = models.BooleanField(default=True)
    invalid_reason = models.TextField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.file_name

class Receipt(models.Model):
    """Model to store extracted information from valid receipt files."""
    receipt_file = models.ForeignKey(ReceiptFile, on_delete=models.CASCADE, related_name='receipts')
    purchased_at = models.DateTimeField()
    merchant_name = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields for receipt information
    currency = models.CharField(max_length=10, default='USD')
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    receipt_number = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.merchant_name} - {self.purchased_at}"
