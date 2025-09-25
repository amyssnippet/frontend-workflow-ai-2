"use client"

import type React from "react"

import { useState } from "react"
import { MermaidDisplay } from "@/components/mermaid-display"

export default function Home() {
  const [textInput, setTextInput] = useState("")
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const response = await fetch("http://localhost:8000/generate/", {
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
    <div className="flex h-screen">
      {/* Left Panel: Input */}
      <div className="w-1/2 p-8 border-r border-gray-200 flex flex-col">
        <h1 className="text-3xl font-bold mb-6 text-balance">Flowcharts AI</h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
              Text Description
            </label>
            <textarea
              id="text-input"
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter a description for your flowchart..."
            />
          </div>
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700">
              Upload Document (any format)
            </label>
            <input
              id="file-input"
              type="file"
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading || (!textInput && !fileInput)}
          >
            {loading ? "Generating..." : "Generate Flowchart"}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      </div>

      {/* Right Panel: Mermaid Live Editor */}
      <div className="w-1/2 p-8 flex flex-col items-center justify-center bg-gray-50">
        {mermaidCode ? (
          <MermaidDisplay chart={mermaidCode} />
        ) : (
          <div className="text-center text-gray-500 text-lg">
            {loading ? <p>Loading flowchart...</p> : <p>Welcome to Flowcharts AI</p>}
          </div>
        )}
      </div>
    </div>
  )
}
