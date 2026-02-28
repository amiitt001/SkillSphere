/**
 * AI Interview Prep Page
 * Select career/company/level → Get interview questions → Answer and get AI feedback.
 */
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScoreGauge from '@/components/ScoreGauge';
import type { InterviewQuestion, InterviewFeedback } from '@/types';

type TabType = 'technical' | 'behavioral' | 'coding';

function InterviewPrepContent() {
    const [career, setCareer] = useState('');
    const [companyType, setCompanyType] = useState('MNC');
    const [experienceLevel, setExperienceLevel] = useState('fresher');
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [error, setError] = useState('');
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('technical');
    const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
    const [showSample, setShowSample] = useState<string | null>(null);

    const generateQuestions = async () => {
        if (!career.trim()) {
            setError('Please enter a target career');
            return;
        }
        setLoading(true);
        setError('');
        setQuestions([]);
        setFeedback(null);

        try {
            const response = await fetch('/api/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, companyType, experienceLevel }),
            });
            if (!response.ok) throw new Error('Failed to generate questions');
            const data = await response.json();
            setQuestions(data.questions || []);
            setActiveTab('technical');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const evaluateAnswer = async () => {
        if (!selectedQuestion || !userAnswer.trim()) return;
        setEvaluating(true);
        setFeedback(null);

        try {
            const response = await fetch('/api/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career,
                    companyType,
                    action: 'evaluate',
                    question: selectedQuestion.question,
                    answer: userAnswer,
                }),
            });
            if (!response.ok) throw new Error('Failed to evaluate answer');
            const data = await response.json();
            setFeedback(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to evaluate answer');
        } finally {
            setEvaluating(false);
        }
    };

    const filteredQuestions = questions.filter((q) => q.type === activeTab);
    const tabs: { key: TabType; label: string; emoji: string }[] = [
        { key: 'technical', label: 'Technical', emoji: '⚙️' },
        { key: 'behavioral', label: 'Behavioral', emoji: '🤝' },
        { key: 'coding', label: 'Coding', emoji: '💻' },
    ];

    const getDifficultyBadge = (d: string) => {
        const map: Record<string, string> = { easy: 'strong', medium: 'average', hard: 'weak' };
        return <span className={`score-badge ${map[d] || 'average'}`}>{d}</span>;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="section-eyebrow">AI Interview Coach</div>
                <h1 className="page-title">Interview Prep</h1>
                <p className="page-subtitle">
                    Practice with AI-generated interview questions. Get instant feedback on your answers with scoring and improvement suggestions.
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {/* Setup Form */}
            {questions.length === 0 && !loading && (
                <div className="quiz-card animate-fade-up">
                    <div className="form-group">
                        <label>Target Career</label>
                        <input
                            type="text"
                            value={career}
                            onChange={(e) => setCareer(e.target.value)}
                            placeholder="e.g., Full-Stack Developer, Data Scientist"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Company Type</label>
                            <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} style={{ width: '100%' }}>
                                <option value="Startup">Startup</option>
                                <option value="MNC">MNC</option>
                                <option value="FAANG">FAANG / Big Tech</option>
                                <option value="Service">Service Company</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Experience Level</label>
                            <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} style={{ width: '100%' }}>
                                <option value="fresher">Fresher</option>
                                <option value="1-3 years">1-3 Years</option>
                                <option value="3-5 years">3-5 Years</option>
                                <option value="5+ years">5+ Years</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button className="btn-large primary" onClick={generateQuestions} disabled={!career.trim()}>
                            Generate Questions →
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
                    <span>Generating interview questions...</span>
                </div>
            )}

            {/* Questions */}
            {questions.length > 0 && !loading && (
                <div className="animate-fade-up">
                    {/* Tabs */}
                    <div className="tab-group" style={{ marginBottom: '1.5rem' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => { setActiveTab(tab.key); setSelectedQuestion(null); setFeedback(null); }}
                            >
                                {tab.emoji} {tab.label} ({questions.filter((q) => q.type === tab.key).length})
                            </button>
                        ))}
                    </div>

                    {/* Question List */}
                    {!selectedQuestion && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredQuestions.map((q) => (
                                <div
                                    key={q.id}
                                    className="result-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => { setSelectedQuestion(q); setUserAnswer(''); setFeedback(null); }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        {getDifficultyBadge(q.difficulty)}
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-dim)">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                        {q.question}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Answer Mode */}
                    {selectedQuestion && (
                        <div>
                            <button
                                className="copy-btn"
                                onClick={() => { setSelectedQuestion(null); setFeedback(null); }}
                                style={{ marginBottom: '1.5rem' }}
                            >
                                ← Back to Questions
                            </button>

                            <div className="quiz-card" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    {getDifficultyBadge(selectedQuestion.difficulty)}
                                    <span className="score-badge expert" style={{ textTransform: 'capitalize' }}>{selectedQuestion.type}</span>
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                                    {selectedQuestion.question}
                                </h3>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div className="project-section-title">Key Points to Cover</div>
                                    {selectedQuestion.expectedPoints.map((point, i) => (
                                        <div key={i} className="feature-check">{point}</div>
                                    ))}
                                </div>

                                {selectedQuestion.sampleAnswer && (
                                    <div>
                                        <button
                                            className="copy-btn"
                                            onClick={() => setShowSample(showSample === selectedQuestion.id ? null : selectedQuestion.id)}
                                            style={{ marginBottom: '0.75rem' }}
                                        >
                                            {showSample === selectedQuestion.id ? '🙈 Hide Sample' : '👁 Show Sample Answer'}
                                        </button>
                                        {showSample === selectedQuestion.id && (
                                            <div style={{ background: 'rgba(0,229,195,0.04)', border: '1px solid rgba(0,229,195,0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                                    {selectedQuestion.sampleAnswer}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Answer Input */}
                            <div className="quiz-card">
                                <div className="form-group">
                                    <label>Your Answer</label>
                                    <textarea
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Type your answer here... Use the STAR method for behavioral questions."
                                        rows={6}
                                        style={{ width: '100%', minHeight: '150px' }}
                                    />
                                </div>
                                <div className="form-footer">
                                    <button
                                        className="btn-large primary"
                                        onClick={evaluateAnswer}
                                        disabled={evaluating || !userAnswer.trim()}
                                    >
                                        {evaluating ? 'Evaluating...' : 'Get AI Feedback →'}
                                    </button>
                                </div>
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <div className="result-panel animate-fade-up" style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                        AI Feedback
                                    </h3>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                                        <ScoreGauge score={feedback.overallScore} label="Overall" size={120} strokeWidth={8} />
                                        <ScoreGauge score={feedback.structureScore} label="Structure" size={100} strokeWidth={7} />
                                        <ScoreGauge score={feedback.clarityScore} label="Clarity" size={100} strokeWidth={7} />
                                        <ScoreGauge score={feedback.technicalScore} label="Technical" size={100} strokeWidth={7} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div className="project-section-title" style={{ color: '#22c55e' }}>✓ Strengths</div>
                                            {feedback.strengths.map((s, i) => (
                                                <div key={i} className="feature-check">{s}</div>
                                            ))}
                                        </div>
                                        <div>
                                            <div className="project-section-title" style={{ color: 'var(--accent-gold)' }}>💡 Improvements</div>
                                            {feedback.improvements.map((s, i) => (
                                                <div key={i} style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    • {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="project-section-title">Revised Answer</div>
                                        <div style={{ background: 'rgba(0,229,195,0.04)', border: '1px solid rgba(0,229,195,0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                                            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                                {feedback.revisedAnswer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reset */}
                    <div className="form-footer" style={{ marginTop: '1.5rem' }}>
                        <button className="btn-large outline" onClick={() => { setQuestions([]); setFeedback(null); setSelectedQuestion(null); }}>
                            ← New Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function InterviewPrepPage() {
    return (
        <ProtectedRoute>
            <InterviewPrepContent />
        </ProtectedRoute>
    );
}
