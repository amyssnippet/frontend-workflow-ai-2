"use client"

import React, { useState } from "react"
import { useAppContext } from "@/components/layout/AppLayout"
import MermaidChart from "@/components/FlowchartCanvas"
import { FileText, Upload, Download, Share, LayoutTemplateIcon, History } from "lucide-react"

export default function NewFlowchart() {
  const [textInput, setTextInput] = useState("")
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { mermaidCode, setMermaidCode } = useAppContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMermaidCode(null)

    const formData = new FormData()
    if (textInput) {
      formData.append("description", textInput)
    }
    if (fileInput) {
      formData.append("file", fileInput)
    }

    try {
      const response = await fetch("http://localhost:8000/generate-docx/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.mermaid) {
        setMermaidCode(data.mermaid)
      } else {
        setError("No mermaid code received from the backend.")
      }
    } catch (e: any) {
      setError(`Failed to fetch: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Form Panel */}
      <div className="w-96 p-6 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto flex-shrink-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create Flowchart
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="text-input" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Text Description
                </label>
                <textarea
                  id="text-input"
                  rows={6}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe your flowchart process or workflow..."
                />
              </div>

              <div>
                <label 
                  htmlFor="file-input" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Upload Document
                </label>
                <div className="relative">
                  <input
                    id="file-input"
                    type="file"
                    className="w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      dark:file:bg-indigo-900 dark:file:text-indigo-300
                      dark:hover:file:bg-indigo-800
                      border border-gray-300 dark:border-gray-600 rounded-md"
                    onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                {fileInput && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {fileInput.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading || (!textInput && !fileInput)}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Flowchart"
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <LayoutTemplateIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">Templates</p>
              </button>
              <button className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">Recent</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mermaid Chart Panel */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-6 overflow-hidden min-w-0">
        {mermaidCode ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Generated Flowchart
              </h3>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Share className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden min-h-0">
              <MermaidChart 
                chart={mermaidCode} 
                className="w-full h-full" 
                editable={true}
                onChartChange={setMermaidCode}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              {loading ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                    <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Generating your flowchart...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                      Create Your Flowchart
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Enter a description or upload a document to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
