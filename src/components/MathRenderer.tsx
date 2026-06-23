"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";

interface MathRendererProps {
  text: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  // Regex to find $$...$$ or $...$
  // Using parenthesis so split() keeps the matched delimiters in the array
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = text.split(regex);

  return (
    <span className="inline-block max-w-full overflow-x-auto vertical-middle">
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          if (!formula) return null;
          return (
            <span key={index} className="block my-2 overflow-x-auto">
              <BlockMath math={formula} />
            </span>
          );
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1).trim();
          if (!formula) return null;
          return (
            <span key={index} className="inline-block mx-0.5">
              <InlineMath math={formula} />
            </span>
          );
        } else {
          // Render plain text, replace newlines with line breaks
          return part.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ));
        }
      })}
    </span>
  );
};

export default MathRenderer;
