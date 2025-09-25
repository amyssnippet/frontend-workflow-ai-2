"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import mermaid from "mermaid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, RefreshCw } from "lucide-react"

interface EnhancedMermaidChartProps {
  chart: string
  realTimeData?: any[]
  updateInterval?: number
  onDataUpdate?: (data: any[]) => string
  className?: string
}

const MermaidChart: React.FC<EnhancedMermaidChartProps> = ({
  chart,
  realTimeData = [],
  updateInterval = 1000,
  onDataUpdate,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isRealTimeActive, setIsRealTimeActive] = useState(false)
  const [currentChart, setCurrentChart] = useState(chart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
      },
    })
  }, [])

  const renderChart = useCallback(async (chartCode: string) => {
    if (!chartRef.current) return

    try {
      // Clear previous content
      chartRef.current.innerHTML = ""

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
      }
    } catch (error) {
      console.error("Error rendering Mermaid chart:", error)
      chartRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering chart: ${error}</div>`
    }
  }, [])

  useEffect(() => {
    renderChart(currentChart)
  }, [currentChart, renderChart])

  useEffect(() => {
    if (isRealTimeActive && onDataUpdate && realTimeData.length > 0) {
      intervalRef.current = setInterval(() => {
        const updatedChart = onDataUpdate(realTimeData)
        setCurrentChart(updatedChart)
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      if (chartRef.current) {
        chartRef.current.style.cursor = "grabbing"
      }
    },
    [position],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }
      setPosition(newPosition)
    },
    [isDragging, dragStart],
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
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    },
    [handleZoom],
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

  return (
    <Card className={`relative overflow-hidden h-500 ${className}`}>
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
        <Button variant="outline" size="sm" onClick={() => handleZoom(0.2)} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleZoom(-0.2)} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={resetView} title="Reset View">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={refreshChart} title="Refresh Chart">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {onDataUpdate && (
          <Button
            variant={isRealTimeActive ? "default" : "outline"}
            size="sm"
            onClick={toggleRealTime}
            title={isRealTimeActive ? "Pause Real-time" : "Start Real-time"}
          >
            {isRealTimeActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {isRealTimeActive && (
        <div className="absolute top-4 left-4 z-10 bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-350 overflow-hidden cursor-grab select-none"
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

      <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-sm border">
        {Math.round(scale * 100)}%
      </div>
    </Card>
  )
}

export default MermaidChart
