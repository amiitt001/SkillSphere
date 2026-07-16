/**
 * CurrentCareerCard
 * Displays the user's committed career goal with live blueprint metrics.
 * Replaces the Career Advisor launch section once a career has been selected.
 */
'use client';

import Link from 'next/link';
import ScoreRing from '@/components/profile/ScoreRing';

export interface CareerStatusData {
  primaryCareerGoal: string;
  careerHealth: number;
  readinessScore: number;
  nextMilestone: string;
  targetCompanies: string[];
  progress: number;
}

interface CurrentCareerCardProps {
  data: CareerStatusData;
  onChangeCareer: () => void;
}

export default function CurrentCareerCard({ data, onChangeCareer }: CurrentCareerCardProps) {
  const {
    primaryCareerGoal,
    careerHealth,
    readinessScore,
    nextMilestone,
    targetCompanies,
    progress,
  } = data;

  // Map health score to a colour token
  const healthColor =
    careerHealth >= 75 ? '#10b981' : careerHealth >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(0,0,0,0) 60%)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 16,
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '2rem',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 20,
              padding: '3px 10px',
              marginBottom: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Active Career Goal
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            {primaryCareerGoal}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Your personalised AI roadmap is active — keep building.
          </p>
        </div>

        {/* Score ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ScoreRing score={careerHealth} size={88} label="Health" color={healthColor} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Career Health
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: '1.5rem',
        }}
      >
        {/* Readiness */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Skill Readiness
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: healthColor }}>
              {readinessScore}%
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${readinessScore}%`,
                background: `linear-gradient(90deg, ${healthColor}88, ${healthColor})`,
                borderRadius: 4,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>

        {/* Next milestone */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Next Milestone
          </span>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
            {nextMilestone}
          </p>
        </div>

        {/* Target companies */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Target Companies
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {targetCompanies.length > 0 ? targetCompanies.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {c}
              </span>
            )) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Set up workspace to populate</span>
            )}
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Blueprint Progress
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {progress}%
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent-clay), var(--accent-amber))',
                borderRadius: 4,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href="/workspace"
          className="btn-primary py-2.5 px-6 text-sm no-underline"
          style={{ fontWeight: 700 }}
        >
          Open Career Workspace →
        </Link>
        <button
          onClick={onChangeCareer}
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '9px 18px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
          }}
        >
          Change Career Goal
        </button>
      </div>
    </div>
  );
}
