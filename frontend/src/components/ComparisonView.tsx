// In frontend/src/components/ComparisonView.tsx
'use client';

import ReactMarkdown from 'react-markdown';

interface ComparisonViewProps {
  comparisonText: string;
}

export default function ComparisonView({ comparisonText }: ComparisonViewProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-lg text-white mb-8">
      <ReactMarkdown
        components={{
          // This part tells the component how to style different markdown elements
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-green-400 mb-4" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-sky-400 mt-6 mb-2" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-slate-300" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 pl-4" {...props} />,
          li: ({node, ...props}) => <li className="text-slate-400" {...props} />,
          p: ({node, ...props}) => <p className="text-slate-300 mb-4" {...props} />,
        }}
      >
        {comparisonText}
      </ReactMarkdown>
    </div>
  );
}