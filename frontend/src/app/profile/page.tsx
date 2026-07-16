/**
 * My Profile page for SkillSphere
 * Profile header, edit form, achievements, and preferences.
 */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import type { UserProfile, Achievement } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const defaultAchievements: Achievement[] = [
    { id: 'streak', label: '21 Day Streak', icon: '🔥', color: 'rgba(255, 149, 0, 0.15)', unlocked: true },
    { id: 'quizzes', label: '5 Quizzes', icon: '✏️', color: 'rgba(0, 229, 195, 0.15)', unlocked: true },
    { id: 'projects', label: '5 Projects', icon: '💡', color: 'rgba(168, 85, 247, 0.15)', unlocked: true },
    { id: 'expert', label: 'AI Expert', icon: '🤖', color: 'rgba(59, 130, 246, 0.15)', unlocked: true },
];

const defaultProfile: UserProfile = {
    fullName: '',
    email: '',
    college: '',
    stream: 'Computer Science & Engineering',
    year: '3rd Year',
    bio: '',
    location: 'India',
    stats: { repos: 23, skills: 14, cgpa: 8.4, streak: 21 },
    achievements: defaultAchievements,
    preferences: { emailNotifications: true, weeklyReports: true, jobAlerts: false },
};

const streamOptions = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Other',
];

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Postgraduate'];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';
}

function calculateCompleteness(profile: any): number {
    let score = 0;
    if (!profile) return 0;

    // 1. Personal Info (15%)
    let personalScore = 0;
    if (profile.personalInfo?.fullName) personalScore += 5;
    if (profile.personalInfo?.email) personalScore += 5;
    if (profile.personalInfo?.githubUrl || profile.personalInfo?.linkedinUrl || profile.personalInfo?.location) personalScore += 5;
    score += personalScore;

    // 2. Education (15%)
    if (profile.education && profile.education.length > 0 && profile.education[0].institution && profile.education[0].degree) {
        score += 15;
    }

    // 3. Technical Skills (20%)
    if (profile.skills && profile.skills.length > 0) {
        score += 20;
    }

    // 4. Projects (15%)
    if (profile.projects && profile.projects.length > 0 && profile.projects[0].title) {
        score += 15;
    }

    // 5. Professional Experience (15%)
    if (profile.experience && profile.experience.length > 0) {
        score += 15;
    }

    // 6. Career Goals (10%)
    let goalScore = 0;
    if (profile.careerGoals?.preferredRoles && profile.careerGoals.preferredRoles.length > 0) goalScore += 5;
    if (profile.careerGoals?.preferredLocations && profile.careerGoals.preferredLocations.length > 0) goalScore += 5;
    score += goalScore;

    // 7. Connected Accounts (10%)
    if (profile.personalInfo?.githubUrl || profile.personalInfo?.leetcodeUsername || profile.personalInfo?.codeforcesHandle || profile.personalInfo?.linkedinUrl) {
        score += 10;
    }

    return score;
}

interface ExtendedUserProfile extends UserProfile {
    unifiedProfile?: any;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ExtendedUserProfile>(defaultProfile);
    const [saved, setSaved] = useState(false);
    const [headerSaved, setHeaderSaved] = useState(false);

