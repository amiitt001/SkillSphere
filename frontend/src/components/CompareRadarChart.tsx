/**
 * CompareRadarChart — A premium interactive SVG Radar Chart component.
 * Displays a 6-metric side-by-side comparison with monochromatic styling.
 */
'use client';

import React, { useState } from 'react';

interface ChartMetric {
  metric: string;
  career1_value: number;
  career2_value: number;
}

interface CompareRadarChartProps {
  career1Title: string;
  career2Title: string;
  chartData: ChartMetric[];
}

export default function CompareRadarChart({
  career1Title,
  career2Title,
  chartData
}: CompareRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Validate we have 6 metrics
  if (!chartData || chartData.length === 0) return null;

  // Chart dimensions & math constants
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const numPoints = chartData.length; // usually 6

  // Calculate coordinates for a given value (0-100) and index (0-5)
  const getCoordinates = (index: number, value: number) => {
    // 0 is top (-90 degrees), each step is 360 / numPoints
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = cx + distance * Math.cos(angle);
    const y = cy + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate grid points for concentric hexagons (at 20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map(level => {
    const points = Array.from({ length: numPoints }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = cx + (level / 100) * radius * Math.cos(angle);
      const y = cy + (level / 100) * radius * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  });

  // Calculate coordinates for Career 1 and Career 2 polygons
  const c1Points = chartData.map((d, i) => {
    const { x, y } = getCoordinates(i, d.career1_value);
    return `${x},${y}`;
  }).join(' ');

  const c2Points = chartData.map((d, i) => {
    const { x, y } = getCoordinates(i, d.career2_value);
    return `${x},${y}`;
  }).join(' ');

  // Radial axes lines (from center to corners)
  const axes = Array.from({ length: numPoints }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return { x, y };
  });

  // Label coordinates (placed slightly further out than radius)
  const getLabelPosition = (index: number) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const labelRadius = radius + 24;
    const x = cx + labelRadius * Math.cos(angle);
    const y = cy + labelRadius * Math.sin(angle);

    // Text anchor alignments based on angle position
    let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    else if (Math.cos(angle) < -0.1) textAnchor = 'end';

    // Vertical adjustments
    let dy = '0.35em';
    if (Math.sin(angle) < -0.8) dy = '-0.2em';
    else if (Math.sin(angle) > 0.8) dy = '0.9em';

    return { x, y, textAnchor, dy };
  };

  return (
    <div className="flex flex-col items-center p-6 bg-zinc-950/40 border border-zinc-800 rounded-2xl backdrop-blur-md w-full select-none">
      <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-2">Metrics Comparison</h3>
      
      {/* Radar SVG container */}
      <div className="relative w-full max-w-[340px] flex justify-center">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-h-[320px]"
        >
          {/* Concentric hexagonal grid rings */}
          {gridPaths.map((path, idx) => (
            <polygon 
              key={idx} 
              points={path} 
              fill="none" 
              stroke="rgba(255,255,255,0.04)" 
              strokeWidth="1" 
            />
          ))}

          {/* Grid levels label text */}
          {gridLevels.map((level, idx) => {
            const yPos = cy - (level / 100) * radius;
            return (
              <text 
                key={idx} 
                x={cx + 4} 
                y={yPos + 4} 
                fill="rgba(255,255,255,0.2)" 
                fontSize="8" 
                className="font-mono"
              >
                {level}%
              </text>
            );
          })}

          {/* Radial axis lines */}
          {axes.map((axis, idx) => (
            <line 
              key={idx} 
              x1={cx} 
              y1={cy} 
              x2={axis.x} 
              y2={axis.y} 
              stroke="rgba(255,255,255,0.04)" 
              strokeWidth="1" 
            />
          ))}

          {/* Metric labels */}
          {chartData.map((d, idx) => {
            const { x, y, textAnchor, dy } = getLabelPosition(idx);
            const isHovered = hoveredIndex === idx;
            return (
              <text
                key={idx}
                x={x}
                y={y}
                textAnchor={textAnchor}
                dy={dy}
                fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                fontSize="10"
                className="font-mono cursor-pointer transition-colors font-semibold"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.metric}
              </text>
            );
          })}

          {/* Career 1 Polygon (White theme) */}
          <polygon 
            points={c1Points} 
            fill="rgba(255, 255, 255, 0.12)" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            className="transition-all duration-300"
          />

          {/* Career 2 Polygon (Muted Zinc theme) */}
          <polygon 
            points={c2Points} 
            fill="rgba(161, 161, 170, 0.06)" 
            stroke="rgba(161, 161, 170, 0.8)" 
            strokeWidth="1.5" 
            strokeDasharray="4 2" 
            className="transition-all duration-300"
          />

          {/* Interactive vertex circles */}
          {chartData.map((d, idx) => {
            const c1Coord = getCoordinates(idx, d.career1_value);
            const c2Coord = getCoordinates(idx, d.career2_value);
            const isHovered = hoveredIndex === idx;

            return (
              <g 
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover helper line for the axis */}
                <line 
                  x1={cx} 
                  y1={cy} 
                  x2={axes[idx].x} 
                  y2={axes[idx].y} 
                  stroke="transparent" 
                  strokeWidth="12" 
                />

                {/* Career 1 node */}
                <circle 
                  cx={c1Coord.x} 
                  cy={c1Coord.y} 
                  r={isHovered ? 4.5 : 3} 
                  fill="#ffffff" 
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="1"
                />

                {/* Career 2 node */}
                <circle 
                  cx={c2Coord.x} 
                  cy={c2Coord.y} 
                  r={isHovered ? 4.5 : 3} 
                  fill="#a1a1aa" 
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Block */}
      <div className="flex gap-6 mt-4 border-t border-zinc-900 pt-4 w-full justify-center text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-white bg-white/10"></span>
          <span className="text-zinc-200 font-medium truncate max-w-[120px]">{career1Title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-zinc-500 bg-zinc-500/10 border-dashed"></span>
          <span className="text-zinc-400 font-medium truncate max-w-[120px]">{career2Title}</span>
        </div>
      </div>

      {/* Interactive Tooltip / Inline details */}
      <div className="mt-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-900 w-full min-h-[60px] flex flex-col justify-center text-center">
        {hoveredIndex !== null ? (
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Metric: {chartData[hoveredIndex].metric}
            </div>
            <div className="flex justify-between items-center px-4 mt-1">
              <span className="text-xs text-white font-medium">{career1Title}: {chartData[hoveredIndex].career1_value}%</span>
              <span className="text-xs text-zinc-400 font-medium">{career2Title}: {chartData[hoveredIndex].career2_value}%</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic">
            Hover over a metric name or node to compare scores
          </div>
        )}
      </div>
    </div>
  );
}
