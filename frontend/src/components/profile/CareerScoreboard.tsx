'use client';

/**
 * CareerScoreboard — Animated 6-score grid with progress bars
 */

import type { ProfileScore } from '@/types';

interface CareerScoreboardProps {
  score: ProfileScore;
}

export default function CareerScoreboard({ score }: CareerScoreboardProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {score.breakdown.map((item, i) => (
        <div
          key={item.label}
          className="animate-fade-up"
          style={{
            animationDelay: `${i * 0.07}s`,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {item.label}
              </span>
            </div>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: item.color,
              }}
            >
              {item.score}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 5,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${item.score}%`,
                borderRadius: 99,
                background: item.color,
                boxShadow: `0 0 8px ${item.color}55`,
                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>

          {/* Level label */}
          <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {item.score >= 75 ? '🏆 Expert' : item.score >= 50 ? '⭐ Intermediate' : item.score >= 25 ? '📘 Beginner' : '🔰 Getting Started'}
          </div>
        </div>
      ))}
    </div>
  );
}
