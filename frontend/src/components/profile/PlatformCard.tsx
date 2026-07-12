'use client';

/**
 * PlatformCard — Connection card for a single platform with sync status
 */

type ConnectionStatus = 'idle' | 'loading' | 'connected' | 'error';

interface PlatformCardProps {
  id: string;
  icon: string;
  label: string;
  handle: string;
  status: ConnectionStatus;
  editMode: boolean;
  placeholder: string;
  isLinkedIn?: boolean;
  onHandleChange: (value: string) => void;
}

const statusConfig = {
  idle: { label: 'Not Connected', color: 'rgba(255,255,255,0.1)', textColor: 'var(--text-dim)', dot: '#666' },
  loading: { label: 'Syncing...', color: 'rgba(59,130,246,0.15)', textColor: '#60a5fa', dot: '#3b82f6' },
  connected: { label: 'Connected', color: 'rgba(16,185,129,0.12)', textColor: '#10b981', dot: '#10b981' },
  error: { label: 'Error', color: 'rgba(239,68,68,0.12)', textColor: '#f87171', dot: '#ef4444' },
};

export default function PlatformCard({
  id,
  icon,
  label,
  handle,
  status,
  editMode,
  placeholder,
  isLinkedIn = false,
  onHandleChange,
}: PlatformCardProps) {
  const cfg = statusConfig[status];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: status === 'connected' ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${status === 'connected' ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Platform icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Platform info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          {label}
        </div>
        {editMode ? (
          <input
            id={`platform-input-${id}`}
            type="text"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width: '100%',
              fontSize: '0.75rem',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              color: 'var(--text-secondary)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: '0.75rem',
              color: handle ? 'var(--text-secondary)' : 'var(--text-dim)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {handle || 'Not set'}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 20,
          background: cfg.color,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.dot,
            boxShadow: status === 'connected' ? `0 0 6px ${cfg.dot}` : 'none',
          }}
        />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.textColor, whiteSpace: 'nowrap' }}>
          {isLinkedIn && status === 'connected' ? 'Display Only' : cfg.label}
        </span>
      </div>
    </div>
  );
}
