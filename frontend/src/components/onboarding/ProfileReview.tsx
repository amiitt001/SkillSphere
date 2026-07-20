import React, { useState } from 'react';
import { ParsedResumeDraft } from '@/services/onboarding/resumeParser';

interface ProfileReviewProps {
  draft: ParsedResumeDraft;
  onSave: (finalDraft: ParsedResumeDraft) => void;
  onBack: () => void;
}

export const ProfileReview = ({ draft, onSave, onBack }: ProfileReviewProps) => {
  const [fullName, setFullName] = useState(draft.personalInfo.fullName || '');
  const [email, setEmail] = useState(draft.personalInfo.email || '');
  const [location, setLocation] = useState(draft.personalInfo.location || '');
  const [githubUrl, setGithubUrl] = useState(draft.personalInfo.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(draft.personalInfo.linkedinUrl || '');

  // Skills state
  const [skillsText, setSkillsText] = useState(draft.skills?.join(', ') || '');

  // Loading state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getConfidenceColor = (key: string) => {
    const val = draft.confidenceScores?.[key] ?? 0.85;
    if (val >= 0.90) return '#10b981'; // green
    if (val >= 0.75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const handleApprove = async () => {
    setSaving(true);
    setError('');
    const parsedSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedDraft: ParsedResumeDraft = {
      personalInfo: {
        fullName,
        email,
        location: location || undefined,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
      },
      education: draft.education,
      skills: parsedSkills,
      certifications: draft.certifications,
      projects: draft.projects,
      experience: draft.experience,
      confidenceScores: draft.confidenceScores,
    };

    try {
      await onSave(updatedDraft);
    } catch (err: any) {
      setError(err.message || 'An error occurred during save.');
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(23, 20, 18, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '2.5rem',
        maxWidth: 650,
        margin: '2rem auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(196,112,75,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          ← Re-upload
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Step 3 of 3</span>
      </div>

      <h3
        style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          marginBottom: 6,
        }}
      >
        Verify Extracted Profile
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
        We parsed the following details from your resume. Check confidence indicators and edit any incorrect fields before saving.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#ef4444',
          fontSize: '0.85rem',
          fontWeight: 500,
          lineHeight: 1.5,
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Personal Details Row */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Full Name
            </label>
            <span style={{ fontSize: '0.68rem', color: getConfidenceColor('personalInfo.fullName'), fontWeight: 600 }}>
              {Math.round((draft.confidenceScores?.['personalInfo.fullName'] ?? 0.85) * 100)}% Confidence
            </span>
          </div>
          <input
            type="text"
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
              Location
            </label>
            <input
              type="text"
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, India"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none' }}
            />
          </div>
        </div>

        {/* Social Handles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
              GitHub Profile Link
            </label>
            <input
              type="text"
              className="input-field"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
              LinkedIn Profile Link
            </label>
            <input
              type="text"
              className="input-field"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none' }}
            />
          </div>
        </div>

        {/* Skills Tag Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Technical Skills
            </label>
            <span style={{ fontSize: '0.68rem', color: getConfidenceColor('skills'), fontWeight: 600 }}>
              {Math.round((draft.confidenceScores?.['skills'] ?? 0.85) * 100)}% Confidence
            </span>
          </div>
          <textarea
            className="input-field"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 10, color: '#fff', outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical' }}
          />
        </div>

        {/* Short Summary Lists (Read-Only references to items parsed) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 4 }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>
              Education Parsed
            </span>
            {draft.education && draft.education.length > 0 ? (
              draft.education.map((e, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  🎓 {e.institution} ({e.degree})
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>None parsed.</span>
            )}
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>
              Experience Parsed
            </span>
            {draft.experience && draft.experience.length > 0 ? (
              draft.experience.map((e, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  💼 {e.company} - {e.role}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>None parsed.</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleApprove}
          disabled={saving}
          style={{
            flex: 1,
            padding: '14px 24px',
            background: saving ? 'rgba(226, 125, 95, 0.5)' : 'linear-gradient(135deg, #e27d5f, #c4704b)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(196, 112, 75, 0.35)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            if (!saving) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {saving ? '⌛ Saving Unified Profile...' : '✓ Approve & Save to Unified Profile'}
        </button>

        <button
          onClick={onBack}
          disabled={saving}
          style={{
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
