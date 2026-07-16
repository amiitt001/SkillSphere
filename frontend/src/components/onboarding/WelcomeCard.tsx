import React from 'react';

interface WelcomeCardProps {
  onSelectMethod: (method: 'resume' | 'github' | 'manual' | 'skip') => void;
}

export const WelcomeCard = ({ onSelectMethod }: WelcomeCardProps) => {
  return (
    <div
      style={{
        background: 'rgba(23, 20, 18, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '2.5rem',
        maxWidth: 600,
        margin: '2rem auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(196,112,75,0.05)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--accent-terra)',
            letterSpacing: '0.15em',
          }}
        >
          Welcome to SkillSphere
        </span>
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginTop: 8,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          Build Your AI Career Agent
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginTop: 8,
            maxWidth: 460,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Set up your profile in under 2 minutes. The AI will intelligently capture and enrich your skills over time as you utilize the platform.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {/* Recommended Resume Import */}
        <button
          onClick={() => onSelectMethod('resume')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(196,112,75,0.15), rgba(196,112,75,0.05))',
            border: '1px solid rgba(196, 112, 75, 0.3)',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px solid var(--accent-terra)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '1px solid rgba(196, 112, 75, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Upload Resume / CV
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Parses education, experience, and skills instantly
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'var(--accent-terra)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
            }}
          >
            Recommended
          </span>
        </button>

        {/* GitHub Import */}
        <button
          onClick={() => onSelectMethod('github')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>💻</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Import via GitHub Handle
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Sync repositories, stars, and languages
              </span>
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>→</span>
        </button>

        {/* Start Manually */}
        <button
          onClick={() => onSelectMethod('manual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>✍️</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Start Manually
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Manually fill target roles and core skills
              </span>
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>→</span>
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => onSelectMethod('skip')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          Skip onboarding for now, go straight to Advisor
        </button>
      </div>
    </div>
  );
};
