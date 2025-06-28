"use client"

import type React from "react"
import { Loader2, FileText, Calendar, DollarSign } from "lucide-react"
import ReceiptItem from "./ReceiptItem"

interface ReceiptListProps {
  receipts: Array<{
    id: number
    merchant_name: string
    total_amount: string
    purchased_at: string
    file_name: string
  }>
  onSelectReceipt: (receiptId: number) => void
  loading: boolean
}

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, onSelectReceipt, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600">Loading receipts...</p>
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No receipts found</h3>
        <p className="text-slate-600 mb-4">Upload and process receipts to see them here.</p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Track dates</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Monitor expenses</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {receipts.map((receipt) => (
        <ReceiptItem key={receipt.id} receipt={receipt} onClick={() => onSelectReceipt(receipt.id)} />
      ))}
    </div>
  )
}

export default ReceiptList
