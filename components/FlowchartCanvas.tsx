"use client"

import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface MermaidNode {
  id: string
  label: string
  type?: "start" | "end" | "process" | "decision"
}

interface MermaidEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface FlowchartCanvasProps {
  nodes: MermaidNode[]
  edges: MermaidEdge[]
  onNodesChange?: (nodes: MermaidNode[]) => void
  onEdgesChange?: (edges: MermaidEdge[]) => void
}

export default function FlowchartCanvas({ nodes, edges }: FlowchartCanvasProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, system-ui, sans-serif",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        padding: 20,
      },
    })
  }, [])

  useEffect(() => {
    if (mermaidRef.current && nodes.length > 0) {
      const mermaidSyntax = generateMermaidSyntax(nodes, edges)

      // Clear previous content
      mermaidRef.current.innerHTML = ""

      // Create a unique ID for this diagram
      const diagramId = `mermaid-${Date.now()}`

      // Render the Mermaid diagram
      mermaid
        .render(diagramId, mermaidSyntax)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
          }
        })
        .catch((error) => {
          console.error("Mermaid rendering error:", error)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering flowchart: ${error.message}</div>`
          }
        })
    }
  }, [nodes, edges])

  const generateMermaidSyntax = (nodes: MermaidNode[], edges: MermaidEdge[]): string => {
    let syntax = "flowchart TD\n"

    nodes.forEach((node) => {
      let nodeShape = ""
      switch (node.type) {
        case "start":
          nodeShape = `${node.id}([${node.label}])`
          break
        case "end":
          nodeShape = `${node.id}([${node.label}])`
          break
        case "decision":
          nodeShape = `${node.id}{${node.label}}`
          break
        case "process":
        default:
          nodeShape = `${node.id}[${node.label}]`
          break
      }
      syntax += `    ${nodeShape}\n`
    })

    edges.forEach((edge) => {
      const label = edge.label ? `|${edge.label}|` : ""
      syntax += `    ${edge.source} -->${label} ${edge.target}\n`
    })

    syntax += `
    classDef startEnd fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#000
    classDef process fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:#000
    
    class ${nodes
      .filter((n) => n.type === "start" || n.type === "end")
      .map((n) => n.id)
      .join(",")} startEnd
    class ${nodes
      .filter((n) => n.type === "process" || !n.type)
      .map((n) => n.id)
      .join(",")} process
    class ${nodes
      .filter((n) => n.type === "decision")
      .map((n) => n.id)
      .join(",")} decision
    `

    return syntax
  }

  return (
    <div className="h-full w-full overflow-auto bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6">
        <div ref={mermaidRef} className="mermaid-container flex justify-center items-center min-h-[400px]" />
      </div>
    </div>
  )
}
