"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, File, X, CheckCircle } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; type: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const processFile = async (file: File) => {
    setIsProcessing(true)
    try {
      const content = await file.text()
      onFileUpload(file, content)
      setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size, type: file.type }])
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      files.forEach(processFile)
    },
    [onFileUpload],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach(processFile)
    },
    [onFileUpload],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver ? "drag-over" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="*/*" />

        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-cyan-50 rounded-full">
            <Upload className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isProcessing ? "Processing files..." : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Any file type supported • No size limits</p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-green-800 truncate">{file.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="p-1 hover:bg-green-100 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-green-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
