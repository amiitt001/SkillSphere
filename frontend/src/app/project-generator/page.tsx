/**
 * AI Project Generator Page
 * Input career + skill level → Get 3 generated project ideas with tech stacks,
 * architectures, features, resume descriptions, and folder structures.
 */
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TagInput from '@/components/TagInput';
import type { GeneratedProject } from '@/types';

function ProjectGeneratorContent() {
    const [career, setCareer] = useState('');
    const [skillLevel, setSkillLevel] = useState('intermediate');
    const [skills, setSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState<GeneratedProject[]>([]);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!career.trim()) {
            setError('Please enter a target career');
            return;
        }
        setLoading(true);
        setError('');
        setProjects([]);

        try {
            const params = new URLSearchParams({ career, skillLevel, skills: skills.join(', ') });
            const response = await fetch(`/api/project-generator?${params}`);
            if (!response.ok) throw new Error('Failed to generate projects');
            const data = await response.json();
            setProjects(data.projects || []);
            setExpandedIdx(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate projects');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="section-eyebrow">AI Project Intelligence</div>
                <h1 className="page-title">Project Generator</h1>
                <p className="page-subtitle">
                    Generate impressive portfolio projects tailored to your target career. Each project comes with tech stack, architecture, features, and a resume-ready description.
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {/* Input Form */}
            {projects.length === 0 && !loading && (
                <div className="quiz-card animate-fade-up">
                    <div className="form-group">
                        <label>Target Career</label>
                        <input
                            type="text"
                            value={career}
                            onChange={(e) => setCareer(e.target.value)}
                            placeholder="e.g., Full-Stack Developer, ML Engineer, DevOps"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Skill Level</label>
                        <div className="difficulty-selector">
                            {['beginner', 'intermediate', 'advanced'].map((d) => (
                                <button
                                    key={d}
                                    className={`difficulty-option ${skillLevel === d ? 'active' : ''}`}
                                    onClick={() => setSkillLevel(d)}
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Your Skills (Optional)</label>
                        <TagInput
                            tags={skills}
                            setTags={setSkills}
                            placeholder="Add your current skills"
                        />
                    </div>

                    <div className="form-footer">
                        <button
                            className="btn-large primary"
                            onClick={handleGenerate}
                            disabled={loading || !career.trim()}
                        >
                            Generate Projects →
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
                    <span>AI is crafting project ideas for you...</span>
                </div>
            )}

            {/* Results */}
            {projects.length > 0 && !loading && (
                <div className="animate-fade-up">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                        {projects.map((project, i) => (
                            <button
                                key={i}
                                className={`tab-item ${expandedIdx === i ? 'active' : ''}`}
                                onClick={() => setExpandedIdx(i)}
                                style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}
                            >
                                Project {i + 1}
                            </button>
                        ))}
                    </div>

                    {expandedIdx !== null && projects[expandedIdx] && (
                        <div className="project-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                        {projects[expandedIdx].title}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        {projects[expandedIdx].description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span className="score-badge expert">{projects[expandedIdx].difficulty}</span>
                                    <span className="score-badge average">{projects[expandedIdx].estimatedTime}</span>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="project-section">
                                <div className="project-section-title">Tech Stack</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {projects[expandedIdx].techStack.map((tech, i) => (
                                        <span key={i} className="tech-badge">{tech}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Architecture */}
                            <div className="project-section">
                                <div className="project-section-title">Architecture</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                    {projects[expandedIdx].architecture}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="project-section">
                                <div className="project-section-title">Key Features</div>
                                {projects[expandedIdx].features.map((feature, i) => (
                                    <div key={i} className="feature-check">{feature}</div>
                                ))}
                            </div>

                            {/* Resume Description */}
                            <div className="project-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="project-section-title">Resume Description</div>
                                    <button
                                        className={`copy-btn ${copiedField === `resume-${expandedIdx}` ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(projects[expandedIdx].resumeDescription, `resume-${expandedIdx}`)}
                                    >
                                        {copiedField === `resume-${expandedIdx}` ? '✓ Copied' : '📋 Copy'}
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,229,195,0.04)', border: '1px solid rgba(0,229,195,0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '0.5rem' }}>
                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                                        &ldquo;{projects[expandedIdx].resumeDescription}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* Folder Structure */}
                            <div className="project-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="project-section-title">Folder Structure</div>
                                    <button
                                        className={`copy-btn ${copiedField === `folder-${expandedIdx}` ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(projects[expandedIdx].folderStructure, `folder-${expandedIdx}`)}
                                    >
                                        {copiedField === `folder-${expandedIdx}` ? '✓ Copied' : '📋 Copy'}
                                    </button>
                                </div>
                                <div className="code-block" style={{ marginTop: '0.5rem' }}>
                                    {projects[expandedIdx].folderStructure}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reset */}
                    <div className="form-footer" style={{ marginTop: '1.5rem' }}>
                        <button className="btn-large outline" onClick={() => setProjects([])}>
                            ← Generate More Projects
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProjectGeneratorPage() {
    return (
        <ProtectedRoute>
            <ProjectGeneratorContent />
        </ProtectedRoute>
    );
}
