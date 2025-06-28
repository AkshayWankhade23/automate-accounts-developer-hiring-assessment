"use client"

import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Receipt, Calendar, CreditCard, FileText, DollarSign, Hash, Building } from "lucide-react"

interface ReceiptDetailProps {
  receipt: {
    id: number
    merchant_name: string
    total_amount: string
    purchased_at: string
    currency: string
    tax_amount: string | null
    subtotal_amount: string | null
    payment_method: string | null
    receipt_number: string | null
    file_name: string
  } | null
  onClose: () => void
}

const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ receipt, onClose }) => {
  if (!receipt) return null

  const formattedDate = new Date(receipt.purchased_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    highlight = false,
  }: {
    icon: any
    label: string
    value: string
    highlight?: boolean
  }) => (
    <div
      className={`flex items-center justify-between py-3 ${highlight ? "bg-blue-50 border border-blue-100 -mx-6 px-6 rounded-lg" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${highlight ? "text-blue-600" : "text-slate-600"}`} />
        <span className={`font-medium ${highlight ? "text-slate-900" : "text-slate-800"}`}>{label}</span>
      </div>
      <span className={`${highlight ? "text-xl font-bold text-slate-900" : "text-slate-900 font-medium"}`}>
        {value}
      </span>
    </div>
  )

  return (
    <Dialog open={!!receipt} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl">
        <DialogHeader className="text-center pb-4 bg-white">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">{receipt.merchant_name}</DialogTitle>
          <DialogDescription className="flex items-center justify-center gap-2 text-slate-600">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 bg-white">
          <DetailRow
            icon={DollarSign}
            label="Total Amount"
            value={`${receipt.currency} ${receipt.total_amount}`}
            highlight={true}
          />

          <Separator className="my-4" />

          {receipt.subtotal_amount && (
            <DetailRow icon={DollarSign} label="Subtotal" value={`${receipt.currency} ${receipt.subtotal_amount}`} />
          )}

          {receipt.tax_amount && (
            <DetailRow icon={DollarSign} label="Tax" value={`${receipt.currency} ${receipt.tax_amount}`} />
          )}

          {receipt.payment_method && (
            <DetailRow icon={CreditCard} label="Payment Method" value={receipt.payment_method} />
          )}

          {receipt.receipt_number && <DetailRow icon={Hash} label="Receipt Number" value={receipt.receipt_number} />}

          <Separator className="my-4" />

          <DetailRow icon={FileText} label="File Name" value={receipt.file_name} />

          <DetailRow icon={Building} label="Receipt ID" value={`#${receipt.id}`} />
        </div>

        <div className="flex gap-3 pt-6 bg-white border-t border-slate-100 mt-4">
          <Button onClick={onClose} className="flex-1" size="lg">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptDetail
