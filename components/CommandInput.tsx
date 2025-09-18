"use client"

import type React from "react"
import { useState } from "react"
import FileUpload from "./FileUpload"
import { Bot, Lightbulb, Zap } from "lucide-react"

interface CommandInputProps {
  onSubmit: (command: string) => Promise<void>
}

export default function CommandInput({ onSubmit }: CommandInputProps) {
  const [command, setCommand] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || isLoading) return

    setIsLoading(true)
    setLastCommand(command.trim())

    try {
      await onSubmit(command.trim())
      setCommand("")
    } catch (error) {
      console.error("Error submitting command:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: File, content: string) => {
    const fileCommand = `Analyze this ${file.type || "document"} and create a flowchart: ${file.name}\n\nContent preview: ${content.substring(0, 500)}...`
    setCommand(fileCommand)
  }

  const exampleCommands = [
    "Add a decision node between process1 and end",
    "Create a parallel process flow",
    "Add error handling nodes",
    "Generate a user authentication flow",
    "Create a data processing pipeline",
  ]

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-emerald-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Bot className="w-5 h-5 text-cyan-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
        </div>
        <p className="text-sm text-gray-600">Upload documents or use natural language commands</p>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">Document Upload</h3>
          </div>
          <FileUpload onFileUpload={handleFileUpload} />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
                AI Command
              </label>
              <textarea
                id="command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., Add a decision node after process1..."
                className="w-full h-28 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none text-sm bg-white shadow-sm"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={!command.trim() || isLoading}
              className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-cyan-700 hover:to-emerald-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Execute Command"
              )}
            </button>
          </form>
        </div>

        {lastCommand && (
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <h4 className="text-sm font-medium text-cyan-800 mb-2">Last Command</h4>
            <p className="text-xs text-cyan-700 leading-relaxed">{lastCommand}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-800">Example Commands</h3>
          </div>
          <div className="grid gap-2">
            {exampleCommands.map((example, index) => (
              <button
                key={index}
                onClick={() => setCommand(example)}
                disabled={isLoading}
                className="text-left p-3 text-xs text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Ollama Setup
          </h4>
          <p className="text-xs text-amber-700 mb-3 leading-relaxed">
            Ensure Ollama is running locally with the 'vivi:latest' model installed.
          </p>
          <div className="space-y-2">
            <code className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded block font-mono">
              ollama pull vivi:latest
            </code>
            <code className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded block font-mono">
              ollama run vivi:latest
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
