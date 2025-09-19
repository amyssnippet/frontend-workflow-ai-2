"use client";

import MermaidChart from "@/components/FlowchartCanvas";

const Home: React.FC = () => {
  const mermaidCode = `
    graph TD;
      A[Start] --> B{Check Document Format}
      B -- Yes --> C[PDF Processing]
      B -- No --> D{Identify Source}
      D -- PDF --> C
      D -- DOC --> C
      D -- PPTX --> E[PPTX Processing]
      D -- HTML --> F[HTML Processing]
      C & E & F --> G[Document Chunking]
      G --> H[Embed into RAG Vector Database]
  `;

  return (
    <div>
      <h1>Mermaid Flowchart in Next.js with TypeScript</h1>
      <MermaidChart chart={mermaidCode} />
    </div>
  );
};

export default Home;