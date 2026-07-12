'use client';

/**
 * ScoreRing — Animated SVG ring for displaying career scores
 */

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export default function ScoreRing({
  score,
  size = 160,
  strokeWidth = 12,
  color = 'var(--accent-teal)',
  label,
  sublabel,
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981'; // green
    if (s >= 50) return '#f59e0b'; // amber
    if (s >= 25) return '#f97316'; // orange
    return '#ef4444';              // red
  };

  const ringColor = color === 'auto' ? getColor(score) : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              filter: `drop-shadow(0 0 8px ${ringColor}66)`,
            }}
          />
        </svg>
        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: size > 120 ? '2rem' : '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          {size > 100 && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              / 100
            </span>
          )}
        </div>
      </div>
      {label && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</div>
          {sublabel && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
