/**
 * Resume Analyzer Page
 * Upload resume text → AI analysis with ATS score, bullet analysis, missing skills, and project suggestions.
 */
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScoreGauge from '@/components/ScoreGauge';
import type { ResumeAnalysis } from '@/types';

function ResumeAnalyzerContent() {
    const [resumeText, setResumeText] = useState('');
    const [targetCareer, setTargetCareer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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
                body: JSON.stringify({ resumeText, targetCareer: targetCareer || undefined }),
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

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const getRatingBadge = (rating: string) => {
        const map: Record<string, string> = { weak: 'weak', average: 'average', strong: 'strong' };
        return <span className={`score-badge ${map[rating] || 'average'}`}>{rating}</span>;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="section-eyebrow">AI Resume Intelligence</div>
                <h1 className="page-title">Resume Analyzer</h1>
                <p className="page-subtitle">
                    Paste your resume and get an AI-powered ATS score, bullet-by-bullet analysis, and actionable improvement suggestions.
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {/* Input Form */}
            {!analysis && (
                <div className="quiz-card animate-fade-up">
                    <div className="form-group">
                        <label>Target Career (Optional)</label>
                        <input
                            type="text"
                            value={targetCareer}
                            onChange={(e) => setTargetCareer(e.target.value)}
                            placeholder="e.g., Full-Stack Developer, Data Scientist"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Resume Text</label>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your full resume text here..."
                            rows={12}
                            style={{ width: '100%', minHeight: '250px' }}
                        />
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            Tip: Copy all text from your resume PDF and paste it here. The AI will analyze the content regardless of formatting.
                        </p>
                    </div>

                    <div className="form-footer">
                        <button
                            className="btn-large primary"
                            onClick={handleAnalyze}
                            disabled={loading || resumeText.trim().length < 50}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Resume →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="loader" style={{ minHeight: '300px' }}>
                    <div className="loader-dots">
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                    </div>
                    <span>AI is analyzing your resume...</span>
                </div>
            )}

            {/* Results */}
            {analysis && !loading && (
                <div className="animate-fade-up">
                    {/* ATS Score */}
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <ScoreGauge score={analysis.atsScore} label="ATS Score" size={200} strokeWidth={12} />
                    </div>

                    {/* Overall Feedback */}
                    <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                            Overall Assessment
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                            {analysis.overallFeedback}
                        </p>
                    </div>

                    {/* Professional Summary */}
                    <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Suggested Professional Summary
                            </h3>
                            <button
                                className={`copy-btn ${copiedIdx === -1 ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(analysis.professionalSummary, -1)}
                            >
                                {copiedIdx === -1 ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', fontStyle: 'italic' }}>
                            &ldquo;{analysis.professionalSummary}&rdquo;
                        </p>
                    </div>

                    {/* Bullet Analysis */}
                    {analysis.bullets && analysis.bullets.length > 0 && (
                        <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                Bullet Point Analysis
                            </h3>
                            {analysis.bullets.map((bullet, i) => (
                                <div key={i} className="bullet-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        {getRatingBadge(bullet.rating)}
                                        <button
                                            className={`copy-btn ${copiedIdx === i ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(bullet.rewritten, i)}
                                        >
                                            {copiedIdx === i ? '✓ Copied' : '📋 Copy Rewrite'}
                                        </button>
                                    </div>
                                    <div className="bullet-original">{bullet.original}</div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', margin: '0.5rem 0', fontWeight: 600 }}>
                                        💡 {bullet.suggestion}
                                    </p>
                                    <div className="bullet-rewrite">{bullet.rewritten}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Missing Skills */}
                    {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                        <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                Missing Skills
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {analysis.missingSkills.map((skill, i) => (
                                    <span key={i} className="tech-badge">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggested Projects */}
                    {analysis.suggestedProjects && analysis.suggestedProjects.length > 0 && (
                        <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                Suggested Projects to Add
                            </h3>
                            {analysis.suggestedProjects.map((project, i) => (
                                <div key={i} className="feature-check">{project}</div>
                            ))}
                        </div>
                    )}

                    {/* Reset */}
                    <div className="form-footer">
                        <button className="btn-large outline" onClick={() => setAnalysis(null)}>
                            ← Analyze Another Resume
                        </button>
                    </div>
                </div>
            )}
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
