import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    // Call Ollama API
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "vivi:latest",
        prompt: `Convert this instruction into JSON only. Return a valid JSON object with these possible actions:
        
        For adding nodes: {"action": "addNode", "id": "unique_id", "text": "Node Label", "connectFrom": "source_node_id", "connectTo": "target_node_id"}
        For removing nodes: {"action": "removeNode", "id": "node_id"}
        For adding connections: {"action": "addConnection", "sourceId": "source_id", "targetId": "target_id"}
        For removing connections: {"action": "removeConnection", "sourceId": "source_id", "targetId": "target_id"}
        
        Instruction: ${command}
        
        Return only valid JSON:`,
        stream: false,
      }),
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`)
    }

    const data = await ollamaResponse.json()

    // Try to parse the JSON response
    let parsedCommand
    try {
      // First try to parse the response directly
      parsedCommand = JSON.parse(data.response)
    } catch {
      // If that fails, try to extract JSON from the response
      const jsonMatch = data.response.match(/\{[^}]*\}/s)
      if (jsonMatch) {
        parsedCommand = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No valid JSON found in Ollama response")
      }
    }

    // Validate the parsed command
    if (!parsedCommand.action) {
      throw new Error("Invalid command format: missing action")
    }

    return NextResponse.json({
      success: true,
      command: parsedCommand,
      rawResponse: data.response,
    })
  } catch (error) {
    console.error("Ollama API error:", error)

    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Failed to connect to Ollama. Make sure Ollama is running on localhost:11434",
          details: error.message,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process command",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
