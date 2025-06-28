import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/receipts';

interface Receipt {
  id: number;
  merchant_name: string;
  total_amount: string;
  purchased_at: string;
  file_name: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
  currency?: string;
  tax_amount?: string;
  subtotal_amount?: string;
  payment_method?: string;
  receipt_number?: string;
}

interface ValidationResponse {
  is_valid: boolean;
  invalid_reason?: string;
}

const ReceiptManagement: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  // Fetch all receipts
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Receipt[]>(`${API_BASE_URL}/receipts/`);
      setReceipts(response.data);
    } catch (error: any) {
      setMessage(`Error fetching receipts: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single receipt by ID
  const fetchReceiptById = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.get<Receipt>(`${API_BASE_URL}/receipts/${id}/`);
      setSelectedReceipt(response.data);
    } catch (error: any) {
      setMessage(`Error fetching receipt: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setMessage('');
      const response = await axios.post(`${API_BASE_URL}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('File uploaded successfully');
      setMessageType('success');
      fetchReceipts();
    } catch (error: any) {
      setMessage(`Error uploading file: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle file validation
  const handleValidate = async () => {
    if (!file) {
      setMessage('Please select a file');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setMessage('');
      const response = await axios.post<ValidationResponse>(`${API_BASE_URL}/validate/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.is_valid) {
        setMessage('File is a valid PDF');
        setMessageType('success');
      } else {
        setMessage(`Invalid PDF: ${response.data.invalid_reason}`);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`Error validating file: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle file processing
  const handleProcess = async () => {
    if (!file) {
      setMessage('Please select a file');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setMessage('');
      const response = await axios.post(`${API_BASE_URL}/process/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('File processed successfully');
      setMessageType('success');
      fetchReceipts();
    } catch (error: any) {
      setMessage(`Error processing file: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Receipt Management System</h1>

      {/* File Upload Section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Upload Receipt</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 p-2 border rounded w-full"
        />
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={handleValidate}
            disabled={loading || !file}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 transition"
          >
            {loading ? 'Validating...' : 'Validate'}
          </button>
          <button
            onClick={handleProcess}
            disabled={loading || !file}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-purple-300 transition"
          >
            {loading ? 'Processing...' : 'Process'}
          </button>
        </div>
        {message && (
          <div className={`mt-3 p-3 rounded ${
            messageType === 'success' ? 'bg-green-50 text-green-700' : 
            messageType === 'error' ? 'bg-red-50 text-red-700' : ''
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Receipts List */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-3">Receipts</h2>
        {loading && <div className="flex justify-center my-4"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}
        {receipts.length === 0 && !loading ? (
          <p className="text-gray-500 text-center py-4">No receipts found. Upload and process a receipt to see it here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition shadow-sm"
                onClick={() => fetchReceiptById(receipt.id)}
              >
                <p className="text-lg font-medium">{receipt.merchant_name}</p>
                <p className="text-gray-600">{new Date(receipt.purchased_at).toLocaleDateString()}</p>
                <p className="font-bold mt-2">${receipt.total_amount}</p>
                <p className="text-xs text-gray-500 mt-1">{receipt.file_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Receipt Details */}
      {selectedReceipt && (
        <div className="border p-4 rounded-lg bg-white shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Receipt Details</h2>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Merchant:</span>
              <span>{selectedReceipt.merchant_name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Amount:</span>
              <span>${selectedReceipt.total_amount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Date:</span>
              <span>{new Date(selectedReceipt.purchased_at).toLocaleDateString()}</span>
            </div>
            {selectedReceipt.tax_amount && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Tax:</span>
                <span>${selectedReceipt.tax_amount}</span>
              </div>
            )}
            {selectedReceipt.subtotal_amount && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Subtotal:</span>
                <span>${selectedReceipt.subtotal_amount}</span>
              </div>
            )}
            {selectedReceipt.payment_method && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Payment Method:</span>
                <span>{selectedReceipt.payment_method}</span>
              </div>
            )}
            {selectedReceipt.receipt_number && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Receipt Number:</span>
                <span>{selectedReceipt.receipt_number}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">File Name:</span>
              <span className="text-sm text-gray-600">{selectedReceipt.file_name}</span>
            </div>
            {selectedReceipt.created_at && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Created At:</span>
                <span>{new Date(selectedReceipt.created_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  return <ReceiptManagement />;
}