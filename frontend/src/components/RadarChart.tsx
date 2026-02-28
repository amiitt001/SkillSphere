'use client';

/**
 * RadarChart — Pure SVG radar chart for visualizing skill scores.
 * Used in quiz results and profile dashboard.
 */

interface RadarDataPoint {
    label: string;
    value: number; // 0-100
}

interface RadarChartProps {
    data: RadarDataPoint[];
    size?: number;
}

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
    const center = size / 2;
    const radius = size * 0.38;
    const levels = 4;
    const angleStep = (2 * Math.PI) / data.length;

    // Generate points for a given radius
    const getPoints = (r: number) =>
        data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return {
                x: center + r * Math.cos(angle),
                y: center + r * Math.sin(angle),
            };
        });

    // Grid levels
    const gridLevels = Array.from({ length: levels }, (_, i) =>
        getPoints((radius * (i + 1)) / levels)
    );

    // Data points
    const dataPoints = data.map((d, i) => {
        const r = (d.value / 100) * radius;
        const angle = angleStep * i - Math.PI / 2;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    });

    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    // Label positions (slightly outside the chart)
    const labelPoints = data.map((d, i) => {
        const r = radius + 28;
        const angle = angleStep * i - Math.PI / 2;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
            label: d.label,
            value: d.value,
        };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-chart">
            {/* Grid */}
            {gridLevels.map((points, level) => (
                <polygon
                    key={level}
                    points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                />
            ))}

            {/* Axes */}
            {getPoints(radius).map((p, i) => (
                <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                />
            ))}

            {/* Data area */}
            <polygon
                points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(0, 229, 195, 0.12)"
                stroke="#00e5c3"
                strokeWidth="2"
            />

            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#00e5c3"
                    stroke="#03040a"
                    strokeWidth="2"
                />
            ))}

            {/* Labels */}
            {labelPoints.map((lp, i) => (
                <text
                    key={i}
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#7a90b8"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-body)"
                >
                    {lp.label}
                </text>
            ))}
        </svg>
    );
}
