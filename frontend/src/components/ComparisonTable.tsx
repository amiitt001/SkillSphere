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
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="min-w-full divide-y-2 divide-slate-700 bg-slate-800 text-sm">
        {/* Table Header */}
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

        {/* Table Body */}
        <tbody className="divide-y divide-slate-700">
          {/* Map over the data array to create a new row for each feature comparison. */}
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
