/**
 * Skill Assessment Quiz Page
 * Multi-step quiz flow: select skills → answer questions → view results
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TagInput from '@/components/TagInput';
import RadarChart from '@/components/RadarChart';
import ScoreGauge from '@/components/ScoreGauge';
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

    // Timer
    useEffect(() => {
        if (step !== 'quiz' || showExplanation) return;
        if (timer <= 0) {
            handleAnswer(-1); // Time's up, mark as wrong
            return;
        }
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

    const startQuiz = async () => {
        if (skills.length === 0) {
            setError('Add at least one skill to assess');
            return;
        }
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

    const getTimerClass = () => {
        if (timer <= 5) return 'quiz-timer danger';
        if (timer <= 10) return 'quiz-timer warning';
        return 'quiz-timer';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="section-eyebrow">AI-Powered Assessment</div>
                <h1 className="page-title">Skill Assessment Quiz</h1>
                <p className="page-subtitle">
                    Test your knowledge with AI-generated questions. Get personalized learning recommendations.
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
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
                        <TagInput
                            tags={skills}
                            setTags={setSkills}
                            placeholder="Add skills (e.g., React, Python, SQL)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Difficulty Level</label>
                        <div className="difficulty-selector">
                            {['beginner', 'intermediate', 'advanced'].map((d) => (
                                <button
                                    key={d}
                                    className={`difficulty-option ${difficulty === d ? 'active' : ''}`}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-footer">
                        <button
                            className="btn-large primary"
                            onClick={startQuiz}
                            disabled={loading || skills.length === 0}
                        >
                            {loading ? 'Generating Quiz...' : 'Start Assessment →'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: QUIZ ── */}
            {step === 'quiz' && questions.length > 0 && (
                <div className="animate-fade-up">
                    {/* Progress */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Question {currentQuestion + 1} of {questions.length}
                        </span>
                        <div className={getTimerClass()}>{timer}s</div>
                    </div>

                    <div className="quiz-progress-bar" style={{ marginBottom: '2rem' }}>
                        <div
                            className="quiz-progress-fill"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* Question Card */}
                    <div className="quiz-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span className="score-badge expert" style={{ textTransform: 'capitalize' }}>
                                {questions[currentQuestion].skill}
                            </span>
                            <span className="score-badge average" style={{ textTransform: 'capitalize' }}>
                                {questions[currentQuestion].difficulty}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1.25rem 0 1.5rem', lineHeight: 1.5 }}>
                            {questions[currentQuestion].question}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {questions[currentQuestion].options.map((option, idx) => {
                                let className = 'quiz-option';
                                if (showExplanation) {
                                    if (idx === questions[currentQuestion].correctAnswer) className += ' correct';
                                    else if (idx === selectedOption) className += ' incorrect';
                                } else if (idx === selectedOption) {
                                    className += ' selected';
                                }
                                return (
                                    <button
                                        key={idx}
                                        className={className}
                                        onClick={() => !showExplanation && handleAnswer(idx)}
                                        disabled={showExplanation}
                                    >
                                        <div className="quiz-option-marker">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {showExplanation && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,229,195,0.04)', border: '1px solid rgba(0,229,195,0.15)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
                                    Explanation
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {questions[currentQuestion].explanation}
                                </p>
                            </div>
                        )}

                        {showExplanation && (
                            <div className="form-footer" style={{ marginTop: '1.5rem' }}>
                                <button className="btn-large primary" onClick={nextQuestion}>
                                    {currentQuestion < questions.length - 1 ? 'Next Question →' : 'View Results →'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── LOADING ── */}
            {loading && step !== 'setup' && (
                <div className="loader" style={{ minHeight: '300px' }}>
                    <div className="loader-dots">
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                    </div>
                    <span>Evaluating your performance...</span>
                </div>
            )}

            {/* ── STEP 3: RESULTS ── */}
            {step === 'results' && (
                <div className="animate-fade-up">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
                        <ScoreGauge score={overallScore} label="Overall" size={180} />
                    </div>

                    {/* Radar Chart */}
                    {scores.length > 0 && (
                        <div className="result-panel" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                Skill Breakdown
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <RadarChart
                                    data={scores.map((s) => ({ label: s.skill, value: s.score }))}
                                    size={300}
                                />
                            </div>

                            {/* Skill scores list */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                                {scores.map((s) => (
                                    <div key={s.skill} className={`score-badge ${s.level}`}>
                                        {s.skill}: {s.score}%
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weak & Strong Areas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="result-panel">
                            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-rose)', marginBottom: '1rem' }}>
                                ⚠ Needs Improvement
                            </h4>
                            {weakAreas.length > 0 ? weakAreas.map((a) => (
                                <div key={a} style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                    {a}
                                </div>
                            )) : <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No weak areas! Great job!</p>}
                        </div>
                        <div className="result-panel">
                            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22c55e', marginBottom: '1rem' }}>
                                ✓ Strengths
                            </h4>
                            {strongAreas.length > 0 ? strongAreas.map((a) => (
                                <div key={a} style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                    {a}
                                </div>
                            )) : <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Keep working to build strengths!</p>}
                        </div>
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="result-panel" style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-teal)', marginBottom: '1rem' }}>
                                📚 Learning Recommendations
                            </h4>
                            {recommendations.map((r, i) => (
                                <div key={i} className="feature-check">{r}</div>
                            ))}
                        </div>
                    )}

                    <div className="form-footer">
                        <button className="btn-large outline" onClick={resetQuiz} style={{ marginRight: '1rem' }}>
                            ← Take Another Quiz
                        </button>
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
