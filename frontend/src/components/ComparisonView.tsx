/**
 * This file contains the ComparisonView component, a reusable UI element
 * for rendering markdown text from the AI with custom styling.
 */
'use client';

import ReactMarkdown from 'react-markdown';

// --- TYPE DEFINITION ---

/**
 * Defines the props required by the ComparisonView component.
 */
interface ComparisonViewProps {
  comparisonText: string; // The raw markdown string from the AI.
}

/**
 * A reusable UI component that takes a markdown string and renders it
 * as styled HTML using Tailwind CSS classes.
 * @param {ComparisonViewProps} props The props for the component.
 * @returns A styled view of the markdown content.
 */
export default function ComparisonView({ comparisonText }: ComparisonViewProps) {
  // --- RENDER ---
  return (
    <div className="bg-slate-900 p-6 rounded-lg text-white mb-8">
      <ReactMarkdown
        // The 'components' prop allows us to override the default HTML elements
        // rendered by ReactMarkdown and apply our own custom styling.
        components={{
          h2: ({ ...props }) => <h2 className="text-2xl font-bold text-green-400 mb-4" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xl font-bold text-sky-400 mt-6 mb-2" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-slate-300" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc list-inside space-y-2 pl-4" {...props} />,
          li: ({ ...props }) => <li className="text-slate-400" {...props} />,
          p: ({ ...props }) => <p className="text-slate-300 mb-4" {...props} />,
        }}
      >
        {comparisonText}
      </ReactMarkdown>
    </div>
  );
}
