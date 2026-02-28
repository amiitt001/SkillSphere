/**
 * LineChart — SVG line chart for competitive programming rating trend
 */
'use client';

interface DataPoint {
    label: string;
    value: number;
}

interface LineChartProps {
    data: DataPoint[];
    width?: number;
    height?: number;
    color?: string;
}

export default function LineChart({ data, width = 400, height = 200, color = 'var(--accent-teal)' }: LineChartProps) {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = data.map((d) => d.value);
    const minVal = Math.floor(Math.min(...values) / 50) * 50;
    const maxVal = Math.ceil(Math.max(...values) / 50) * 50;
    const range = maxVal - minVal || 1;

    const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
    const getY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH;

    // Build polyline points
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

    // Build fill area
    const areaPath = [
        `M ${getX(0)},${getY(data[0].value)}`,
        ...data.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.value)}`),
        `L ${getX(data.length - 1)},${padding.top + chartH}`,
        `L ${getX(0)},${padding.top + chartH}`,
        'Z',
    ].join(' ');

    // Y-axis ticks
    const tickCount = 5;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => minVal + (range / tickCount) * i);

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {ticks.map((t, i) => (
                <g key={i}>
                    <line
                        x1={padding.left} x2={width - padding.right}
                        y1={getY(t)} y2={getY(t)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth={1}
                    />
                    <text
                        x={padding.left - 8} y={getY(t) + 4}
                        textAnchor="end"
                        fill="var(--text-dim)" fontSize={10} fontFamily="var(--font-body)"
                    >
                        {Math.round(t)}
                    </text>
                </g>
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => (
                <text
                    key={i}
                    x={getX(i)} y={height - 5}
                    textAnchor="middle"
                    fill="var(--text-dim)" fontSize={10} fontFamily="var(--font-body)"
                >
                    {d.label}
                </text>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={color} opacity={0.08} />

            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((d, i) => (
                <circle
                    key={i}
                    cx={getX(i)} cy={getY(d.value)}
                    r={4}
                    fill="var(--bg-void)"
                    stroke={color}
                    strokeWidth={2.5}
                />
            ))}
        </svg>
    );
}
