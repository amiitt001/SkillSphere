import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks';
import { auth } from '@/lib/firebase';
import { ParsedResumeDraft } from '@/services/onboarding/resumeParser';

interface ResumeUploaderProps {
  onParsed: (draft: ParsedResumeDraft) => void;
  onBack: () => void;
}

export const ResumeUploader = ({ onParsed, onBack }: ResumeUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setError('Please upload a PDF or DOCX document.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/onboarding/parse-resume', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to parse resume document.');
      }

      const json = await res.json();
      if (json.success && json.data) {
        onParsed(json.data);
      } else {
        throw new Error('Parsing returned an invalid response schema.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during resume parsing.');
    } finally {
      setUploading(false);
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
        maxWidth: 600,
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
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Step 2 of 3</span>
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
        Upload Resume / CV
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
        Supported formats: **PDF**, **DOCX** (Max 5MB). Extracted text is processed securely and is never stored without your confirmation.
      </p>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: 20,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragActive ? '2px dashed var(--accent-terra)' : '2px dashed var(--border-subtle)',
          borderRadius: 12,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? 'rgba(196,112,75,0.04)' : 'rgba(255,255,255,0.01)',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
        onMouseEnter={(e) => {
          if (!dragActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          if (!dragActive) e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          multiple={false}
          onChange={handleChange}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Shimmer Loader */}
            <div className="skeleton-box" style={{ width: 48, height: 48, borderRadius: '50%' }} />
            <div>
              <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem' }}>
                Analyzing Profile...
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Gemini is extracting education, skills, and projects
              </span>
            </div>
          </div>
        ) : (
          <>
            <span style={{ fontSize: '2.5rem' }}>📤</span>
            <div>
              <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem' }}>
                Drag and drop your resume file here
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginTop: 4 }}>
                or click to browse local files
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
