/**
 * Resume Analyzer Page — Redesigned
 * Two-column layout: Left (Upload + Paste) | Right (ATS Score + Issues + Rewritten Summary)
 */
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FileUpload from '@/components/FileUpload';
import ScoreGauge from '@/components/ScoreGauge';
import type { ResumeAnalysis } from '@/types';

function ResumeAnalyzerContent() {
    const [resumeText, setResumeText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [copiedSummary, setCopiedSummary] = useState(false);

    const handleFileSelect = async (file: File) => {
        // Read file as text for .txt / .doc, or just set the name for PDF
        if (file.name.endsWith('.txt')) {
            const text = await file.text();
            setResumeText(text);
        } else {
            // For PDF/DOCX, show file name — in production this would parse the file
            setResumeText(`[Uploaded: ${file.name}] — PDF parsing requires server-side processing. Please also paste your resume text below for best results.`);
        }
    };

    const handleAnalyze = async () => {
        if (resumeText.trim().length < 50) {
            setError('Please paste at least 50 characters of resume text');
            return;
        }
        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch('/api/resume-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText }),
            });
            if (!response.ok) throw new Error('Failed to analyze resume');
            const data = await response.json();
            setAnalysis(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze resume');
        } finally {
            setLoading(false);
        }
    };

    const copySummary = () => {
        if (!analysis) return;
        navigator.clipboard.writeText(analysis.professionalSummary);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good · Above Average';
        if (score >= 50) return 'Average · Needs Work';
        return 'Poor · Major Improvements Needed';
    };

    return (
        <div className="page-container">
            {/* ══ PAGE HEADER ══ */}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                    <h1 className="page-title" style={{ margin: 0 }}>AI Resume Enhancement Engine</h1>
                </div>
                <p className="page-subtitle" style={{ margin: 0 }}>
                    Upload your resume for deep AI analysis
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(255,95,160,0.08)',
                    border: '1px solid rgba(255,95,160,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    color: 'var(--accent-rose)',
                    fontSize: '0.9rem',
                }}>
                    {error}
                </div>
            )}

            {/* ══ TWO-COLUMN LAYOUT ══ */}
            <div className="ra-grid">
                {/* ── LEFT COLUMN: Upload + Paste ── */}
                <div className="ra-left">
                    {/* Upload Resume */}
                    <div className="ra-section animate-fade-up">
                        <div className="ra-section-title">
                            <span>📎</span> Upload Resume
                        </div>
                        <FileUpload
                            accept=".pdf,.doc,.docx"
                            onFileSelect={handleFileSelect}
                            label="Drop your PDF here"
                            hint="or click to browse · PDF, DOC, DOCX"
                        />
                        <button
                            className="btn-primary"
                            onClick={handleAnalyze}
                            disabled={loading || resumeText.trim().length < 50}
                            style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Resume'}
                        </button>
                    </div>

                    {/* Paste Resume Text */}
                    <div className="ra-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <div className="ra-section-title">
                            <span>📝</span> Or Paste Resume Text
                        </div>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder={`Aryan Kumar\nB.Tech Computer Science | IIT Delhi\naryan.kumar@email.com | github.com/aryan | linkedin.com/in/aryan\n\nSKILLS: Python, React, Node.js, MongoDB, Machine Learning, TensorFlow\n\nEXPERIENCE:\nSoftware Intern – TechCorp (Jun 2024 – Aug 2024)\n– Built REST APIs for data processing\n– Worked on front-end components`}
                            rows={10}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                resize: 'vertical',
                                outline: 'none',
                                transition: 'border-color 0.3s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-teal)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                        />
                        <button
                            className="btn-primary"
                            onClick={handleAnalyze}
                            disabled={loading || resumeText.trim().length < 50}
                            style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}
                        >
                            <span style={{ marginRight: 6 }}>✨</span>
                            {loading ? 'Analyzing...' : 'Analyze with AI'}
                        </button>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: Results ── */}
                <div className="ra-right">
                    {/* Loading State */}
                    {loading && (
                        <div className="ra-section animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div className="loader-dots" style={{ marginBottom: '1rem' }}>
                                <div className="loader-dot" />
                                <div className="loader-dot" />
                                <div className="loader-dot" />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                AI is analyzing your resume...
                            </span>
                        </div>
                    )}

                    {/* Empty State */}
                    {!analysis && !loading && (
                        <div className="ra-section animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📊</div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.1rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem',
                            }}>
                                ATS Score Analysis
                            </h3>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                Upload or paste your resume to get an AI-powered analysis
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {analysis && !loading && (
                        <>
                            {/* ATS Score */}
                            <div className="ra-section animate-fade-up">
                                <div className="ra-section-title">
                                    <span>🎯</span> ATS Score Analysis
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                                    <ScoreGauge score={analysis.atsScore} label="ATS Score" size={160} strokeWidth={10} />
                                    <p style={{
                                        color: analysis.atsScore >= 75 ? 'var(--accent-teal)' : analysis.atsScore >= 50 ? 'var(--accent-gold)' : 'var(--accent-rose)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        marginTop: '0.75rem',
                                    }}>
                                        {getScoreLabel(analysis.atsScore)}
                                    </p>
                                    {/* Score bar */}
                                    <div style={{
                                        width: '100%',
                                        display: 'flex',
                                        gap: 4,
                                        marginTop: '1rem',
                                    }}>
                                        <div style={{
                                            flex: 4, height: 6, borderRadius: 3,
                                            background: analysis.atsScore >= 0 ? 'var(--accent-rose)' : 'var(--border-subtle)',
                                        }} />
                                        <div style={{
                                            flex: 4, height: 6, borderRadius: 3,
                                            background: analysis.atsScore >= 50 ? 'var(--accent-gold)' : 'var(--border-subtle)',
                                        }} />
                                        <div style={{
                                            flex: 2, height: 6, borderRadius: 3,
                                            background: analysis.atsScore >= 90 ? 'var(--accent-teal)' : 'var(--border-subtle)',
                                        }} />
                                    </div>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Poor (0-49)</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Good (50-89)</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Excellent (90+)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Issues Found */}
                            <div className="ra-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
                                <div className="ra-section-title">
                                    <span>⚠️</span> Issues Found
                                </div>

                                {/* Weak Bullet Points */}
                                {analysis.bullets && analysis.bullets.filter(b => b.rating === 'weak').length > 0 && (
                                    <div className="ra-issue-block" style={{ marginBottom: '1rem' }}>
                                        <div className="ra-issue-label weak">Weak Bullet Points</div>
                                        {analysis.bullets
                                            .filter((b) => b.rating === 'weak')
                                            .map((bullet, i) => (
                                                <p key={i} style={{
                                                    fontSize: '0.82rem',
                                                    color: 'var(--text-secondary)',
                                                    margin: '0.5rem 0',
                                                    lineHeight: 1.5,
                                                }}>
                                                    &ldquo;{bullet.original}&rdquo; → <em style={{ color: 'var(--accent-teal)' }}>{bullet.rewritten}</em>
                                                </p>
                                            ))}
                                    </div>
                                )}

                                {/* Missing Skills */}
                                {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                                    <div className="ra-issue-block" style={{ marginBottom: '1rem' }}>
                                        <div className="ra-issue-label missing">Missing Skills</div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.5rem 0', lineHeight: 1.5 }}>
                                            Add: {analysis.missingSkills.join(', ')}
                                        </p>
                                    </div>
                                )}

                                {/* Suggested Projects */}
                                {analysis.suggestedProjects && analysis.suggestedProjects.length > 0 && (
                                    <div className="ra-issue-block">
                                        <div className="ra-issue-label projects">Suggest Projects</div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.5rem 0', lineHeight: 1.5 }}>
                                            {analysis.suggestedProjects.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Rewritten Summary */}
                            <div className="ra-section animate-fade-up" style={{ animationDelay: '0.2s' }}>
                                <div className="ra-section-title">
                                    <span>✨</span> Rewritten Summary
                                </div>
                                <blockquote style={{
                                    padding: '1.25rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-subtle)',
                                    borderLeft: '3px solid var(--accent-teal)',
                                    margin: 0,
                                }}>
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.7,
                                        fontStyle: 'italic',
                                        margin: 0,
                                    }}>
                                        &ldquo;{analysis.professionalSummary}&rdquo;
                                    </p>
                                </blockquote>
                                <button
                                    onClick={copySummary}
                                    style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: copiedSummary ? 'var(--accent-teal)' : 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    {copiedSummary ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                </button>
                            </div>

                            {/* Reset */}
                            <button
                                className="btn-large outline"
                                onClick={() => { setAnalysis(null); setResumeText(''); }}
                                style={{ width: '100%', marginTop: '1rem' }}
                            >
                                ← Analyze Another Resume
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResumeAnalyzerPage() {
    return (
        <ProtectedRoute>
            <ResumeAnalyzerContent />
        </ProtectedRoute>
    );
}
