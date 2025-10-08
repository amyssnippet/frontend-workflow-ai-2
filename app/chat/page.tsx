"use client"

import React, { useEffect, useState } from 'react'

export default function ChatPage(){
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  useEffect(()=>{
    fetchChats()
  },[])

  async function fetchChats(){
    if(!access) return
    const res = await fetch(`${API}/chat/list`, { headers: { Authorization: `Bearer ${access}` } })
    if(!res.ok) return
    const data = await res.json()
    setChats(data.items || [])
    if(data.items && data.items.length>0){
      setSelectedChat(data.items[0].id)
      fetchMessages(data.items[0].id)
    }
  }

  async function fetchMessages(cid:number){
    if(!access) return
    const res = await fetch(`${API}/chat/${cid}/messages`, { headers: { Authorization: `Bearer ${access}` } })
    if(!res.ok) return
    const data = await res.json()
    setMessages(data.items || [])
  }

  async function createChat(){
    if(!access) return
    const res = await fetch(`${API}/chat/create`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify({ title: 'New Chat' }) })
    if(!res.ok) return
    const d = await res.json()
    await fetchChats()
    setSelectedChat(d.id)
    setMessages([])
  }

  async function sendMessage(){
    if(!access || !selectedChat || !input.trim()) return
    setLoading(true)
    const res = await fetch(`${API}/chat/${selectedChat}/message`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify({ role: 'user', content: input }) })
    setLoading(false)
    if(!res.ok) return
    const d = await res.json()
    // append user message and assistant reply (if any)
    await fetchMessages(selectedChat)
    setInput('')
  }

  async function startEdit(msg:any){
    const newContent = prompt('Edit message', msg.content)
    if(newContent === null) return
    if(!access) return
    const res = await fetch(`${API}/chat/${msg.chat_id}/message/${msg.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${access}` }, body: JSON.stringify({ content: newContent, regenerate: true }) })
    if(!res.ok) return
    await fetchMessages(msg.chat_id)
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          <div className="w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chats</h3>
              <button onClick={createChat} className="text-sm text-indigo-600">New</button>
            </div>
            <div className="space-y-2">
              {chats.map(c=> (
                <div key={c.id} onClick={()=>{ setSelectedChat(c.id); fetchMessages(c.id) }} className={`p-3 rounded-lg cursor-pointer ${selectedChat===c.id? 'bg-indigo-50 dark:bg-indigo-900/20':'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-gray-500">{new Date(c.updated_at*1000).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-[60vh] overflow-y-auto p-2 space-y-4">
              {messages.map(m=> (
                <div key={m.id} className={`p-3 rounded ${m.role==='user' ? 'bg-indigo-50 text-gray-900 self-end' : 'bg-gray-100 dark:bg-gray-800 text-gray-900'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  {m.role === 'user' && <div className="text-xs text-gray-400 mt-2"><button onClick={()=>startEdit(m)} className="underline">Edit</button></div>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input value={input} onChange={(e)=>setInput(e.target.value)} className="flex-1 rounded border border-gray-200 dark:border-gray-700 p-2 bg-white/90 dark:bg-gray-800" />
              <button onClick={sendMessage} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
