"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface MermaidDisplayProps {
  chart: string
}

export const MermaidDisplay: React.FC<MermaidDisplayProps> = ({ chart }) => {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mermaidRef.current) {
      mermaid.initialize({ startOnLoad: true, theme: "default" })
      try {
        mermaid.render("mermaid-chart", chart).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
          }
        })
      } catch (error) {
        console.error("Error rendering mermaid chart:", error)
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<p class="text-red-500">Error rendering flowchart. Please check the input.</p>`
        }
      }
    }
  }, [chart])

  return (
    <div ref={mermaidRef} className="w-full h-full flex items-center justify-center overflow-auto">
      {/* Mermaid chart will be rendered here */}
    </div>
  )
}