    // Load from Firestore on mount
    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setProfile({
                        fullName: data.name || data.fullName || user.displayName || '',
                        email: data.email || user.email || '',
                        college: data.college || '',
                        stream: data.stream || 'Computer Science & Engineering',
                        year: data.year || '3rd Year',
                        bio: data.bio || '',
                        location: data.location || 'India',
                        stats: data.stats || defaultProfile.stats,
                        achievements: defaultAchievements,
                        preferences: data.preferences || defaultProfile.preferences,
                        unifiedProfile: data.unifiedProfile || null
                    });
                } else {
                    // LocalStorage fallback for legacy users
                    const stored = localStorage.getItem('skillsphere_profile');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setProfile({ ...defaultProfile, ...parsed, fullName: parsed.fullName || user.displayName || '', email: parsed.email || user.email || '', achievements: defaultAchievements });
                    } else {
                        setProfile((prev) => ({
                            ...prev,
                            fullName: user.displayName || '',
                            email: user.email || '',
                        }));
                    }
                }
            } catch (err) {
                console.error("Error loading profile from Firestore:", err);
            }
        };

        loadProfile();
    }, [user]);

    const saveProfile = async () => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let existingUnified = {};
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                existingUnified = data.unifiedProfile || {};
            }

            const existingPersonalInfo = (existingUnified as any).personalInfo || {};
            const newPersonalInfo = {
                ...existingPersonalInfo,
                fullName: profile.fullName,
                email: profile.email,
                location: profile.location,
            };

            const existingEducation = (existingUnified as any).education || [];
            const newEducation = [...existingEducation];
            if (profile.college) {
                if (newEducation.length > 0) {
                    newEducation[0] = {
                        ...newEducation[0],
                        institution: profile.college,
                        stream: profile.stream,
                        degree: profile.year
                    };
                } else {
                    newEducation.push({
                        institution: profile.college,
                        stream: profile.stream,
                        degree: profile.year
                    });
                }
            }

            const newUnifiedProfile = {
                ...existingUnified,
                uid: user.uid,
                personalInfo: newPersonalInfo,
                education: newEducation,
                skills: (existingUnified as any).skills || [],
                projects: (existingUnified as any).projects || [],
                experience: (existingUnified as any).experience || [],
                careerGoals: (existingUnified as any).careerGoals || {},
                lastUpdated: new Date().toISOString(),
                profileCompleteness: 0,
            };

            newUnifiedProfile.profileCompleteness = calculateCompleteness(newUnifiedProfile);

            await setDoc(userDocRef, {
                name: profile.fullName,
                fullName: profile.fullName,
                email: profile.email,
                college: profile.college,
                stream: profile.stream,
                year: profile.year,
                bio: profile.bio,
                location: profile.location,
                stats: profile.stats,
                preferences: profile.preferences,
                unifiedProfile: newUnifiedProfile,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp() // setDoc merge preserves if already exists, but rule requires name/email/createdAt at creation time
            }, { merge: true });

            localStorage.setItem('skillsphere_profile', JSON.stringify(profile)); // keep local storage in sync as a backup
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Error saving profile to Firestore:", err);
        }
    };

    const saveHeader = async () => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let existingUnified = {};
            if (userDocSnap.exists()) {
                const data = userDocSnap.data();
                existingUnified = data.unifiedProfile || {};
            }

            const existingPersonalInfo = (existingUnified as any).personalInfo || {};
            const newPersonalInfo = {
                ...existingPersonalInfo,
                fullName: profile.fullName,
                location: profile.location,
            };

            const existingEducation = (existingUnified as any).education || [];
            const newEducation = [...existingEducation];
            if (profile.college) {
                if (newEducation.length > 0) {
                    newEducation[0] = {
                        ...newEducation[0],
                        institution: profile.college,
                        stream: profile.stream,
                        degree: profile.year
                    };
                } else {
                    newEducation.push({
                        institution: profile.college,
                        stream: profile.stream,
                        degree: profile.year
                    });
                }
            }

            const newUnifiedProfile = {
                ...existingUnified,
                uid: user.uid,
                personalInfo: newPersonalInfo,
                education: newEducation,
                skills: (existingUnified as any).skills || [],
                projects: (existingUnified as any).projects || [],
                experience: (existingUnified as any).experience || [],
                careerGoals: (existingUnified as any).careerGoals || {},
                lastUpdated: new Date().toISOString(),
                profileCompleteness: 0,
            };

            newUnifiedProfile.profileCompleteness = calculateCompleteness(newUnifiedProfile);

            await setDoc(userDocRef, {
                name: profile.fullName,
                fullName: profile.fullName,
                college: profile.college,
                stream: profile.stream,
                year: profile.year,
                location: profile.location,
                unifiedProfile: newUnifiedProfile,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            }, { merge: true });

            localStorage.setItem('skillsphere_profile', JSON.stringify(profile));
            setHeaderSaved(true);
            setTimeout(() => setHeaderSaved(false), 2000);
        } catch (err) {
            console.error("Error saving profile header:", err);
        }
    };

    const updateField = (field: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const togglePreference = async (key: keyof UserProfile['preferences']) => {
        if (!user) return;
        const updatedPrefs = { ...profile.preferences, [key]: !profile.preferences[key] };
        setProfile((prev) => ({
            ...prev,
            preferences: updatedPrefs,
        }));

        try {
            await setDoc(doc(db, 'users', user.uid), {
                preferences: updatedPrefs,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            }, { merge: true });
            
            localStorage.setItem('skillsphere_profile', JSON.stringify({
                ...profile,
                preferences: updatedPrefs
            }));
        } catch (err) {
            console.error("Error updating preference:", err);
        }
    };

    return (
        <ProtectedRoute>
            <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* ══ PAGE HEADER BAR ══ */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                    }}
                >
                    <h1
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                        }}
                    >
                        My Profile
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--accent-teal)',
                                boxShadow: '0 0 8px rgba(0,229,195,0.5)',
                            }}
                        />
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}
                        >
                            + Get Recommendations
                        </button>
                    </div>
                </div>

                {/* ══ PROFILE HEADER CARD ══ */}
                <div className="profile-header animate-fade-up">
                    <div className="profile-avatar">{getInitials(profile.fullName)}</div>
                    <div style={{ flex: 1 }}>
                        <h2
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0,
                            }}
                        >
                            {profile.fullName || 'Your Name'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0' }}>
                            {profile.stream} · {profile.college || 'Your College'} · {profile.year}
                        </p>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                            {profile.email || 'your@email.com'} · {profile.location}
                        </p>
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{profile.stats.repos}</span>
                                <span className="stat-label">Repos</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{profile.stats.skills}</span>
                                <span className="stat-label">Skills</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{profile.stats.cgpa}</span>
                                <span className="stat-label">CGPA</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{profile.stats.streak}d</span>
                                <span className="stat-label">Streak</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={saveHeader}
                        className="btn-primary"
                        style={{
                            alignSelf: 'flex-start',
                            fontSize: '0.8rem',
                            padding: '0.6rem 1.5rem',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {headerSaved ? '✓ Saved!' : 'Save Profile'}
                    </button>
                </div>

                {/* ══ TWO-COLUMN GRID ══ */}
                <div className="profile-grid">
                    {/* LEFT: Edit Profile */}
                    <div className="profile-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <div className="profile-section-title">
                            <span>✏️</span> Edit Profile
                        </div>

                        <div className="profile-form">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.fullName}
                                    onChange={(e) => updateField('fullName', e.target.value)}
                                    className="w-full"
                                    placeholder="Aryan Kumar"
                                    autoComplete="name"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="w-full"
                                    placeholder="you@college.ac.in"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">College</label>
                                <input
                                    type="text"
                                    value={profile.college}
                                    onChange={(e) => updateField('college', e.target.value)}
                                    className="w-full"
                                    placeholder="IIT Delhi"
                                    autoComplete="organization"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stream</label>
                                <select
                                    value={profile.stream}
                                    onChange={(e) => updateField('stream', e.target.value)}
                                >
                                    {streamOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <select
                                    value={profile.year}
                                    onChange={(e) => updateField('year', e.target.value)}
                                >
                                    {yearOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => updateField('bio', e.target.value)}
                                    placeholder="CS undergrad passionate about ML and full-stack development. Building AI-powered tools."
                                    rows={3}
                                />
                            </div>

                            <button onClick={saveProfile} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                                {saved ? '✓ Profile Updated!' : 'Update Profile'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Achievements + Preferences */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Achievements */}
                        <div className="profile-section animate-fade-up" style={{ animationDelay: '0.2s' }}>
                            <div className="profile-section-title">
                                <span>🏆</span> Achievements
                            </div>
                            <div className="achievements-grid">
                                {profile.achievements.map((badge) => (
                                    <div key={badge.id} className="achievement-badge">
                                        <div
                                            className="badge-icon"
                                            style={{ background: badge.color }}
                                        >
                                            {badge.icon}
                                        </div>
                                        <span className="badge-label">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="profile-section animate-fade-up" style={{ animationDelay: '0.3s' }}>
                            <div className="profile-section-title">
                                <span>⚙️</span> Preferences
                            </div>

                            <div className="toggle-row">
                                <label>Email Notifications</label>
                                <button
                                    className={`toggle-switch ${profile.preferences.emailNotifications ? 'active' : ''}`}
                                    onClick={() => togglePreference('emailNotifications')}
                                    aria-label="Toggle email notifications"
                                />
                            </div>

                            <div className="toggle-row">
                                <label>Weekly Reports</label>
                                <button
                                    className={`toggle-switch ${profile.preferences.weeklyReports ? 'active' : ''}`}
                                    onClick={() => togglePreference('weeklyReports')}
                                    aria-label="Toggle weekly reports"
                                />
                            </div>

                            <div className="toggle-row">
                                <label>Job Alerts</label>
                                <button
                                    className={`toggle-switch ${profile.preferences.jobAlerts ? 'active' : ''}`}
                                    onClick={() => togglePreference('jobAlerts')}
                                    aria-label="Toggle job alerts"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ AI PARSED RESUME SUMMARY SECTIONS ══ */}
                {profile.unifiedProfile && (
                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Skills Section */}
                        {profile.unifiedProfile.skills && profile.unifiedProfile.skills.length > 0 && (
                            <div className="profile-section animate-fade-up">
                                <div className="profile-section-title">
                                    <span>⚡</span> AI-Parsed Skills
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                    These technical competencies were extracted and verified from your uploaded resume.
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {profile.unifiedProfile.skills.map((skill: any, idx: number) => {
                                        const skillName = typeof skill === 'string' ? skill : skill.name;
                                        const isLowConfidence = skill && typeof skill === 'object' && skill.confidence < 70;
                                        return (
                                          <span
                                              key={idx}
                                              style={{
                                                  fontSize: '0.75rem',
                                                  background: isLowConfidence ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                                  border: isLowConfidence ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                                                  color: isLowConfidence ? '#ef4444' : 'var(--text-secondary)',
                                                  padding: '6px 12px',
                                                  borderRadius: 8,
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: 6
                                              }}
                                          >
                                              {skillName}
                                              {isLowConfidence && <span title="Low confidence extraction" style={{ fontSize: '0.7rem' }}>⚠️</span>}
                                          </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Projects Section */}
                        {profile.unifiedProfile.projects && profile.unifiedProfile.projects.length > 0 && (
                            <div className="profile-section animate-fade-up">
                                <div className="profile-section-title">
                                    <span>💻</span> AI-Parsed Projects
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    {profile.unifiedProfile.projects.map((proj: any, idx: number) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 12,
                                                padding: '1.25rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                gap: '0.75rem'
                                            }}
                                        >
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                    {proj.title}
                                                </h4>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                                                    {proj.description}
                                                </p>
                                            </div>
                                            {proj.technologies && proj.technologies.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {proj.technologies.map((tech: string, techIdx: number) => (
                                                        <span
                                                            key={techIdx}
                                                            style={{
                                                                fontSize: '0.68rem',
                                                                background: 'rgba(255, 255, 255, 0.02)',
                                                                border: '1px solid var(--border-subtle)',
                                                                color: 'var(--text-dim)',
                                                                padding: '2px 6px',
                                                                borderRadius: 4
                                                            }}
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience Section */}
                        {profile.unifiedProfile.experience && profile.unifiedProfile.experience.length > 0 && (
                            <div className="profile-section animate-fade-up">
                                <div className="profile-section-title">
                                    <span>💼</span> AI-Parsed Experience
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                                    {profile.unifiedProfile.experience.map((exp: any, idx: number) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 12,
                                                padding: '1.25rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                        {exp.role}
                                                    </h4>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                        {exp.company}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.72rem', background: 'rgba(196,112,75,0.08)', border: '1px solid rgba(196,112,75,0.15)', color: 'var(--accent-terra)', padding: '4px 8px', borderRadius: 6 }}>
                                                    {exp.duration}
                                                </span>
                                            </div>
                                            {exp.description && (
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
