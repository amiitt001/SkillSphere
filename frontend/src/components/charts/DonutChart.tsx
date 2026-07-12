/**
 * DonutChart — SVG donut chart for language breakdown
 */
'use client';

interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: DonutSegment[];
    size?: number;
}

export default function DonutChart({ data, size = 180 }: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return null;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;
    const innerRadius = size * 0.22;
    let cumulativeAngle = -90;

    const segments = data.map((seg) => {
        const angle = (seg.value / total) * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const ix1 = cx + innerRadius * Math.cos(endRad);
        const iy1 = cy + innerRadius * Math.sin(endRad);
        const ix2 = cx + innerRadius * Math.cos(startRad);
        const iy2 = cy + innerRadius * Math.sin(startRad);

        const largeArc = angle > 180 ? 1 : 0;

        const path = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${ix1} ${iy1}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
            'Z',
        ].join(' ');

        return { ...seg, path };
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((seg, i) => (
                    <path
                        key={i}
                        d={seg.path}
                        fill={seg.color}
                        stroke="var(--bg-void)"
                        strokeWidth={2}
                        style={{ transition: 'opacity 0.2s' }}
                    />
                ))}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{seg.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
