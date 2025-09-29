"use client";

import MermaidChart from "@/components/FlowchartCanvas";
import { NavigationMenuDemo } from "@/components/navbar";
const Home: React.FC = () => {
  const mermaidCode = `
    graph TD\nA[Enter Username/Email] --> B[Enter Password]\nB --> C{Verify Credentials}\nC -- No --> D[Access Denied]\nC -- Yes --> E[Access Granted]
  `;

  return (
    <NavigationMenuDemo />
  );
};

export default Home;