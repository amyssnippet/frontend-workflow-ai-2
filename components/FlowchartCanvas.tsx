"use client"

import React, { useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"

interface FlowchartCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
}

export default function FlowchartCanvas({ nodes, edges, onNodesChange, onEdgesChange }: FlowchartCanvasProps) {
  const [flowNodes, setFlowNodes, onNodesChangeInternal] = useNodesState(nodes)
  const [flowEdges, setFlowEdges, onEdgesChangeInternal] = useEdgesState(edges)

  React.useEffect(() => {
    setFlowNodes(nodes)
  }, [nodes, setFlowNodes])

  React.useEffect(() => {
    setFlowEdges(edges)
  }, [edges, setFlowEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, flowEdges)
      setFlowEdges(newEdge)
      onEdgesChange(newEdge)
    },
    [flowEdges, setFlowEdges, onEdgesChange],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes)
      requestAnimationFrame(() => {
        setFlowNodes((current) => {
          onNodesChange(current)
          return current
        })
      })
    },
    [onNodesChangeInternal, onNodesChange, setFlowNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes)
      requestAnimationFrame(() => {
        setFlowEdges((current) => {
          onEdgesChange(current)
          return current
        })
      })
    },
    [onEdgesChangeInternal, onEdgesChange, setFlowEdges],
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} size={1} variant="dots" />
        <Controls position="top-left" className="bg-white shadow-lg border rounded-lg" />
        <MiniMap
          position="bottom-right"
          className="bg-white shadow-lg border rounded-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
