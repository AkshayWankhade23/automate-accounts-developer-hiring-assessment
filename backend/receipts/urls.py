from django.urls import path
from .views import ReceiptUploadView, ReceiptValidateView, ReceiptProcessView, ReceiptListView, ReceiptDetailView

urlpatterns = [
    path('upload/', ReceiptUploadView.as_view(), name='receipt-upload'),
    path('validate/', ReceiptValidateView.as_view(), name='receipt-validate'),
    path('process/', ReceiptProcessView.as_view(), name='receipt-process'),
    path('receipts/', ReceiptListView.as_view(), name='receipt-list'),
    path('receipts/<int:receipt_id>/', ReceiptDetailView.as_view(), name='receipt-detail'),
]
