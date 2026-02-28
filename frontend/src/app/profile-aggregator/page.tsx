/**
 * Profile Aggregator — Unified developer profile dashboard
 * Connects GitHub, LeetCode, Codeforces, LinkedIn
 */
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DonutChart from '@/components/DonutChart';
import LineChart from '@/components/LineChart';

interface ProfileHandles {
    github: string;
    leetcode: string;
    codeforces: string;
    linkedin: string;
}

interface GitHubData {
    username: string;
    avatarUrl: string;
    publicRepos: number;
    followers: number;
    totalStars: number;
    topLanguages: { name: string; percentage: number }[];
    repos: { name: string; stars: number; language: string; description: string; updatedAt: string }[];
}

interface CodeforcesData {
    handle: string;
    rating: number;
    maxRating: number;
    rank: string;
    problemsSolved: number;
    ratingHistory: { contestName: string; rating: number; date: string }[];
}

interface LeetCodeData {
    username: string;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
}

type ConnectionStatus = 'idle' | 'loading' | 'connected' | 'error';

const LANG_COLORS: Record<string, string> = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    'HTML/CSS': '#e34c26',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
    Dart: '#00B4AB',
};

function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

function ProfileAggregatorContent() {
    const [handles, setHandles] = useState<ProfileHandles>({ github: '', leetcode: '', codeforces: '', linkedin: '' });
    const [status, setStatus] = useState<Record<string, ConnectionStatus>>({
        github: 'idle', leetcode: 'idle', codeforces: 'idle', linkedin: 'idle',
    });
    const [github, setGithub] = useState<GitHubData | null>(null);
    const [codeforces, setCodeforces] = useState<CodeforcesData | null>(null);
    const [leetcode, setLeetcode] = useState<LeetCodeData | null>(null);
    const [editMode, setEditMode] = useState(true);

    // Load saved handles
    useEffect(() => {
        const saved = localStorage.getItem('skillsphere_aggregator');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHandles(parsed.handles || { github: '', leetcode: '', codeforces: '', linkedin: '' });
                if (parsed.github) { setGithub(parsed.github); setStatus(s => ({ ...s, github: 'connected' })); }
                if (parsed.codeforces) { setCodeforces(parsed.codeforces); setStatus(s => ({ ...s, codeforces: 'connected' })); }
                if (parsed.leetcode) { setLeetcode(parsed.leetcode); setStatus(s => ({ ...s, leetcode: 'connected' })); }
                if (parsed.handles?.linkedin) { setStatus(s => ({ ...s, linkedin: 'connected' })); }
                setEditMode(false);
            } catch { /* ignore */ }
        }
    }, []);

    const saveData = (gh: GitHubData | null, cf: CodeforcesData | null, lc: LeetCodeData | null) => {
        localStorage.setItem('skillsphere_aggregator', JSON.stringify({
            handles, github: gh, codeforces: cf, leetcode: lc,
        }));
    };

    const fetchGitHub = async () => {
        if (!handles.github.trim()) return;
        setStatus(s => ({ ...s, github: 'loading' }));
        try {
            const res = await fetch('/api/profile-aggregator/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: handles.github.trim() }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGithub(data);
            setStatus(s => ({ ...s, github: 'connected' }));
            return data;
        } catch {
            setStatus(s => ({ ...s, github: 'error' }));
            return null;
        }
    };

    const fetchCodeforces = async () => {
        if (!handles.codeforces.trim()) return;
        setStatus(s => ({ ...s, codeforces: 'loading' }));
        try {
            const res = await fetch('/api/profile-aggregator/codeforces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle: handles.codeforces.trim() }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCodeforces(data);
            setStatus(s => ({ ...s, codeforces: 'connected' }));
            return data;
        } catch {
            setStatus(s => ({ ...s, codeforces: 'error' }));
            return null;
        }
    };

    const fetchLeetCode = async () => {
        if (!handles.leetcode.trim()) return;
        setStatus(s => ({ ...s, leetcode: 'loading' }));
        try {
            const res = await fetch('/api/profile-aggregator/leetcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: handles.leetcode.trim() }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setLeetcode(data);
            setStatus(s => ({ ...s, leetcode: 'connected' }));
            return data;
        } catch {
            setStatus(s => ({ ...s, leetcode: 'error' }));
            return null;
        }
    };

    const connectAll = async () => {
        setEditMode(false);
        if (handles.linkedin.trim()) setStatus(s => ({ ...s, linkedin: 'connected' }));
        const [gh, cf, lc] = await Promise.all([fetchGitHub(), fetchCodeforces(), fetchLeetCode()]);
        saveData(gh, cf, lc);
    };

    const hasAnyData = github || codeforces || leetcode;

    const statusBadge = (key: string) => {
        const s = status[key];
        if (s === 'loading') return <span className="pa-badge loading">Fetching...</span>;
        if (s === 'connected') return <span className="pa-badge connected">{key === 'linkedin' ? 'Display Only' : 'Connected'}</span>;
        if (s === 'error') return <span className="pa-badge error">Error</span>;
        return <span className="pa-badge idle">Not Connected</span>;
    };

    const donutData = github?.topLanguages.map((l) => ({
        label: l.name,
        value: l.percentage,
        color: LANG_COLORS[l.name] || '#888',
    })) || [];

    const lineData = codeforces?.ratingHistory.map((r) => {
        const d = new Date(r.date);
        return { label: d.toLocaleString('default', { month: 'short' }), value: r.rating };
    }) || [];

    return (
        <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* ══ HEADER ══ */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.5rem' }}>🌐</span>
                    <h1 className="page-title" style={{ margin: 0 }}>Unified Profile Dashboard</h1>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                    Connect GitHub, LeetCode, Codeforces for unified analytics
                </p>
            </div>

            {/* ══ TOP ROW: Connected Profiles + Unified Stats ══ */}
            <div className="pa-grid-2">
                {/* Connected Profiles */}
                <div className="ra-section">
                    <div className="ra-section-title"><span>🔗</span> Connected Profiles</div>

                    {[
                        { key: 'github', icon: '⚫', label: 'GitHub', placeholder: 'username', field: 'github' as const },
                        { key: 'leetcode', icon: '🟡', label: 'LeetCode', placeholder: 'username', field: 'leetcode' as const },
                        { key: 'codeforces', icon: '🔵', label: 'Codeforces', placeholder: 'handle', field: 'codeforces' as const },
                        { key: 'linkedin', icon: '🔗', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/you', field: 'linkedin' as const },
                    ].map((p) => (
                        <div key={p.key} className="pa-profile-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.label}</div>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={handles[p.field]}
                                            onChange={(e) => setHandles(h => ({ ...h, [p.field]: e.target.value }))}
                                            placeholder={p.placeholder}
                                            style={{
                                                fontSize: '0.78rem', padding: '4px 8px', marginTop: 2,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                                                borderRadius: 4, color: 'var(--text-secondary)', outline: 'none',
                                                width: '100%', fontFamily: 'var(--font-body)',
                                            }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {handles[p.field] || 'Not set'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {statusBadge(p.key)}
                        </div>
                    ))}

                    <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
                        {editMode ? (
                            <button className="btn-primary" onClick={connectAll} style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
                                Connect All
                            </button>
                        ) : (
                            <button
                                onClick={() => setEditMode(true)}
                                style={{
                                    fontSize: '0.78rem', padding: '0.4rem 1rem', borderRadius: 6,
                                    border: '1px solid var(--border-subtle)', background: 'transparent',
                                    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                }}
                            >
                                Edit Profiles
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Stats */}
                <div className="ra-section">
                    <div className="ra-section-title"><span>📊</span> Unified Stats</div>
                    <div className="pa-stats-grid">
                        <div className="pa-stat-card">
                            <span className="pa-stat-value" style={{ color: 'var(--accent-teal)' }}>{github?.publicRepos || '—'}</span>
                            <span className="pa-stat-label">GitHub Repos</span>
                        </div>
                        <div className="pa-stat-card">
                            <span className="pa-stat-value" style={{ color: 'var(--accent-gold)' }}>{leetcode?.totalSolved || '—'}</span>
                            <span className="pa-stat-label">LeetCode Solved</span>
                        </div>
                        <div className="pa-stat-card">
                            <span className="pa-stat-value" style={{ color: '#a78bfa' }}>{codeforces?.rating || '—'}</span>
                            <span className="pa-stat-label">CF Rating</span>
                        </div>
                        <div className="pa-stat-card">
                            <span className="pa-stat-value" style={{ color: 'var(--accent-gold)' }}>
                                {github?.totalStars !== undefined ? `${github.totalStars}` : '—'}
                            </span>
                            <span className="pa-stat-label">⭐ Total Stars</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ CHARTS ROW: Language Breakdown + CP Trend ══ */}
            {hasAnyData && (
                <div className="pa-grid-2" style={{ marginTop: '1.5rem' }}>
                    {/* GitHub Language Breakdown */}
                    <div className="ra-section animate-fade-up">
                        <div className="ra-section-title"><span>🎨</span> GitHub Language Breakdown</div>
                        {donutData.length > 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                                <DonutChart data={donutData} size={180} />
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                                Connect GitHub to see language breakdown
                            </p>
                        )}
                    </div>

                    {/* Competitive Programming Trend */}
                    <div className="ra-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <div className="ra-section-title"><span>📈</span> Competitive Programming Trend</div>
                        {lineData.length > 0 ? (
                            <div style={{ padding: '1rem 0' }}>
                                <LineChart data={lineData} width={450} height={200} color="#a78bfa" />
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                                Connect Codeforces to see rating trend
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ══ TOP GITHUB REPOSITORIES ══ */}
            {github && github.repos.length > 0 && (
                <div className="ra-section animate-fade-up" style={{ marginTop: '1.5rem' }}>
                    <div className="ra-section-title"><span>📁</span> Top GitHub Repositories</div>
                    <div className="pa-table-wrap">
                        <table className="pa-table">
                            <thead>
                                <tr>
                                    <th>Repository</th>
                                    <th>Language</th>
                                    <th>Stars</th>
                                    <th>Description</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {github.repos.map((repo) => (
                                    <tr key={repo.name}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{repo.name}</td>
                                        <td>
                                            <span className="pa-lang-badge" style={{
                                                background: `${LANG_COLORS[repo.language] || '#888'}22`,
                                                color: LANG_COLORS[repo.language] || '#888',
                                                border: `1px solid ${LANG_COLORS[repo.language] || '#888'}44`,
                                            }}>
                                                {repo.language}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--accent-gold)' }}>⭐ {repo.stars}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {repo.description || '—'}
                                        </td>
                                        <td style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                                            {repo.updatedAt ? getTimeAgo(repo.updatedAt) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══ LEETCODE BREAKDOWN ══ */}
            {leetcode && (
                <div className="ra-section animate-fade-up" style={{ marginTop: '1.5rem' }}>
                    <div className="ra-section-title"><span>🏆</span> LeetCode Breakdown</div>
                    <div className="pa-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="pa-stat-card" style={{ borderLeft: '3px solid #22c55e' }}>
                            <span className="pa-stat-value" style={{ color: '#22c55e' }}>{leetcode.easySolved}</span>
                            <span className="pa-stat-label">Easy</span>
                        </div>
                        <div className="pa-stat-card" style={{ borderLeft: '3px solid var(--accent-gold)' }}>
                            <span className="pa-stat-value" style={{ color: 'var(--accent-gold)' }}>{leetcode.mediumSolved}</span>
                            <span className="pa-stat-label">Medium</span>
                        </div>
                        <div className="pa-stat-card" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
                            <span className="pa-stat-value" style={{ color: 'var(--accent-rose)' }}>{leetcode.hardSolved}</span>
                            <span className="pa-stat-label">Hard</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProfileAggregatorPage() {
    return (
        <ProtectedRoute>
            <ProfileAggregatorContent />
        </ProtectedRoute>
    );
}
