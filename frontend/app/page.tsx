"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReceiptIcon, AlertCircle } from "lucide-react"
import UploadForm from "@/components/receipts/UploadForm"
import ReceiptList from "@/components/receipts/ReceiptList"
import ReceiptDetail from "@/components/receipts/ReceiptDetail"

const API_BASE_URL = "http://127.0.0.1:8000/api/receipts"

interface Receipt {
  id: number
  merchant_name: string
  total_amount: string
  purchased_at: string
  file_name: string
  currency: string
  tax_amount: string | null
  subtotal_amount: string | null
  payment_method: string | null
  receipt_number: string | null
}

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null)
  const [selectedReceiptDetails, setSelectedReceiptDetails] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    if (selectedReceiptId) {
      fetchReceiptDetails(selectedReceiptId)
    } else {
      setSelectedReceiptDetails(null)
    }
  }, [selectedReceiptId])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await axios.get(`${API_BASE_URL}/receipts/`)
      setReceipts(response.data)
    } catch (err: any) {
      setError("Failed to fetch receipts. Please check if the server is running.")
      console.error("Error fetching receipts:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReceiptDetails = async (receiptId: number) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/receipts/${receiptId}/`)
      setSelectedReceiptDetails(response.data)
    } catch (err: any) {
      console.error("Error fetching receipt details:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReceipt = (receiptId: number) => {
    setSelectedReceiptId(receiptId)
  }

  const handleCloseDetails = () => {
    setSelectedReceiptId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ReceiptIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Receipt Manager</h1>
              <p className="text-slate-600 mt-1">Upload, process, and manage your receipts</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-4">
            <UploadForm onUploadSuccess={fetchReceipts} apiBaseUrl={API_BASE_URL} />
          </div>

          {/* Receipts List Section */}
          <div className="lg:col-span-8">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-slate-900">Your Receipts</CardTitle>
                <CardDescription>
                  {receipts.length > 0
                    ? `${receipts.length} receipt${receipts.length === 1 ? "" : "s"} found`
                    : "No receipts uploaded yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <ReceiptList receipts={receipts} onSelectReceipt={handleSelectReceipt} loading={loading} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Receipt Detail Modal */}
      {selectedReceiptDetails && <ReceiptDetail receipt={selectedReceiptDetails} onClose={handleCloseDetails} />}
    </div>
  )
}
