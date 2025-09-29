"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  History,
  LayoutTemplateIcon,
  HomeIcon,
  Code,
  Share,
  HelpCircle,
  User,
  Copy,
  CheckCircle,
  RefreshCw,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Context for sharing Mermaid code across the app
interface AppContextType {
  mermaidCode: string | null
  setMermaidCode: (code: string | null) => void
  onCodeChange: (code: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppLayout')
  }
  return context
}

// Theme Toggle Button Component
const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

// Sidebar Component
const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { mermaidCode, onCodeChange } = useAppContext()
  const [editorCode, setEditorCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, href: '/' },
    { id: 'new-flowchart', label: 'New Flowchart', icon: FileText, href: '/new' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon, href: '/templates' },
    { id: 'history', label: 'Recent', icon: History, href: '/history' },
    { id: 'code', label: 'Code Editor', icon: Code, href: '/code-editor' },
    { id: 'share', label: 'Share', icon: Share, href: '/share' },
    { id: 'export', label: 'Export', icon: Download, href: '/export' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
  ]

  // Get current active item based on pathname
  const getActiveItem = () => {
    if (pathname === '/') return 'dashboard'
    const item = sidebarItems.find(item => pathname.startsWith(item.href) && item.href !== '/')
    return item?.id || 'dashboard'
  }

  const activeItem = getActiveItem()

  // Update editor code when mermaidCode changes
  useEffect(() => {
    if (mermaidCode && mermaidCode !== editorCode) {
      setEditorCode(mermaidCode)
    }
  }, [mermaidCode])

  const handleCodeChange = (newCode: string) => {
    setEditorCode(newCode)
  }

  const applyChanges = () => {
    onCodeChange(editorCode)
    toast({
      title: "Code Applied",
      description: "Mermaid chart updated successfully.",
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorCode)
      setIsCopied(true)
      toast({
        title: "Copied!",
        description: "Code copied to clipboard.",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const downloadCode = () => {
    const blob = new Blob([editorCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = 'flowchart.mmd'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Mermaid file downloaded successfully.",
    })
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              FlowChartAI
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeItem === item.id
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
            >
              <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Code Editor Section - Show when there's mermaid code */}
      {mermaidCode && (
        <div className="flex-1 flex flex-col p-4 border-t border-gray-200 dark:border-gray-700 max-h-96">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Mermaid Editor
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="p-1.5"
                title="Copy Code"
              >
                {isCopied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadCode}
                className="p-1.5"
                title="Download Code"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Textarea
            value={editorCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 font-mono text-xs resize-none min-h-[200px] max-h-[250px]"
            placeholder="Mermaid code will appear here..."
          />
          <Button
            onClick={applyChanges}
            className="mt-3 w-full"
            size="sm"
            disabled={!editorCode.trim()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      )}

      {/* Sidebar Footer with Profile and Theme Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                John Doe
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                john@example.com
              </p>
            </div>
          </div>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
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
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}
