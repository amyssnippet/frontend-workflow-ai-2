"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAppContext } from "@/components/layout/AppLayout"
import MermaidChart from "@/components/FlowchartCanvas"
import { FileText, Upload, Download, Share, DownloadCloud, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

const API_BASE = "http://localhost:8000"
// const API_BASE = "https://flowai-backend.othersys.com"

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

  // Autosave / history and chat state
  const mermaidSaveTimer = useRef<number | null>(null)
  const docSaveTimer = useRef<number | null>(null)
  const mermaidAiTimer = useRef<number | null>(null)
  const docAiTimer = useRef<number | null>(null)
  const [mermaidAutosaveId, setMermaidAutosaveId] = useState<number | null>(null)
  const [docText, setDocText] = useState<string>("")
  const [docAutosaveId, setDocAutosaveId] = useState<number | null>(null)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [mermaidAiLoading, setMermaidAiLoading] = useState(false)
  const [docAiLoading, setDocAiLoading] = useState(false)
  const [autoAiMermaid, setAutoAiMermaid] = useState(false)
  const [autoAiDoc, setAutoAiDoc] = useState(false)

  // Chat
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")

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

  useEffect(() => {
    if (currentUser) {
      fetchHistory()
      fetchChats()
    }
  }, [currentUser])

  useEffect(() => {
    if (docxUrl) fetchPreviewText(docxUrl)
  }, [docxUrl])

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

  // Autosave helpers
  const saveMermaidAutosave = async (content: string) => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const payload: any = { type: 'mermaid', content }
      if (mermaidAutosaveId) payload.id = mermaidAutosaveId
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (access) headers['Authorization'] = `Bearer ${access}`
      const res = await fetch(`${API_BASE}/autosave`, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) return
      const d = await res.json()
      if (d.id) setMermaidAutosaveId(d.id)
      // refresh history list
      fetchHistory()
    } catch (e) {}
  }

  const saveDocAutosave = async (content: string) => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
  const payload: any = { type: 'docx', content }
  if (docAutosaveId) payload.id = docAutosaveId
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (access) headers['Authorization'] = `Bearer ${access}`
  const res = await fetch(`${API_BASE}/autosave`, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) return
      const d = await res.json()
      if (d.id) setDocAutosaveId(d.id)
      fetchHistory()
    } catch (e) {}
  }

  const handleMermaidChange = (value: string) => {
    setMermaidCode(value)
    if (mermaidSaveTimer.current) window.clearTimeout(mermaidSaveTimer.current)
    mermaidSaveTimer.current = window.setTimeout(() => {
      saveMermaidAutosave(value)
    }, 1200)
    // schedule AI repair if auto enabled
    if (autoAiMermaid) {
      if (mermaidAiTimer.current) window.clearTimeout(mermaidAiTimer.current)
      mermaidAiTimer.current = window.setTimeout(() => {
        callAiRepairMermaid(value, true)
      }, 2000)
    }
  }

  const handleDocTextChange = (value: string) => {
    setDocText(value)
    if (docSaveTimer.current) window.clearTimeout(docSaveTimer.current)
    docSaveTimer.current = window.setTimeout(() => {
      saveDocAutosave(value)
    }, 1200)
    if (autoAiDoc) {
      if (docAiTimer.current) window.clearTimeout(docAiTimer.current)
      docAiTimer.current = window.setTimeout(() => {
        callAiRepairDoc(value, true)
      }, 2000)
    }
  }

  // Fetch preview HTML and extract text for editing docx
  const fetchPreviewText = async (docxUrlLocal?: string) => {
    try {
      if (!docxUrlLocal) return
      const parts = docxUrlLocal.split('/')
      const filename = parts[parts.length-1]
      const res = await fetch(`${API_BASE}/preview-docx/${encodeURIComponent(filename)}`)
      if (!res.ok) return
      const html = await res.text()
      // strip tags for basic editable text
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      const text = tmp.innerText || tmp.textContent || ''
      setDocText(text)
    } catch (e) {}
  }

  // History
  const fetchHistory = async () => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const res = await fetch(`${API_BASE}/history/list`, { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) return
      const d = await res.json()
      setHistoryItems(d.items || [])
    } catch (e) {}
  }

  // Chat helpers
  const fetchChats = async () => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const res = await fetch(`${API_BASE}/chat/list`, { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) return
      const d = await res.json()
      setChats(d.items || [])
      if (!selectedChat && d.items && d.items.length) {
        setSelectedChat(d.items[0].id)
        fetchChatMessages(d.items[0].id)
      }
    } catch (e) {}
  }

  const createChat = async () => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const res = await fetch(`${API_BASE}/chat/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify({ title: 'New Chat' }) })
      if (!res.ok) return
      const d = await res.json()
      await fetchChats()
      setSelectedChat(d.id)
      setChatMessages([])
    } catch (e) {}
  }

  const fetchChatMessages = async (cid: number) => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const res = await fetch(`${API_BASE}/chat/${cid}/messages`, { headers: { Authorization: `Bearer ${access}` } })
      if (!res.ok) return
      const d = await res.json()
      setChatMessages(d.items || [])
    } catch (e) {}
  }

  const sendChatMessage = async () => {
    if (!selectedChat || !chatInput.trim()) return
    try {
      // Optimistically add user message
      const tempId = `tmp-${Date.now()}`
      const userMsg = { id: tempId, chat_id: selectedChat, role: 'user', content: chatInput, created_at: Math.floor(Date.now()/1000) }
      setChatMessages((s) => [...s, userMsg])

      // Determine mode and context
      let mode = 'chat'
      let context: string | undefined
      if (activeTab === 'generate' && mermaidCode) { mode = 'mermaid'; context = mermaidCode }
      else if (activeTab === 'process' && docText) { mode = 'doc'; context = docText }

      await streamChatMessage(selectedChat, chatInput, mode, context)
      setChatInput('')
    } catch (e) {}
  }

  const streamChatMessage = async (chatId: number, content: string, mode: string = 'chat', context?: string) => {
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (access) headers['Authorization'] = `Bearer ${access}`
      const res = await fetch(`${API_BASE}/chat/${chatId}/stream`, { method: 'POST', headers, body: JSON.stringify({ content, mode, context }) })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      // create assistant placeholder
      const assistantTempId = `tmp-assistant-${Date.now()}`
      setChatMessages((s) => [...s, { id: assistantTempId, chat_id: chatId, role: 'assistant', content: '', created_at: Math.floor(Date.now()/1000) }])
      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = !!readerDone
        if (value) {
          const chunk = decoder.decode(value)
          // append chunk to last assistant message
          setChatMessages((prev) => prev.map((m) => m.id === assistantTempId ? ({ ...m, content: m.content + chunk }) : m))
        }
      }
      // stream complete — fetch messages to get canonical saved messages
      await fetchChatMessages(chatId)
    } catch (e) {
      // ignore
    }
  }

  const editChatMessage = async (msg: any) => {
    const newContent = prompt('Edit message', msg.content)
    if (newContent === null) return
    try {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!access) return
      const res = await fetch(`${API_BASE}/chat/${msg.chat_id}/message/${msg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify({ content: newContent, regenerate: true }) })
      if (!res.ok) return
      await fetchChatMessages(msg.chat_id)
    } catch (e) {}
  }

  // AI repair calls
  const callAiRepairMermaid = async (content: string, autosaveAfter: boolean = false) => {
    try {
      setMermaidAiLoading(true)
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (access) headers['Authorization'] = `Bearer ${access}`
  const res = await fetch(`${API_BASE}/ai/mermaid/repair`, { method: 'POST', headers, body: JSON.stringify({ content }) })
      setMermaidAiLoading(false)
      if (!res.ok) return
      const d = await res.json()
      if (d.mermaid) {
        setMermaidCode(d.mermaid)
        if (autosaveAfter) {
          // persist via autosave AI endpoint
          const headers2: Record<string, string> = { 'Content-Type': 'application/json' }
          if (access) headers2['Authorization'] = `Bearer ${access}`
          const r2 = await fetch(`${API_BASE}/ai/mermaid/autosave`, { method: 'POST', headers: headers2, body: JSON.stringify({ content: d.mermaid, id: mermaidAutosaveId }) })
          if (r2.ok) {
            const d2 = await r2.json()
            if (d2.id) setMermaidAutosaveId(d2.id)
            fetchHistory()
          }
        }
      }
    } catch (e) {
      setMermaidAiLoading(false)
    }
  }

  const callAiRepairDoc = async (content: string, autosaveAfter: boolean = false) => {
    try {
      setDocAiLoading(true)
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (access) headers['Authorization'] = `Bearer ${access}`
  const res = await fetch(`${API_BASE}/ai/doc/repair`, { method: 'POST', headers, body: JSON.stringify({ content }) })
      setDocAiLoading(false)
      if (!res.ok) return
      const d = await res.json()
      if (d.content) {
        setDocText(d.content)
        if (autosaveAfter) {
          const headers2: Record<string, string> = { 'Content-Type': 'application/json' }
          if (access) headers2['Authorization'] = `Bearer ${access}`
          const r2 = await fetch(`${API_BASE}/ai/doc/autosave`, { method: 'POST', headers: headers2, body: JSON.stringify({ content: d.content, id: docAutosaveId }) })
          if (r2.ok) {
            const d2 = await r2.json()
            if (d2.id) setDocAutosaveId(d2.id)
            fetchHistory()
          }
        }
      }
    } catch (e) {
      setDocAiLoading(false)
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
                <textarea rows={8} className="w-full rounded-lg border border-white/10 dark:border-black/20 p-3 font-mono text-xs bg-white/20 dark:bg-black/20 text-gray-900 dark:text-gray-100" value={mermaidCode} onChange={(e) => handleMermaidChange(e.target.value)} />
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

            {/* Document history */}
            <div className="bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-3 shadow-sm mt-3">
              <h4 className="text-sm font-medium">History</h4>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                {historyItems.length === 0 && <div className="text-xs text-gray-500">No saved items</div>}
                {historyItems.map((h) => (
                  <div key={h.id} className="p-2 rounded-md bg-white/30 dark:bg-black/20 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{h.title}</div>
                      <div className="text-xs text-gray-500">{h.type} • {new Date(h.updated_at*1000).toLocaleString()}</div>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <button onClick={async () => {
                        // load into editor
                        if (h.type === 'mermaid') {
                          // fetch entry detail
                          const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
                          if (!access) return
                          const res = await fetch(`${API_BASE}/history/${h.id}`, { headers: { Authorization: `Bearer ${access}` } })
                          if (!res.ok) return
                          const d = await res.json()
                          setMermaidCode(d.item.content || '')
                          setMermaidAutosaveId(d.item.id)
                        } else {
                          // docx or other — attempt to fetch preview and load text
                          const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
                          if (!access) return
                          const res = await fetch(`${API_BASE}/history/${h.id}`, { headers: { Authorization: `Bearer ${access}` } })
                          if (!res.ok) return
                          const d = await res.json()
                          // content may be a path to static docx
                          if (d.item && d.item.content && d.item.content.startsWith('/')) {
                            const preview = makeAbsoluteUrl(d.item.content)
                            if (preview) {
                              await fetchPreviewText(preview)
                              setDocAutosaveId(d.item.id)
                            }
                          } else {
                            setDocText(d.item.content || '')
                            setDocAutosaveId(d.item.id)
                          }
                        }
                      }} className="text-xs text-indigo-600">Load</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat panel */}
            <div className="bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-3 shadow-sm mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Chat</h4>
                <button onClick={createChat} className="text-xs text-indigo-600">New</button>
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {chats.map(c => (
                    <div key={c.id} onClick={() => { setSelectedChat(c.id); fetchChatMessages(c.id) }} className={`p-2 rounded-md cursor-pointer ${selectedChat===c.id ? 'bg-indigo-50 dark:bg-indigo-900/20':'bg-white/10'}`}>
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-gray-500">{new Date(c.updated_at*1000).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="max-h-40 overflow-y-auto p-1 space-y-2">
                  {chatMessages.map(m => (
                    <div key={m.id} className={`p-2 rounded ${m.role==='user' ? 'bg-indigo-50 text-gray-900':'bg-gray-100 dark:bg-gray-800 text-gray-900'}`}>
                      <div className="text-xs whitespace-pre-wrap">{m.content}</div>
                      {m.role === 'user' && <div className="text-xs text-gray-400 mt-1"><button onClick={() => editChatMessage(m)} className="underline">Edit</button></div>}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 rounded border border-gray-200 dark:border-gray-700 p-1 bg-white/90 dark:bg-gray-800 text-sm" />
                  <button onClick={sendChatMessage} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Send</button>
                </div>
              </div>
            </div>

            {/* Doc text editor for quick edits and autosave */}
            {docxUrl && (
              <div className="mt-3 bg-white/70 dark:bg-gray-900/50 border border-white/10 dark:border-black/20 rounded-lg p-3 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Text (editable)</label>
                <textarea rows={8} value={docText} onChange={(e) => handleDocTextChange(e.target.value)} className="w-full mt-2 rounded border p-3 bg-white/20 dark:bg-black/20 text-sm" />
                <p className="text-xs text-gray-500 mt-2">Edits are autosaved to your history.</p>
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
