/**
 * This file contains the ComparisonTable component, a reusable UI element
 * for displaying a structured, side-by-side comparison of two career paths.
 */
'use client';

// --- TYPE DEFINITIONS ---
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

/**
 * A reusable UI component that renders a styled table to compare two careers.
 */
export default function ComparisonTable({ data, career1Title, career2Title }: ComparisonTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-radius" style={{ border: '1px solid var(--border-subtle)' }}>
      <table className="min-w-full text-sm font-body">
        {/* Table Header */}
        <thead>
          <tr style={{ background: 'rgba(0,229,195,0.06)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th className="px-6 py-5 text-left font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-subtle)', width: '25%' }}>
              Feature
            </th>
            <th className="px-6 py-5 text-center" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-subtle)' }}>
              {career1Title}
            </th>
            <th className="px-6 py-5 text-center" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {career2Title}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="group transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,195,0.03)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <td className="px-6 py-5 font-bold" style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border-subtle)', background: 'rgba(0,229,195,0.02)' }}>
                {row.feature}
              </td>
              <td className="px-6 py-5 leading-relaxed" style={{ color: 'var(--accent-teal)', borderRight: '1px solid var(--border-subtle)' }}>
                <div className="flex gap-2 justify-center text-center">
                  <span>{row.career1_details}</span>
                </div>
              </td>
              <td className="px-6 py-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex gap-2 justify-center text-center">
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
