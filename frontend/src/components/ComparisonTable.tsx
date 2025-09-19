// In frontend/src/components/ComparisonTable.tsx
'use client';

interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

interface ComparisonTableProps {
  data: TableRow[];
  career1Title: string;
  career2Title: string;
}

export default function ComparisonTable({ data, career1Title, career2Title }: ComparisonTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="min-w-full divide-y-2 divide-slate-700 bg-slate-800 text-sm">
        <thead className="text-left">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-white bg-slate-900 w-1/4">
              Feature
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-white bg-slate-900">
              {career1Title}
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-white bg-slate-900">
              {career2Title}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                {row.feature}
              </td>
              <td className="px-4 py-3 text-slate-400">{row.career1_details}</td>
              <td className="px-4 py-3 text-slate-400">{row.career2_details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}