import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { command, content, contentType = "general" } = await request.json()

    if (!command && !content) {
      return NextResponse.json({ error: "Command or content is required" }, { status: 400 })
    }

    // For now, we'll use a local processing approach
    // In production, you would integrate with the MermaidStable3B model here
    const processedCommand = await processWithMermaidAI(command || content, contentType)

    return NextResponse.json({
      success: true,
      command: processedCommand,
      mermaidDiagram: processedCommand.mermaidSyntax,
    })
  } catch (error) {
    console.error("MermaidAI API error:", error)

    return NextResponse.json(
      {
        error: "Failed to process command",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function processWithMermaidAI(input: string, contentType: string) {
  // This is where you would integrate with MermaidStable3B
  // For now, we'll use a simplified command parser

  const lowerInput = input.toLowerCase()

  // Parse common commands
  if (lowerInput.includes("add") && lowerInput.includes("node")) {
    const nodeText = extractNodeText(input)
    const nodeId = generateNodeId(nodeText)

    return {
      action: "addNode",
      id: nodeId,
      text: nodeText,
      type: determineNodeType(input),
      mermaidSyntax: generateMermaidForNode(nodeId, nodeText, determineNodeType(input)),
    }
  }

  if (lowerInput.includes("remove") && lowerInput.includes("node")) {
    const nodeId = extractNodeId(input)
    return {
      action: "removeNode",
      id: nodeId,
      mermaidSyntax: "",
    }
  }

  if (lowerInput.includes("connect") || lowerInput.includes("link")) {
    const { sourceId, targetId } = extractConnectionIds(input)
    return {
      action: "addConnection",
      sourceId,
      targetId,
      mermaidSyntax: `${sourceId} --> ${targetId}`,
    }
  }

  // Generate mermaid diagram from description
  if (contentType === "code" || contentType === "story") {
    return {
      action: "generateDiagram",
      mermaidSyntax: await generateMermaidFromContent(input, contentType),
    }
  }

  // Default fallback
  return {
    action: "addNode",
    id: "new_node",
    text: input.slice(0, 50),
    type: "process",
    mermaidSyntax: `new_node[${input.slice(0, 50)}]`,
  }
}

function extractNodeText(input: string): string {
  const match =
    input.match(/add.*node.*["']([^"']+)["']/) ||
    input.match(/add.*["']([^"']+)["'].*node/) ||
    input.match(/node.*["']([^"']+)["']/)

  return match ? match[1] : input.replace(/add|node|create/gi, "").trim()
}

function generateNodeId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 20) +
    "_" +
    Date.now().toString(36)
  )
}

function determineNodeType(input: string): string {
  const lowerInput = input.toLowerCase()
  if (lowerInput.includes("start") || lowerInput.includes("begin")) return "start"
  if (lowerInput.includes("end") || lowerInput.includes("finish")) return "end"
  if (lowerInput.includes("decision") || lowerInput.includes("choice") || lowerInput.includes("if")) return "decision"
  return "process"
}

function extractNodeId(input: string): string {
  const match = input.match(/["']([^"']+)["']/)
  return match ? generateNodeId(match[1]) : "unknown_node"
}

function extractConnectionIds(input: string): { sourceId: string; targetId: string } {
  const matches = input.match(/["']([^"']+)["'].*["']([^"']+)["']/)
  if (matches) {
    return {
      sourceId: generateNodeId(matches[1]),
      targetId: generateNodeId(matches[2]),
    }
  }
  return { sourceId: "node1", targetId: "node2" }
}

function generateMermaidForNode(id: string, text: string, type: string): string {
  switch (type) {
    case "start":
    case "end":
      return `${id}([${text}])`
    case "decision":
      return `${id}{${text}}`
    default:
      return `${id}[${text}]`
  }
}

async function generateMermaidFromContent(content: string, contentType: string): Promise<string> {
  // This is where you would call MermaidStable3B
  // For now, we'll generate a simple flowchart based on content analysis

  const lines = content.split("\n").filter((line) => line.trim())
  let mermaidSyntax = "flowchart TD\n"

  if (contentType === "code") {
    // Analyze code structure
    const functions = lines.filter((line) => line.includes("def ") || line.includes("function"))
    const conditions = lines.filter((line) => line.includes("if ") || line.includes("else"))

    let nodeCounter = 1

    if (functions.length > 0) {
      functions.forEach((func) => {
        const funcName = func.match(/(?:def|function)\s+(\w+)/)?.[1] || `func${nodeCounter}`
        mermaidSyntax += `    node${nodeCounter}[${funcName}]\n`
        nodeCounter++
      })
    }

    if (conditions.length > 0) {
      conditions.forEach((condition) => {
        const condText = condition.trim().slice(0, 30) + "..."
        mermaidSyntax += `    decision${nodeCounter}{${condText}}\n`
        nodeCounter++
      })
    }
  } else {
    // Generate from story/description
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim())
    sentences.slice(0, 5).forEach((sentence, index) => {
      const nodeText = sentence.trim().slice(0, 30)
      if (nodeText) {
        mermaidSyntax += `    node${index + 1}[${nodeText}]\n`
        if (index > 0) {
          mermaidSyntax += `    node${index} --> node${index + 1}\n`
        }
      }
    })
  }

  return mermaidSyntax
}
