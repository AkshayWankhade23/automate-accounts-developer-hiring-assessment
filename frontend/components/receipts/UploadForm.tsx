"use client"

import type React from "react"
import { useState, useCallback } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react"

interface UploadFormProps {
  onUploadSuccess: () => void
  apiBaseUrl: string
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, apiBaseUrl }) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null)
  const [validationSuccess, setValidationSuccess] = useState(false)
  const [processingSuccess, setProcessingSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile)
    setMessage("")
    setError("")
    setUploadedFileId(null)
    setValidationSuccess(false)
    setProcessingSuccess(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelection(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
    setMessage("")
    setError("")
    setUploadedFileId(null)
    setValidationSuccess(false)
    setProcessingSuccess(false)
  }

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    setError("")
    setMessage("Uploading file...")

    try {
      const response = await axios.post(`${apiBaseUrl}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setMessage(`File uploaded successfully: ${response.data.file_name}`)
      setUploadedFileId(response.data.id)
    } catch (err: any) {
      setError(`Upload failed: ${err.response?.data?.error || err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const validateReceipt = async () => {
    if (!uploadedFileId) return

    setUploading(true)
    setMessage("Validating receipt format...")
    setError("")

    try {
      const response = await axios.post(`${apiBaseUrl}/validate/`, {
        receipt_id: uploadedFileId,
      })
      setMessage("Receipt validation completed successfully!")
      setValidationSuccess(true)
    } catch (err: any) {
      setError(`Validation failed: ${err.response?.data?.error || err.message}`)
      setValidationSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  const processReceipt = async () => {
    if (!uploadedFileId || !validationSuccess) return

    setUploading(true)
    setMessage("Processing receipt data...")
    setError("")

    try {
      const response = await axios.post(`${apiBaseUrl}/process/`, {
        receipt_id: uploadedFileId,
      })
      setMessage("Receipt processed successfully!")
      setProcessingSuccess(true)
      onUploadSuccess()
      
      // Reset the form after a short delay to show success message
      setTimeout(() => {
        setFile(null)
        setUploadedFileId(null)
        setValidationSuccess(false)
        setProcessingSuccess(false)
        setMessage("")
      }, 2000)
    } catch (err: any) {
      setError(`Processing failed: ${err.response?.data?.error || err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const getProgressValue = () => {
    if (processingSuccess) return 100
    if (validationSuccess) return 66
    if (uploadedFileId) return 33
    return 0
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Receipt
        </CardTitle>
        <CardDescription>Upload a PDF receipt to extract and process the data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : file
                ? "border-green-300 bg-green-50"
                : "border-slate-300 hover:border-slate-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile} disabled={uploading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
                  <span className="text-slate-600"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={uploading}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">PDF files only</p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {(uploadedFileId || validationSuccess || processingSuccess) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="text-slate-900 font-medium">{getProgressValue()}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
            <div className="flex gap-2 text-xs">
              <Badge variant={uploadedFileId ? "default" : "secondary"}>Upload</Badge>
              <Badge variant={validationSuccess ? "default" : "secondary"}>Validate</Badge>
              <Badge variant={processingSuccess ? "default" : "secondary"}>Process</Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 ">
          <Button onClick={uploadFile} disabled={!file || uploading || !!uploadedFileId} className="w-full text-white bg-blue-600 hover:bg-blue-700" size="lg">
            {uploading && !uploadedFileId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : uploadedFileId ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Uploaded
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4 text-white" />
                Upload Receipt
              </>
            )}
          </Button>

          <Button
            onClick={validateReceipt}
            disabled={!uploadedFileId || uploading || validationSuccess}
            variant="secondary"
            className="w-full text-white bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {uploading && uploadedFileId && !validationSuccess ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : validationSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Validated
              </>
            ) : (
              "Validate Receipt"
            )}
          </Button>

          <Button
            onClick={processReceipt}
            disabled={!validationSuccess || uploading || processingSuccess}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {uploading && validationSuccess && !processingSuccess ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : processingSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Processed
              </>
            ) : (
              "Process Receipt"
            )}
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default UploadForm
