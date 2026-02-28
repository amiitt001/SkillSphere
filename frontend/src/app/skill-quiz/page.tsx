/**
 * Skill Assessment Quiz — Redesigned
 * Two-column layout: Left (skill tabs + question + progress) | Right (bar chart results + AI suggestions)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TagInput from '@/components/TagInput';
import type { QuizQuestion, SkillScore } from '@/types';

type QuizStep = 'setup' | 'quiz' | 'results';

function SkillQuizContent() {
    const [step, setStep] = useState<QuizStep>('setup');
    const [skills, setSkills] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<string>('intermediate');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(30);
    const [scores, setScores] = useState<SkillScore[]>([]);
    const [overallScore, setOverallScore] = useState(0);
    const [weakAreas, setWeakAreas] = useState<string[]>([]);
    const [strongAreas, setStrongAreas] = useState<string[]>([]);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [activeSkillTab, setActiveSkillTab] = useState<string>('');

    // Timer
    useEffect(() => {
        if (step !== 'quiz' || showExplanation) return;
        if (timer <= 0) { handleAnswer(-1); return; }
        const interval = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, timer, showExplanation]);

    const handleAnswer = useCallback((optionIndex: number) => {
        setSelectedOption(optionIndex);
        setShowExplanation(true);
        setAnswers((prev) => [...prev, optionIndex]);
    }, []);

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
            setTimer(30);
        } else {
            submitQuiz();
        }
    };

    const prevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion((prev) => prev - 1);
            setSelectedOption(null);
            setShowExplanation(false);
            setTimer(30);
        }
    };

    const startQuiz = async () => {
        if (skills.length === 0) { setError('Add at least one skill to assess'); return; }
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/skill-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills, difficulty, questionCount: 10 }),
            });
            if (!response.ok) throw new Error('Failed to generate quiz');
            const data = await response.json();
            setQuestions(data.questions || []);
            setAnswers([]);
            setCurrentQuestion(0);
            setTimer(30);
            setActiveSkillTab(skills[0] || '');
            setStep('quiz');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    const submitQuiz = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/skill-quiz/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions, answers: [...answers] }),
            });
            if (!response.ok) throw new Error('Failed to evaluate quiz');
            const data = await response.json();
            setScores(data.scores || []);
            setOverallScore(data.overallScore || 0);
            setWeakAreas(data.weakAreas || []);
            setStrongAreas(data.strongAreas || []);
            setRecommendations(data.recommendations || []);
            setStep('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to evaluate quiz');
        } finally {
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        setStep('setup');
        setQuestions([]);
        setAnswers([]);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScores([]);
        setError('');
    };

    const correctCount = answers.filter((a, i) => questions[i] && a === questions[i].correctAnswer).length;
    const progressPct = questions.length > 0 ? Math.round(((currentQuestion + 1) / questions.length) * 100) : 0;

    const getBarColor = (score: number) => {
        if (score >= 75) return 'var(--accent-teal)';
        if (score >= 50) return 'var(--accent-gold)';
        return 'var(--accent-rose)';
    };

    const getSuggestionType = (score: number): { label: string; color: string } => {
        if (score < 50) return { label: 'PRIORITY', color: 'var(--accent-rose)' };
        if (score < 75) return { label: 'IMPROVE', color: 'var(--accent-gold)' };
        return { label: 'MAINTAIN', color: 'var(--accent-teal)' };
    };

    return (
        <div className="page-container">
            {/* ══ PAGE HEADER ══ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '1.25rem' }}>✏️</span>
                        <h1 className="page-title" style={{ margin: 0 }}>AI Skill Assessment Quiz</h1>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                        Adaptive difficulty · Instant feedback · Skill gap detection
                    </p>
                </div>
                {step === 'quiz' && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                )}
            </div>

            {error && (
                <div style={{
                    background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)',
                    borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem',
                    color: 'var(--accent-rose)', fontSize: '0.9rem',
                }}>
                    {error}
                </div>
            )}

            {/* ── STEP 1: SETUP ── */}
            {step === 'setup' && (
                <div className="quiz-card animate-fade-up">
                    <h2 className="form-title">Configure Your Assessment</h2>
                    <p className="form-subtitle">Select skills to test and choose difficulty level.</p>
                    <div className="form-group">
                        <label>Skills to Assess</label>
                        <TagInput tags={skills} setTags={setSkills} placeholder="Add skills (e.g., React, Python, SQL)" />
                    </div>
                    <div className="form-group">
                        <label>Difficulty Level</label>
                        <div className="difficulty-selector">
                            {['beginner', 'intermediate', 'advanced'].map((d) => (
                                <button key={d} className={`difficulty-option ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-footer">
                        <button className="btn-large primary" onClick={startQuiz} disabled={loading || skills.length === 0}>
                            {loading ? 'Generating Quiz...' : 'Start Assessment →'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── LOADING ── */}
            {loading && step !== 'setup' && (
                <div className="loader" style={{ minHeight: '300px' }}>
                    <div className="loader-dots">
                        <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
                    </div>
                    <span>Evaluating your performance...</span>
                </div>
            )}

            {/* ── STEP 2: QUIZ (Two-Column) ── */}
            {step === 'quiz' && questions.length > 0 && !loading && (
                <div className="sq-layout animate-fade-up">
                    {/* LEFT: Skill Tabs + Question + Progress */}
                    <div className="sq-left">
                        {/* Skill Tabs */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.25rem' }}>
                            {skills.map((skill) => (
                                <button
                                    key={skill}
                                    onClick={() => setActiveSkillTab(skill)}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: 6,
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        border: '1px solid',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontFamily: 'var(--font-body)',
                                        background: activeSkillTab === skill ? 'var(--accent-teal)' : 'rgba(255,255,255,0.05)',
                                        color: activeSkillTab === skill ? 'var(--bg-void)' : 'var(--text-secondary)',
                                        borderColor: activeSkillTab === skill ? 'var(--accent-teal)' : 'var(--border-subtle)',
                                    }}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>

                        {/* Question Label */}
                        <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{
                                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--accent-teal)',
                            }}>
                                {questions[currentQuestion].skill} · {questions[currentQuestion].difficulty} · Q{currentQuestion + 1}
                            </span>
                        </div>

                        {/* Question */}
                        <h3 style={{
                            fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)',
                            margin: '0 0 1.25rem', lineHeight: 1.6,
                        }}>
                            {questions[currentQuestion].question}
                        </h3>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            {questions[currentQuestion].options.map((option, idx) => {
                                let optClass = 'quiz-option';
                                if (showExplanation) {
                                    if (idx === questions[currentQuestion].correctAnswer) optClass += ' correct';
                                    else if (idx === selectedOption) optClass += ' incorrect';
                                } else if (idx === selectedOption) {
                                    optClass += ' selected';
                                }
                                return (
                                    <button key={idx} className={optClass} onClick={() => !showExplanation && handleAnswer(idx)} disabled={showExplanation}>
                                        <div className="quiz-option-marker">{String.fromCharCode(65 + idx)}</div>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {showExplanation && (
                            <div style={{
                                padding: '1rem', marginBottom: '1rem',
                                background: 'rgba(0,229,195,0.04)', border: '1px solid rgba(0,229,195,0.15)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-teal)', marginBottom: '0.4rem' }}>
                                    Explanation
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                    {questions[currentQuestion].explanation}
                                </p>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={prevQuestion}
                                disabled={currentQuestion === 0}
                                style={{
                                    padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                                    border: '1px solid var(--border-subtle)', background: 'transparent',
                                    color: currentQuestion === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
                                    cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                                }}
                            >
                                ← Previous
                            </button>
                            <button
                                onClick={showExplanation ? nextQuestion : undefined}
                                disabled={!showExplanation}
                                className="btn-primary"
                                style={{
                                    padding: '0.6rem 1.5rem', fontSize: '0.82rem',
                                    opacity: showExplanation ? 1 : 0.5,
                                    cursor: showExplanation ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {currentQuestion < questions.length - 1 ? 'Next Question →' : 'View Results →'}
                            </button>
                        </div>

                        {/* Quiz Progress */}
                        <div className="sq-progress-section">
                            <div className="ra-section-title" style={{ marginBottom: '0.75rem' }}>
                                <span>📊</span> Quiz Progress
                            </div>
                            <div className="quiz-progress-bar" style={{ marginBottom: '0.5rem' }}>
                                <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{progressPct}% complete</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Score: {correctCount}/{answers.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Live Results Preview */}
                    <div className="sq-right">
                        {/* Skill Assessment Results - Bar Chart */}
                        <div className="ra-section">
                            <div className="ra-section-title">
                                <span>📊</span> Skill Assessment Results
                            </div>
                            {skills.map((skill) => {
                                // Calculate live score during quiz
                                const skillQuestions = questions.filter(q => q.skill === skill);
                                const skillAnswered = skillQuestions.filter((q) => {
                                    const idx = questions.indexOf(q);
                                    return idx < answers.length;
                                });
                                const skillCorrect = skillAnswered.filter((q) => {
                                    const idx = questions.indexOf(q);
                                    return answers[idx] === q.correctAnswer;
                                });
                                const pct = skillAnswered.length > 0 ? Math.round((skillCorrect.length / skillAnswered.length) * 100) : 0;

                                return (
                                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 120, flexShrink: 0, textAlign: 'right' }}>{skill}</span>
                                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                width: `${pct}%`,
                                                background: getBarColor(pct),
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: getBarColor(pct), fontWeight: 700, width: 35, textAlign: 'right' }}>{pct}%</span>
                                    </div>
                                );
                            })}
                            {skills.length === 0 && (
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No skills selected</p>
                            )}
                        </div>

                        {/* AI Learning Suggestions — shown after some answers */}
                        {answers.length > 0 && (
                            <div className="ra-section animate-fade-in">
                                <div className="ra-section-title">
                                    <span>💡</span> AI Learning Suggestions
                                </div>
                                {skills.map((skill) => {
                                    const skillQuestions = questions.filter(q => q.skill === skill);
                                    const skillAnswered = skillQuestions.filter((q) => {
                                        const idx = questions.indexOf(q);
                                        return idx < answers.length;
                                    });
                                    if (skillAnswered.length === 0) return null;

                                    const skillCorrect = skillAnswered.filter((q) => {
                                        const idx = questions.indexOf(q);
                                        return answers[idx] === q.correctAnswer;
                                    });
                                    const pct = Math.round((skillCorrect.length / skillAnswered.length) * 100);
                                    const sType = getSuggestionType(pct);

                                    return (
                                        <div key={skill} style={{
                                            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-subtle)',
                                            borderLeft: `3px solid ${sType.color}`,
                                            marginBottom: '0.75rem',
                                            background: 'rgba(255,255,255,0.02)',
                                        }}>
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.1em', color: sType.color,
                                            }}>
                                                {sType.label}: {skill}
                                            </span>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '4px 0 0', lineHeight: 1.4 }}>
                                                {pct < 50
                                                    ? `Focus on ${skill} fundamentals. Practice coding exercises and review core concepts.`
                                                    : pct < 75
                                                        ? `Good foundation in ${skill}. Work on advanced topics and real-world applications.`
                                                        : `Strong ${skill} skills! Build a project to apply advanced concepts.`
                                                }
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── STEP 3: RESULTS (Two-Column) ── */}
            {step === 'results' && !loading && (
                <div className="sq-layout animate-fade-up">
                    {/* LEFT: Score Breakdown + Weak/Strong */}
                    <div className="sq-left">
                        <div className="ra-section">
                            <div className="ra-section-title"><span>🏆</span> Final Results</div>
                            <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                <div style={{
                                    fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                                    color: overallScore >= 75 ? 'var(--accent-teal)' : overallScore >= 50 ? 'var(--accent-gold)' : 'var(--accent-rose)',
                                }}>
                                    {overallScore}%
                                </div>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Overall Score</p>
                            </div>

                            {/* Weak & Strong */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-rose)', marginBottom: '0.75rem' }}>
                                        ⚠ Needs Work
                                    </h4>
                                    {weakAreas.length > 0 ? weakAreas.map((a) => (
                                        <div key={a} style={{ padding: '0.4rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)' }}>{a}</div>
                                    )) : <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>None! 🎉</p>}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22c55e', marginBottom: '0.75rem' }}>
                                        ✓ Strengths
                                    </h4>
                                    {strongAreas.length > 0 ? strongAreas.map((a) => (
                                        <div key={a} style={{ padding: '0.4rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)' }}>{a}</div>
                                    )) : <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Keep going!</p>}
                                </div>
                            </div>
                        </div>

                        <button className="btn-large outline" onClick={resetQuiz} style={{ width: '100%' }}>
                            ← Take Another Quiz
                        </button>
                    </div>

                    {/* RIGHT: Bar Chart + Recommendations */}
                    <div className="sq-right">
                        <div className="ra-section">
                            <div className="ra-section-title"><span>📊</span> Skill Assessment Results</div>
                            {scores.map((s) => (
                                <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 120, flexShrink: 0, textAlign: 'right' }}>{s.skill}</span>
                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            width: `${s.score}%`,
                                            background: getBarColor(s.score),
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: getBarColor(s.score), fontWeight: 700, width: 35, textAlign: 'right' }}>{s.score}%</span>
                                </div>
                            ))}
                        </div>

                        {recommendations.length > 0 && (
                            <div className="ra-section animate-fade-up">
                                <div className="ra-section-title"><span>💡</span> AI Learning Suggestions</div>
                                {recommendations.map((r, i) => {
                                    const colors = ['var(--accent-rose)', 'var(--accent-gold)', 'var(--accent-teal)'];
                                    const labels = ['PRIORITY', 'IMPROVE', 'MAINTAIN'];
                                    return (
                                        <div key={i} style={{
                                            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-subtle)',
                                            borderLeft: `3px solid ${colors[i % 3]}`,
                                            marginBottom: '0.75rem',
                                            background: 'rgba(255,255,255,0.02)',
                                        }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors[i % 3] }}>
                                                {labels[i % 3]}
                                            </span>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '4px 0 0', lineHeight: 1.4 }}>{r}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SkillQuizPage() {
    return (
        <ProtectedRoute>
            <SkillQuizContent />
        </ProtectedRoute>
    );
}
