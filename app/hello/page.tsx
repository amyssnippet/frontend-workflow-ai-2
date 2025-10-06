"use client"

import React, { useState, useEffect } from "react"
import { useAppContext } from "@/components/layout/AppLayout"
import MermaidChart from "@/components/FlowchartCanvas"
import { FileText, Upload, Download, Share, LayoutTemplateIcon, History, DownloadCloud, Cpu, RefreshCcw } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_LLM_API_URL || "http://localhost:8000"

type ProcessStep = {
  step: number
  title: string
  status: string
  image: string | null
}

export default function HelloPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "process" | "regenerate" | "simulate">("generate")
  const [textInput, setTextInput] = useState("")
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [jsonInput, setJsonInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([])
  const [docxUrl, setDocxUrl] = useState<string | null>(null)
  const [concurrency, setConcurrency] = useState<{ max_concurrent_requests: number; used_slots: number; available_slots: number } | null>(null)
  const [simulateResult, setSimulateResult] = useState<any>(null)

  const { mermaidCode, setMermaidCode } = useAppContext()

  const isBusy = concurrency ? concurrency.available_slots <= 0 : false

  useEffect(() => {
    fetchConcurrency()
  }, [])

  const fetchConcurrency = async () => {
    try {
      const res = await fetch(`${API_BASE}/concurrency-status/`)
      if (!res.ok) return
      const data = await res.json()
      setConcurrency(data)
      return data
    } catch (e) {
      // ignore
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDocxUrl(null)
    try {
      // check concurrency before submitting
      const status = await fetchConcurrency()
      if (status && status.available_slots <= 0) {
        setError('Server is busy. Please try again in a few seconds.')
        setLoading(false)
        return
      }
      const form = new FormData()
      if (textInput) form.append("description", textInput)
      if (fileInput) form.append("file", fileInput)

      const res = await fetch(`${API_BASE}/generate-docx/`, {
        method: "POST",
        body: form,
      })

      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      if (data.mermaid) {
        setMermaidCode(data.mermaid)
      }
      if (data.docx_url) {
        const url = makeAbsoluteUrl(data.docx_url)
        setDocxUrl(url)
      }
      fetchConcurrency()
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleProcessImages = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setProcessSteps([])
    setDocxUrl(null)
    try {
      // check concurrency before submitting
      const status = await fetchConcurrency()
      if (status && status.available_slots <= 0) {
        setError('Server is busy. Please try again in a few seconds.')
        setLoading(false)
        return
      }
      const form = new FormData()
      if (multiFiles && multiFiles.length) {
        multiFiles.forEach((f) => form.append("files", f))
      } else {
        throw new Error("Please select one or more images")
      }

      const res = await fetch(`${API_BASE}/generate-process-images/`, {
        method: "POST",
        body: form,
      })

      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
  if (data.process_steps) setProcessSteps(data.process_steps.map((s: ProcessStep) => ({ ...s, image: makeAbsoluteUrl(s.image) })))
  if (data.sop_docx_url) setDocxUrl(makeAbsoluteUrl(data.sop_docx_url))
      if (data.workflow_steps && data.workflow_steps.length && !mermaidCode) {
        // optionally set the first mermaid if available
        const first = data.workflow_steps[0]
        if (first && first.full_analysis) setMermaidCode(first.full_analysis)
      }
      fetchConcurrency()
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDocxUrl(null)
    try {
      const parsed = JSON.parse(jsonInput)
      const res = await fetch(`${API_BASE}/regenerate-docx/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      if (data.sop_docx_url) setDocxUrl(makeAbsoluteUrl(data.sop_docx_url))
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  // Utility: make relative /static URLs absolute (to backend API)
  const makeAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null
    try {
      // Already absolute
      // eslint-disable-next-line no-new
      new URL(url)
      return url
    } catch (e) {
      // Not absolute — prefix with API_BASE
      if (url.startsWith('/')) return `${API_BASE}${url}`
      return `${API_BASE}/${url}`
    }
  }

  // View DOCX in new tab (attempt) and Download
  const viewDocx = async () => {
    if (!docxUrl) return
    // Attempt to open HTML preview from backend
    const filename = docxUrl.split('/').pop()
    if (!filename) return
    const previewUrl = `${API_BASE}/preview-docx/${encodeURIComponent(filename)}`
    window.open(previewUrl, '_blank')
  }

  const downloadDocx = async () => {
    if (!docxUrl) return
    const abs = makeAbsoluteUrl(docxUrl)
    if (!abs) return
    try {
      const res = await fetch(abs)
      if (!res.ok) throw new Error('Failed to fetch docx')
      const blob = await res.blob()
      const filename = docxUrl.split('/').pop() || 'document.docx'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      setError(err.message || String(err))
    }
  }

  const handleSimulate = async (count = 10, seconds = 3) => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("count", String(count))
      form.append("dummy_seconds", String(seconds))
      const res = await fetch(`${API_BASE}/simulate-parallel/`, { method: "POST", body: form })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setSimulateResult(data)
      fetchConcurrency()
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden px-6 py-8">
      <div className="w-96 p-6 bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-white/10 dark:border-black/20 rounded-2xl overflow-y-auto flex-shrink-0 shadow-lg">
        <div className="space-y-6">
          <div className="mb-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">LLM Tools</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate flowcharts, process images into SOPs, and produce DOCX reports — all powered by the LLM service.</p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/50 border border-white/20 dark:border-black/20 rounded-xl shadow-md p-4 backdrop-blur-sm">
            <div role="tablist" aria-label="LLM tabs" className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab("generate")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <FileText className="h-4 w-4" /> Generate
              </button>
              <button onClick={() => setActiveTab("process")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'process' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Upload className="h-4 w-4" /> Process
              </button>
              <button onClick={() => setActiveTab("regenerate")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'regenerate' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <RefreshCcw className="h-4 w-4" /> Regenerate
              </button>
              <button onClick={() => setActiveTab("simulate")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'simulate' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Cpu className="h-4 w-4" /> Simulate
              </button>
            </div>

            {/* Forms */}
            {activeTab === "generate" && (
              <form onSubmit={handleGenerate} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Text Description</label>
                <textarea rows={5} className="w-full rounded-lg border border-white/20 dark:border-black/20 p-3 bg-white/30 dark:bg-black/30 text-sm placeholder-gray-400 text-gray-900 dark:text-gray-100" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Describe your process or workflow..." />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</label>
                <div className="flex items-center gap-2">
                  <input id="fileSingle" type="file" className="sr-only" onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)} />
                  <label htmlFor="fileSingle" className="inline-flex items-center gap-2 py-2 px-3 bg-white/20 dark:bg-black/20 border border-white/10 dark:border-black/30 rounded-md cursor-pointer text-sm text-gray-800 dark:text-gray-200"> <DownloadCloud className="h-4 w-4" /> Choose file</label>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{fileInput ? fileInput.name : 'No file selected'}</span>
                </div>
                <button type="submit" disabled={loading || (!textInput && !fileInput) || isBusy} className="w-full py-2 bg-indigo-600 text-white rounded-lg shadow hover:brightness-105 transition">
                  {loading ? 'Generating...' : (isBusy ? 'Server busy — try later' : 'Generate Flowchart & DOCX')}
                </button>
              </form>
            )}

            {activeTab === "process" && (
              <form onSubmit={handleProcessImages} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Images (multiple)</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setMultiFiles(e.target.files ? Array.from(e.target.files) : [])} className="w-full text-sm text-gray-500" />
                <div className="flex gap-2">
                  <button type="submit" disabled={loading || multiFiles.length === 0 || isBusy} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg shadow hover:brightness-105 transition">{loading ? 'Processing...' : (isBusy ? 'Server busy — try later' : 'Process Images')}</button>
                  <button type="button" onClick={() => { setMultiFiles([]); setProcessSteps([]); }} className="py-2 px-3 bg-white/20 dark:bg-black/20 border rounded-md">Clear</button>
                </div>
              </form>
            )}

            {activeTab === "regenerate" && (
              <form onSubmit={handleRegenerate} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workflow Steps JSON</label>
                <textarea rows={8} className="w-full rounded-lg border border-white/10 dark:border-black/20 p-3 font-mono text-xs bg-white/20 dark:bg-black/20 text-gray-900 dark:text-gray-100" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='[ { "number":1, "title":"Step 1", "description":"...", "full_analysis":"..." } ]' />
                <button type="submit" disabled={loading || !jsonInput} className="w-full py-2 bg-indigo-600 text-white rounded-lg shadow hover:brightness-105 transition">{loading ? 'Regenerating...' : 'Regenerate DOCX'}</button>
              </form>
            )}

            {activeTab === "simulate" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Run a quick CPU-parallel simulation to validate concurrency.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSimulate(10, 3)} className="py-2 bg-indigo-600 text-white rounded-md">Run 10x 3s</button>
                  <button onClick={() => handleSimulate(5, 5)} className="py-2 bg-indigo-600 text-white rounded-md">Run 5x 5s</button>
                </div>
                {simulateResult && <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">{JSON.stringify(simulateResult, null, 2)}</pre>}
              </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-600/10 dark:bg-red-900/20 border border-red-200/30 dark:border-red-800/30 rounded-md flex items-start gap-3">
                <div className="text-red-600">●</div>
                <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
                <button onClick={() => setError(null)} className="ml-auto text-sm text-gray-400">Dismiss</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Service Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">API Base: <code className="bg-gray-100 px-1 rounded">{API_BASE}</code></p>
              <div className="mt-3">
                <div className="h-2 bg-gray-100/50 dark:bg-gray-800/40 rounded-full overflow-hidden">
                  <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${concurrency ? ((concurrency.used_slots / concurrency.max_concurrent_requests) * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">Concurrency: {concurrency ? `${concurrency.used_slots}/${concurrency.max_concurrent_requests} used` : 'unknown'}</p>
              </div>
            </div>

            {docxUrl && (
              <div className="bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Generated DOCX</p>
                    <p className="text-xs text-gray-500">Download or open the generated report.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={viewDocx} className="inline-flex items-center gap-2 py-2 px-3 bg-white dark:bg-gray-900 rounded-md border"> <Download className="h-4 w-4 text-gray-700" /> View</button>
                    <button onClick={downloadDocx} className="inline-flex items-center gap-2 py-2 px-3 bg-indigo-600 text-white rounded-md shadow"> <Download className="h-4 w-4" /> Download</button>
                  </div>
                </div>
              </div>
            )}

            {processSteps.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <h4 className="text-sm font-medium mb-2">Process Steps</h4>
                <div className="grid grid-cols-1 gap-2">
                  {processSteps.map((s) => (
                    <div key={s.step} className="flex items-center gap-3 bg-white/40 dark:bg-black/30 p-2 rounded-md">
                      {s.image ? (
                        <img src={s.image} alt={s.title} className="w-16 h-12 object-cover rounded-md border" />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-500">No image</div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">{s.status}</div>
                      </div>
                      {s.image ? (
                        <a href={s.image} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm">View</a>
                      ) : (
                        <span className="text-xs text-gray-400">No preview</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-6 overflow-hidden min-w-0 relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/60 dark:bg-black/50 flex items-center justify-center">
            <div className="rounded-full bg-indigo-600 p-4 shadow-lg">
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          </div>
        )}

        {mermaidCode ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated Flowchart</h3>
              <div className="flex items-center gap-2">
                <button title="Download" className="p-2 bg-white dark:bg-gray-900 rounded-md border"><Download className="h-4 w-4 text-gray-600" /></button>
                <button title="Share" className="p-2 bg-white dark:bg-gray-900 rounded-md border"><Share className="h-4 w-4 text-gray-600" /></button>
              </div>
            </div>
            <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden min-h-0">
              <MermaidChart chart={mermaidCode} className="w-full h-full" editable={true} onChartChange={setMermaidCode} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <div className="mt-4 text-gray-600 dark:text-gray-400">
                <p className="text-lg">Create your first flowchart</p>
                <p className="text-sm">Use the left panel to call the LLM service and generate charts, SOPs, or DOCX reports.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
