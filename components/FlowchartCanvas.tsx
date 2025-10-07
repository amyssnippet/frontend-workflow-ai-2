"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import mermaid from "mermaid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  RefreshCw, 
  Edit3, 
  Eye,
  Code,
  Download,
  Copy,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

interface EnhancedMermaidChartProps {
  chart: string
  onChartChange?: (newChart: string) => void
  realTimeData?: any[]
  updateInterval?: number
  onDataUpdate?: (data: any[]) => string
  className?: string
  editable?: boolean
}

const MermaidChart: React.FC<EnhancedMermaidChartProps> = ({
  chart,
  onChartChange,
  realTimeData = [],
  updateInterval = 1000,
  onDataUpdate,
  className = "",
  editable = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { theme, resolvedTheme } = useTheme()
  
  // Chart display states
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isRealTimeActive, setIsRealTimeActive] = useState(false)
  const [currentChart, setCurrentChart] = useState(chart)
  
  // Editor states
  const [isEditorVisible, setIsEditorVisible] = useState(false)
  const [editorCode, setEditorCode] = useState(chart)
  const [isValidCode, setIsValidCode] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Refs for intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle mounting for theme detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Mermaid with theme-aware configuration
  useEffect(() => {
    if (!mounted) return
    
    const isDark = resolvedTheme === 'dark'
    
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: "loose",
      fontFamily: "inherit",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
      },
      themeVariables: {
        primaryColor: isDark ? '#3b82f6' : '#2563eb',
        primaryTextColor: isDark ? '#f1f5f9' : '#1e293b',
        primaryBorderColor: isDark ? '#475569' : '#cbd5e1',
        lineColor: isDark ? '#64748b' : '#374151',
        secondaryColor: isDark ? '#1e293b' : '#f8fafc',
        tertiaryColor: isDark ? '#0f172a' : '#ffffff',
        background: isDark ? '#0f172a' : '#ffffff',
        mainBkg: isDark ? '#1e293b' : '#f8fafc',
        secondBkg: isDark ? '#334155' : '#e2e8f0',
        tertiaryBkg: isDark ? '#475569' : '#cbd5e1',
      }
    })
  }, [mounted, resolvedTheme])

  // Validate Mermaid code
  const validateMermaidCode = useCallback(async (code: string) => {
    try {
      await mermaid.parse(code)
      setIsValidCode(true)
      setErrorMessage("")
      return true
    } catch (error: any) {
      // Remove any global Mermaid error nodes injected into the document
      try {
        if (typeof document !== 'undefined') {
          const nodes = Array.from(document.body.querySelectorAll('*')) as Element[]
          nodes.forEach((el) => {
            const txt = (el.textContent || '').toLowerCase()
            if (txt.includes('syntax error in text') || txt.includes('mermaid version')) {
              el.remove()
            }
          })
        }
      } catch (e) {
        // ignore
      }

      setIsValidCode(false)
      setErrorMessage(error.message || "Invalid Mermaid syntax")
      return false
    }
  }, [])

  const renderChart = useCallback(async (chartCode: string) => {
    if (!chartRef.current || !mounted) return

    try {
      // Clear previous content and remove data-processed attribute
      chartRef.current.innerHTML = ""
      chartRef.current.removeAttribute("data-processed")

      // Generate unique ID for this chart instance
      const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Render the chart
      const { svg } = await mermaid.render(chartId, chartCode)
      chartRef.current.innerHTML = svg

      // Make SVG responsive and interactive
      const svgElement = chartRef.current.querySelector("svg")
      if (svgElement) {
        svgElement.style.maxWidth = "none"
        svgElement.style.height = "auto"
        svgElement.style.cursor = "grab"
        
        // Apply theme-aware styling to SVG
        const isDark = resolvedTheme === 'dark'
        if (isDark) {
          svgElement.style.filter = 'brightness(1.1) contrast(1.1)'
        }
      }
    } catch (error) {
      console.error("Error rendering Mermaid chart:", error)

      // Remove any global Mermaid error nodes that may have been injected
      try {
        if (typeof document !== 'undefined') {
          const nodes = Array.from(document.body.querySelectorAll('*')) as Element[]
          nodes.forEach((el) => {
            const txt = (el.textContent || '').toLowerCase()
            if (txt.includes('syntax error in text') || txt.includes('mermaid version')) {
              el.remove()
            }
          })
        }
      } catch (e) {
        // ignore
      }

      chartRef.current.innerHTML = `<div class="text-red-500 p-4 text-center">
        <p class="font-semibold">Error rendering chart</p>
        <p class="text-sm mt-2">${error}</p>
      </div>`
    }
  }, [mounted, resolvedTheme])

  // Re-render chart when theme changes
  useEffect(() => {
    if (mounted && currentChart) {
      renderChart(currentChart)
    }
  }, [currentChart, renderChart, mounted, resolvedTheme])

  useEffect(() => {
    setCurrentChart(chart)
    setEditorCode(chart)
  }, [chart])

  // Handle editor code changes with debounced validation
  const handleEditorChange = useCallback((value: string) => {
    setEditorCode(value)
    
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    validationTimeoutRef.current = setTimeout(async () => {
      const isValid = await validateMermaidCode(value)
      if (isValid) {
        setCurrentChart(value)
        onChartChange?.(value)
        // attempt autosave (best-effort)
        try {
          const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
          if (access) {
            fetch('/autosave', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access}` },
              body: JSON.stringify({ type: 'mermaid', title: 'Autosave', content: value })
            }).catch(() => {})
          }
        } catch (e) {
          // ignore autosave failures
        }
      }
    }, 500)
  }, [validateMermaidCode, onChartChange])

  // Apply changes immediately
  const applyChanges = useCallback(async () => {
    const isValid = await validateMermaidCode(editorCode)
    if (isValid) {
      setCurrentChart(editorCode)
      onChartChange?.(editorCode)
      toast({
        title: "Chart Updated",
        description: "Your changes have been applied successfully.",
      })
      // Save to server if authenticated
      try {
        const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (access) {
          fetch('/autosave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access}` },
            body: JSON.stringify({ type: 'mermaid', title: 'Manual save', content: editorCode })
          }).catch(() => {})
        }
      } catch (e) {
        // ignore
      }
    } else {
      toast({
        title: "Invalid Code",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [editorCode, validateMermaidCode, onChartChange, errorMessage, toast])

  // Real-time data handling
  useEffect(() => {
    if (isRealTimeActive && onDataUpdate && realTimeData.length > 0) {
      intervalRef.current = setInterval(() => {
        const updatedChart = onDataUpdate(realTimeData)
        setCurrentChart(updatedChart)
        setEditorCode(updatedChart)
      }, updateInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRealTimeActive, onDataUpdate, realTimeData, updateInterval])

  // Chart interaction handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditorVisible) return
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      if (chartRef.current) {
        chartRef.current.style.cursor = "grabbing"
      }
    },
    [position, isEditorVisible],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || isEditorVisible) return

      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }
      setPosition(newPosition)
    },
    [isDragging, dragStart, isEditorVisible],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (chartRef.current) {
      chartRef.current.style.cursor = "grab"
    }
  }, [])

  const handleZoom = useCallback((delta: number) => {
    setScale((prevScale) => {
      const newScale = Math.max(0.1, Math.min(5, prevScale + delta))
      return newScale
    })
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isEditorVisible) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    },
    [handleZoom, isEditorVisible],
  )

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const toggleRealTime = useCallback(() => {
    setIsRealTimeActive((prev) => !prev)
  }, [])

  const refreshChart = useCallback(() => {
    renderChart(currentChart)
  }, [currentChart, renderChart])

  const toggleEditor = useCallback(() => {
    setIsEditorVisible(prev => !prev)
  }, [])

  // Copy chart code to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentChart)
      setIsCopied(true)
      toast({
        title: "Copied!",
        description: "Chart code copied to clipboard.",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy chart code to clipboard.",
        variant: "destructive",
      })
    }
  }, [currentChart, toast])

  // Download chart as SVG
  const downloadSVG = useCallback(() => {
    const svgElement = chartRef.current?.querySelector("svg")
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)
      const downloadLink = document.createElement("a")
      downloadLink.href = svgUrl
      downloadLink.download = "mermaid-chart.svg"
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(svgUrl)
    }
  }, [])

  if (!mounted) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg h-96" />
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Dotted Background - Lower z-index */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#374151_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Chart Container - Middle z-index */}
      <div
        ref={containerRef}
        className={`relative z-10 h-full w-full overflow-hidden select-none ${
          !isEditorVisible ? 'cursor-grab' : ''
        } ${isEditorVisible ? 'opacity-20' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          ref={chartRef}
          className="mermaid transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            width: "fit-content",
            height: "fit-content",
            minWidth: "100%",
            minHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </div>

      {/* Top toolbar - Highest z-index */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border shadow-lg">
        {editable && (
          <Button 
            variant={isEditorVisible ? "default" : "outline"} 
            size="sm" 
            onClick={toggleEditor} 
            title={isEditorVisible ? "Hide Editor" : "Show Editor"}
            className="relative z-50"
          >
            {isEditorVisible ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleZoom(0.2)} 
          title="Zoom In"
          className="relative z-50"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleZoom(-0.2)} 
          title="Zoom Out"
          className="relative z-50"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetView} 
          title="Reset View"
          className="relative z-50"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshChart} 
          title="Refresh Chart"
          className="relative z-50"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard} 
          title="Copy Code"
          className="relative z-50"
        >
          {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadSVG} 
          title="Download SVG"
          className="relative z-50"
        >
          <Download className="h-4 w-4" />
        </Button>
        {onDataUpdate && (
          <Button
            variant={isRealTimeActive ? "default" : "outline"}
            size="sm"
            onClick={toggleRealTime}
            title={isRealTimeActive ? "Pause Real-time" : "Start Real-time"}
            className="relative z-50"
          >
            {isRealTimeActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Real-time indicator - High z-index */}
      {isRealTimeActive && (
        <div className="absolute top-4 left-4 z-40 bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      )}

      {/* Editor Panel - Highest z-index */}
      {isEditorVisible && editable && (
        <div className="absolute inset-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <h3 className="font-semibold">Mermaid Editor</h3>
              {!isValidCode && (
                <div className="text-red-500 text-sm">
                  ⚠️ Syntax Error
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyChanges} disabled={!isValidCode}>
                Apply Changes
              </Button>
              <Button size="sm" variant="outline" onClick={toggleEditor}>
                Close
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <Textarea
              ref={editorRef}
              value={editorCode}
              onChange={(e) => handleEditorChange(e.target.value)}
              className={`flex-1 font-mono text-sm resize-none ${
                !isValidCode ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="Enter your Mermaid diagram code here..."
            />
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom indicator - High z-index */}
      <div className="absolute bottom-4 right-4 z-40 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-sm border shadow-lg">
        {Math.round(scale * 100)}%
      </div>
    </Card>
  )
}

export default MermaidChart
