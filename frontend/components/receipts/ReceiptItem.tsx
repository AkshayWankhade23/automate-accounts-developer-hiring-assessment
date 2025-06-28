"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, ChevronRight } from "lucide-react"

interface ReceiptItemProps {
  receipt: {
    id: number
    merchant_name: string
    total_amount: string
    purchased_at: string
    file_name: string
  }
  onClick: () => void
}

const ReceiptItem: React.FC<ReceiptItemProps> = ({ receipt, onClick }) => {
  const formattedDate = new Date(receipt.purchased_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const formattedTime = new Date(receipt.purchased_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-200 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{receipt.merchant_name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    <span className="text-slate-400">•</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {receipt.file_name}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">${receipt.total_amount}</span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReceiptItem
