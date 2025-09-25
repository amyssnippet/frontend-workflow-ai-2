"use client";

import MermaidChart from "@/components/FlowchartCanvas";

const Home: React.FC = () => {
  const mermaidCode = `
    graph TD\nA[Enter Username/Email] --> B[Enter Password]\nB --> C{Verify Credentials}\nC -- No --> D[Access Denied]\nC -- Yes --> E[Access Granted]
  `;

  return (
    <div>
      <h1>Mermaid Flowchart in Next.js with TypeScript</h1>
      <MermaidChart chart={mermaidCode} />
    </div>
  );
};

export default Home;