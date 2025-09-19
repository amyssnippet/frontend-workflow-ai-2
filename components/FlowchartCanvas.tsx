// components/MermaidChart.tsx
import React, { useEffect } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string; // The Mermaid code passed in as a string
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  useEffect(() => {
    // Initialize Mermaid when the component is mounted
    mermaid.initialize({ startOnLoad: true });

    // Render the Mermaid code
    if (chart) {
      try {
        mermaid.contentLoaded();
      } catch (error) {
        console.error('Error rendering Mermaid chart:', error);
      }
    }
  }, [chart]);

  return (
    <div className="mermaid">
      {chart}
    </div>
  );
};

export default MermaidChart;
