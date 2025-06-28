from rest_framework import serializers
from .models import ReceiptFile, Receipt

class ReceiptFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptFile
        fields = '__all__'

class ReceiptSerializer(serializers.ModelSerializer):
    receipt_file = ReceiptFileSerializer(read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'
        