"use client"

import { useState, useCallback } from "react"
import FlowchartCanvas from "@/components/FlowchartCanvas"
import CommandInput from "@/components/CommandInput"
import { Workflow, Sparkles } from "lucide-react"

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

export default function Home() {
  const [nodes, setNodes] = useState<MermaidNode[]>([
    {
      id: "start",
      label: "Start",
      type: "start",
    },
    {
      id: "process1",
      label: "Process 1",
      type: "process",
    },
    {
      id: "end",
      label: "End",
      type: "end",
    },
  ])

  const [edges, setEdges] = useState<MermaidEdge[]>([
    {
      id: "start-process1",
      source: "start",
      target: "process1",
    },
    {
      id: "process1-end",
      source: "process1",
      target: "end",
    },
  ])

  const addNode = useCallback((id: string, options: { text: string; type?: string }) => {
    const newNode: MermaidNode = {
      id,
      label: options.text,
      type: (options.type as "start" | "end" | "process" | "decision") || "process",
    }
    setNodes((prev) => [...prev, newNode])
  }, [])

  const addConnection = useCallback((sourceId: string, targetId: string, label?: string) => {
    const newEdge: MermaidEdge = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      label,
    }
    setEdges((prev) => [...prev, newEdge])
  }, [])

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id))
    setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id))
  }, [])

  const removeConnection = useCallback((sourceId: string, targetId: string) => {
    setEdges((prev) => prev.filter((edge) => !(edge.source === sourceId && edge.target === targetId)))
  }, [])

  const handleCommand = async (command: string) => {
    try {
      const response = await fetch("/api/ollama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process command")
      }

      if (data.success && data.command) {
        applyCommand(data.command)
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error) {
      console.error("Error processing command:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const applyCommand = (command: any) => {
    console.log("Applying command:", command)

    switch (command.action) {
      case "addNode":
        addNode(command.id, { text: command.text, type: command.type })
        if (command.connectFrom) {
          addConnection(command.connectFrom, command.id, command.connectionLabel)
        }
        if (command.connectTo) {
          addConnection(command.id, command.connectTo, command.connectionLabel)
        }
        break
      case "removeNode":
        removeNode(command.id)
        break
      case "addConnection":
        addConnection(command.sourceId, command.targetId, command.label)
        break
      case "removeConnection":
        removeConnection(command.sourceId, command.targetId)
        break
      default:
        console.warn("Unknown command action:", command.action)
        alert(`Unknown command action: ${command.action}`)
    }
  }

  return (
    <div className="h-screen flex flex-col gradient-bg">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl shadow-lg">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Workflow AI
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Create and edit flowcharts with AI-powered natural language commands
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-white/50 backdrop-blur-sm">
          <FlowchartCanvas nodes={nodes} edges={edges} onNodesChange={setNodes} onEdgesChange={setEdges} />
        </div>

        <div className="w-96 bg-white/90 backdrop-blur-sm border-l border-slate-200/50 shadow-xl">
          <CommandInput onSubmit={handleCommand} />
        </div>
      </div>
    </div>
  )
}
