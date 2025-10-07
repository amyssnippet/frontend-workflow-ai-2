"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAppContext } from "@/components/layout/AppLayout"
import MermaidChart from "@/components/FlowchartCanvas"
import { FileText, Upload, Download, Share, DownloadCloud, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

const API_BASE = process.env.NEXT_PUBLIC_LLM_API_URL || "http://localhost:8000"

type ProcessStep = {
  step: number
  title: string
  status: string
  image: string | null
}

export default function HelloPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "process">("generate")
  const [textInput, setTextInput] = useState("")
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  // jsonInput and regenerate/simulate removed — regenerate and simulate tabs removed
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([])
  const [docxUrl, setDocxUrl] = useState<string | null>(null)
  const [concurrency, setConcurrency] = useState<{ max_concurrent_requests: number; used_slots: number; available_slots: number } | null>(null)
  

  const { mermaidCode, setMermaidCode } = useAppContext()
  const [currentUser, setCurrentUser] = useState<{ id?: number; username?: string; email?: string } | null>(null)

  // Theme toggle for left sidebar
  const ThemeToggle = () => {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    )
  }

  const isBusy = concurrency ? concurrency.available_slots <= 0 : false

  useEffect(() => {
    fetchConcurrency()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) {
        setCurrentUser(null)
        return
      }
      const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) {
        setCurrentUser(null)
        return
      }
      const data = await res.json()
      setCurrentUser({ id: data.id, username: data.username || data.name, email: data.email })
    } catch (e) {
      setCurrentUser(null)
    }
  }

  const signOut = async () => {
    try {
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
      const API = API_BASE
      if (refresh) {
        await fetch(`${API}/auth/signout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }) })
      } else {
        const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (access) await fetch(`${API}/auth/signout`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
      }
    } catch (e) {
      // ignore errors
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
      setCurrentUser(null)
    }
  }

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

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFileInput(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dt = e.dataTransfer
    if (dt && dt.files && dt.files.length > 0) {
      handleFileSelect(dt.files)
      dt.clearData()
    } else {
      // if plain text dropped, populate description
      const text = dt?.getData('text/plain')
      if (text) setTextInput(text)
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

  // Regenerate handler removed with UI

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

  // Simulate removed

  return (
    <div className="flex h-full overflow-hidden px-6 py-8">
      <div className="w-96 p-6 bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-white/10 dark:border-black/20 rounded-2xl flex flex-col h-full flex-shrink-0 shadow-lg">
        <div className="space-y-6 overflow-y-auto flex-1">
          <div className="mb-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">FlowChartAI</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate flowcharts, process images into SOPs, and produce DOCX reports — all powered by the AI models.</p>
            
          </div>

          <div className="bg-white/70 dark:bg-gray-900/50 border border-white/20 dark:border-black/20 rounded-xl shadow-md p-4 backdrop-blur-sm">
            <div role="tablist" aria-label="LLM tabs" className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab("generate")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <FileText className="h-4 w-4" /> Generate
              </button>
              <button onClick={() => setActiveTab("process")} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'process' ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Upload className="h-4 w-4" /> Process
              </button>
              {/* Regenerate and Simulate tabs removed — simplified to Generate & Process only */}
            </div>

            {/* Forms */}
            {activeTab === "generate" && (
              <form onSubmit={handleGenerate} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Text Description</label>
                <textarea rows={5} className="w-full rounded-lg border border-white/20 dark:border-black/20 p-3 bg-white/30 dark:bg-black/30 text-sm placeholder-gray-400 text-gray-900 dark:text-gray-100" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Describe your process or workflow..." />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`flex items-center gap-2 p-3 rounded-md border border-dashed ${dragActive ? 'border-indigo-400 bg-indigo-50/30' : 'border-white/10 bg-transparent'} cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {fileInput ? (
                        <div className="flex items-center justify-between">
                          <span className="truncate">{fileInput.name}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFileInput(null); }} className="ml-2 text-xs text-red-600">Remove</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <DownloadCloud className="h-4 w-4" />
                          <span>Drag & drop a document here, or click to choose</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input id="fileSingle" ref={fileInputRef} type="file" className="sr-only" onChange={handleFileInputChange} />
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

            {/* regenerate & simulate UI removed */}
            {/* Inline Mermaid editor: shows when there's generated mermaid and Generate tab is active */}
            {activeTab === 'generate' && mermaidCode && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Edit Generated Flowchart (Mermaid)</label>
                <textarea rows={8} className="w-full rounded-lg border border-white/10 dark:border-black/20 p-3 font-mono text-xs bg-white/20 dark:bg-black/20 text-gray-900 dark:text-gray-100" value={mermaidCode} onChange={(e) => setMermaidCode(e.target.value)} />
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
              {/* profile moved to footer */}
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

            {/* {processSteps.length > 0 && (
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
            )} */}
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="sr-only">User avatar</span>
              </div>
              <div className="flex-1 min-w-0">
                {currentUser ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.username || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Guest</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Not signed in</p>
                  </>
                )}
              </div>
            </div>
            <div className="ml-2 flex items-center gap-2">
              <ThemeToggle />
              {currentUser ? (
                <button onClick={signOut} className="text-sm text-red-600">Sign out</button>
              ) : (
                <a href="/signin" className="text-sm text-indigo-600">Sign in</a>
              )}
            </div>
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

        {activeTab === 'generate' ? (
          mermaidCode ? (
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
                  <p className="text-sm">Use the left panel to call the LLM service and generate a flowchart — it will appear here.</p>
                </div>
              </div>
            </div>
          )
        ) : activeTab === 'process' ? (
          docxUrl ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated DOCX Preview</h3>
                <div className="flex items-center gap-2">
                  <button onClick={viewDocx} className="p-2 bg-white dark:bg-gray-900 rounded-md border"><Download className="h-4 w-4 text-gray-600" /></button>
                  <button onClick={downloadDocx} className="p-2 bg-white dark:bg-gray-900 rounded-md border"><Share className="h-4 w-4 text-gray-600" /></button>
                </div>
              </div>
              <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden min-h-0 bg-white">
                {/* embed preview from backend preview endpoint */}
                <iframe src={`${API_BASE}/preview-docx/${encodeURIComponent(docxUrl.split('/').pop() || '')}`} title="DOCX Preview" className="w-full h-full" />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <div className="mt-4 text-gray-600 dark:text-gray-400">
                  <p className="text-lg">No generated DOCX yet</p>
                  <p className="text-sm">Run the "Process" flow on the left to generate a DOCX. Processed images and SOPs will appear here for preview.</p>
                </div>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
