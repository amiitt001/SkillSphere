/**
 * This file contains the ComparisonTable component, a reusable UI element
 * for displaying a structured, side-by-side comparison of two career paths.
 */
'use client';

// --- TYPE DEFINITIONS ---

/**
 * Defines the structure for a single row of data in the comparison table.
 */
interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

/**
 * Defines the props required by the ComparisonTable component.
 */
interface ComparisonTableProps {
  data: TableRow[]; // The array of comparison data from the AI.
  career1Title: string; // The title of the first career for the table header.
  career2Title: string; // The title of the second career for the table header.
}

/**
 * A reusable UI component that renders a styled table to compare two careers.
 * It takes structured data and career titles as props to dynamically build the table.
 * @param {ComparisonTableProps} props The props for the component.
 * @returns A styled HTML table or null if no data is provided.
 */
export default function ComparisonTable({ data, career1Title, career2Title }: ComparisonTableProps) {
  // Do not render the component if there is no data to display.
  if (!data || data.length === 0) return null;

  // --- RENDER ---
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50 shadow-lg shadow-slate-900/50">
      <table className="min-w-full divide-y divide-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-800/30 text-sm">
        {/* Table Header */}
        <thead className="text-left bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur">
          <tr>
            <th className="whitespace-nowrap px-6 py-4 font-bold text-slate-200 w-1/4 border-r border-slate-700/50">
              🎯 Feature
            </th>
            <th className="whitespace-nowrap px-6 py-4 font-bold text-sky-300 border-r border-slate-700/50">
              {career1Title}
            </th>
            <th className="whitespace-nowrap px-6 py-4 font-bold text-blue-300">
              {career2Title}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-700/30">
          {/* Map over the data array to create a new row for each feature comparison. */}
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-slate-700/20 transition-colors duration-200">
              <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-300 bg-gradient-to-r from-slate-800/50 to-transparent border-r border-slate-700/50">
                {row.feature}
              </td>
              <td className="px-6 py-4 text-slate-300 border-r border-slate-700/50">
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">✓</span>
                  <span>{row.career1_details}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>{row.career2_details}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
