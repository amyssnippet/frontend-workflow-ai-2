"use client"

import React, { useState, useEffect, createContext, useContext } from "react"

// Context for sharing Mermaid code across the app
interface AppContextType {
  mermaidCode: string | null
  setMermaidCode: (code: string | null) => void
  onCodeChange: (code: string) => void
}

// Create and expose the app context for child components
const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppLayout')
  }
  return context
}

// Main App Layout Component
interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)

  const handleCodeChange = (code: string) => {
    setMermaidCode(code)
  }

  const contextValue: AppContextType = {
    mermaidCode,
    setMermaidCode,
    onCodeChange: handleCodeChange,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-screen bg-white dark:bg-gray-900 flex overflow-hidden">
  {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}
