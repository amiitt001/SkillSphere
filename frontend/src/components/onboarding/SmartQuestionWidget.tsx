import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { auth } from '@/lib/firebase';
import { SmartQuestion } from '@/services/onboarding/smartQuestionEngine';

interface SmartQuestionWidgetProps {
  onProgressUpdate?: (score: number) => void;
}

export const SmartQuestionWidget = ({ onProgressUpdate }: SmartQuestionWidgetProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<SmartQuestion | null>(null);
  const [completenessScore, setCompletenessScore] = useState(0);

  // Input states
  const [textVal, setTextVal] = useState('');
  const [selectedOpt, setSelectedOpt] = useState('');
  const [selectedOpts, setSelectedOpts] = useState<string[]>([]);

  const fetchNext = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/onboarding/question', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setQuestion(json.data.nextQuestion);
          setCompletenessScore(json.data.score);
          if (onProgressUpdate) {
            onProgressUpdate(json.data.score);
          }
          // Reset local input states
          setTextVal('');
          setSelectedOpt('');
          setSelectedOpts([]);
        }
      }
    } catch (e) {
      console.error('Failed to load next question:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNext();
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question) return;

    setSaving(true);
    let value: any;

    if (question.type === 'text' || question.type === 'tags') {
      value = question.type === 'tags'
        ? textVal.split(',').map((s) => s.trim()).filter(Boolean)
        : textVal;
    } else if (question.type === 'select') {
      value = selectedOpt;
    } else if (question.type === 'multiselect') {
      value = selectedOpts;
    }

    if (!value || (Array.isArray(value) && value.length === 0)) {
      setSaving(false);
      return; // prevent submitting empty answers
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/onboarding/question', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          field: question.field,
          value
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setQuestion(json.data.nextQuestion);
          setCompletenessScore(json.data.score);
          if (onProgressUpdate) {
            onProgressUpdate(json.data.score);
          }
          // Reset states
          setTextVal('');
          setSelectedOpt('');
          setSelectedOpts([]);
        }
      }
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOption = (opt: string) => {
    if (selectedOpts.includes(opt)) {
      setSelectedOpts(selectedOpts.filter((o) => o !== opt));
    } else {
      setSelectedOpts([...selectedOpts, opt]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div className="skeleton-box" style={{ width: '40%', height: 16 }} />
        <div className="skeleton-box" style={{ width: '100%', height: 32 }} />
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>✨</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Profile is Complete!</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Career recommendations are now running at maximum accuracy.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: 4 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-terra)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Profile Intelligence
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Completeness: {completenessScore}%
          </span>
        </div>

        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, lineHeight: '1.4' }}>
          {question.question}
        </h4>

        {/* Question Type: Select Options */}
        {question.type === 'select' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {question.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedOpt(opt)}
                style={{
                  fontSize: '0.75rem',
                  background: selectedOpt === opt ? 'rgba(196,112,75,0.15)' : 'rgba(255,255,255,0.02)',
                  border: selectedOpt === opt ? '1px solid var(--accent-terra)' : '1px solid var(--border-subtle)',
                  color: selectedOpt === opt ? 'var(--accent-terra)' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Question Type: MultiSelect Options */}
        {question.type === 'multiselect' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {question.options?.map((opt) => {
              const active = selectedOpts.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => handleToggleOption(opt)}
                  style={{
                    fontSize: '0.75rem',
                    background: active ? 'rgba(196,112,75,0.15)' : 'rgba(255,255,255,0.02)',
                    border: active ? '1px solid var(--accent-terra)' : '1px solid var(--border-subtle)',
                    color: active ? 'var(--accent-terra)' : 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt} {active ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        )}

        {/* Question Type: Text or Tags */}
        {(question.type === 'text' || question.type === 'tags') && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              placeholder={question.placeholder || 'Type here...'}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: '#fff',
                outline: 'none',
              }}
            />
            {question.type === 'tags' && (
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Separate skills with commas (e.g. Python, SQL)
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={() => handleSubmit()}
          disabled={saving}
          style={{
            width: '100%',
            background: 'var(--accent-terra)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          {saving ? 'Saving...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
};
