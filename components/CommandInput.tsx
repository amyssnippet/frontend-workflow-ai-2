"use client"

import type React from "react"
import { useState } from "react"
import FileUpload from "./FileUpload"
import { Bot, Lightbulb, Zap, Code, FileText } from "lucide-react"

interface CommandInputProps {
  onSubmit: (command: string, contentType?: string) => Promise<void>
  onContentUpload?: (content: string, contentType: string) => Promise<void>
}

export default function CommandInput({ onSubmit, onContentUpload }: CommandInputProps) {
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

  const handleFileUpload = async (file: File, content: string) => {
    if (!onContentUpload) return

    setIsLoading(true)

    try {
      // Determine content type based on file extension and content
      let contentType = "general"
      const fileName = file.name.toLowerCase()

      if (
        fileName.endsWith(".py") ||
        fileName.endsWith(".js") ||
        fileName.endsWith(".ts") ||
        fileName.endsWith(".jsx") ||
        fileName.endsWith(".tsx") ||
        fileName.endsWith(".java") ||
        fileName.endsWith(".cpp") ||
        fileName.endsWith(".c") ||
        content.includes("def ") ||
        content.includes("function ") ||
        content.includes("class ")
      ) {
        contentType = "code"
      } else if (
        fileName.endsWith(".md") ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx")
      ) {
        contentType = "story"
      }

      await onContentUpload(content, contentType)
    } catch (error) {
      console.error("Error processing file:", error)
      alert(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const exampleCommands = [
    "Add a decision node between process1 and end",
    "Create a user authentication flow",
    "Generate a data processing pipeline",
    "Add error handling nodes to the flow",
    "Create a parallel process workflow",
  ]

  const codeExamples = [
    "Upload Python code to generate flowchart",
    "Upload JavaScript functions for visualization",
    "Convert algorithm to flowchart diagram",
  ]

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-emerald-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Bot className="w-5 h-5 text-cyan-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">MermaidStable3B AI</h2>
        </div>
        <p className="text-sm text-gray-600">Upload code/documents or use natural language commands</p>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">Smart Document Upload</h3>
          </div>
          <FileUpload onFileUpload={handleFileUpload} />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-blue-600">
              <Code className="w-3 h-3" />
              <span>Code → Flowchart</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <FileText className="w-3 h-3" />
              <span>Text → Process Flow</span>
            </div>
          </div>
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
                  Processing with AI...
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

        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            MermaidStable3B Integration
          </h4>
          <p className="text-xs text-emerald-700 mb-3 leading-relaxed">
            This app uses MermaidStable3B AI model for intelligent flowchart generation from code and natural language.
          </p>
          <div className="space-y-1">
            <p className="text-xs text-emerald-600">✓ Code analysis and flowchart generation</p>
            <p className="text-xs text-emerald-600">✓ Natural language command processing</p>
            <p className="text-xs text-emerald-600">✓ Smart content type detection</p>
          </div>
        </div>
      </div>
    </div>
  )
}
