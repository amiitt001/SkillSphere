'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  RecommendationFeed, 
  JobRecommendation, 
  InternshipRecommendation, 
  LearningRecommendation, 
  CertificationRecommendation, 
  ProjectRecommendation 
} from '@/services/recommendations/types';

function RecommendationsDashboard() {
  const [feed, setFeed] = useState<RecommendationFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'jobs' | 'internships' | 'learning' | 'projects' | 'bookmarks'>('feed');
  
  // Smart filters state
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterRemote, setFilterRemote] = useState<boolean>(false);
  const [filterPrice, setFilterPrice] = useState<string>('all'); // all, free, paid
  const [filterDuration, setFilterDuration] = useState<string>('all'); // all, short (<1 month), long (>=1 month)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals / Feedback state
  const [feedbackItemId, setFeedbackItemId] = useState<string | null>(null);
  const [feedbackOption, setFeedbackOption] = useState<string>('like');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/recommendations', { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to retrieve recommendations feed');
      }
      const data = await res.json();
      if (data.success) {
        setFeed(data.feed);
      } else {
        throw new Error(data.error || 'Unknown error fetching feed');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (opportunityId: string, type: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/recommendations/bookmarks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ opportunityId, type })
      });
      const data = await res.json();
      if (data.success) {
        // Toggle in local state
        if (!feed) return;
        
        const updateBookmark = <T extends { id: string; isBookmarked?: boolean }>(list: T[]): T[] => 
          list.map((item) => item.id === opportunityId ? { ...item, isBookmarked: data.bookmarked } : item);

        setFeed({
          ...feed,
          jobs: updateBookmark(feed.jobs),
          internships: updateBookmark(feed.internships),
          learning: updateBookmark(feed.learning),
          certifications: updateBookmark(feed.certifications),
          projects: updateBookmark(feed.projects),
        });
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleUpdateApplication = async (opportunityId: string, type: 'job' | 'internship', status: string, company: string, title: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/recommendations/progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'apply', opportunityId, type, status, company, title })
      });
      const data = await res.json();
      if (data.success) {
        if (!feed) return;
        
        // Update local application status
        if (type === 'job') {
          setFeed({
            ...feed,
            jobs: feed.jobs.map((j) => j.id === opportunityId ? { ...j, applicationStatus: status } : j),
            analytics: {
              ...feed.analytics,
              applicationsSubmitted: feed.analytics.applicationsSubmitted + 1
            }
          });
        } else {
          setFeed({
            ...feed,
            internships: feed.internships.map((i) => i.id === opportunityId ? { ...i, applicationStatus: status } : i),
            analytics: {
              ...feed.analytics,
              applicationsSubmitted: feed.analytics.applicationsSubmitted + 1
            }
          });
        }
      }
    } catch (err) {
      console.error('Error updating application:', err);
    }
  };

  const handleMarkComplete = async (itemId: string, type: 'course' | 'certification' | 'project') => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/recommendations/progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'complete', itemId, type, status: 'completed' })
      });
      const data = await res.json();
      if (data.success) {
        if (!feed) return;

        const setCompleted = <T extends { id: string; isCompleted?: boolean }>(list: T[]): T[] =>
          list.map((item) => item.id === itemId ? { ...item, isCompleted: true } : item);

        setFeed({
          ...feed,
          learning: type === 'course' ? setCompleted(feed.learning) : feed.learning,
          certifications: type === 'certification' ? setCompleted(feed.certifications) : feed.certifications,
          projects: type === 'project' ? setCompleted(feed.projects) : feed.projects,
          analytics: {
            ...feed.analytics,
            coursesCompleted: type === 'course' ? feed.analytics.coursesCompleted + 1 : feed.analytics.coursesCompleted,
            projectsFinished: type === 'project' ? feed.analytics.projectsFinished + 1 : feed.analytics.projectsFinished,
            careerScoreImprovement: feed.analytics.careerScoreImprovement + (type === 'course' ? 3 : 4)
          }
        });
      }
    } catch (err) {
      console.error('Error marking as complete:', err);
    }
  };

  const handleIgnoreRecommendation = async (opportunityId: string, type: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/recommendations/progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'ignore', opportunityId })
      });
      const data = await res.json();
      if (data.success) {
        // Filter out of local state
        if (!feed) return;
        setFeed({
          ...feed,
          jobs: feed.jobs.filter((item) => item.id !== opportunityId),
          internships: feed.internships.filter((item) => item.id !== opportunityId),
          learning: feed.learning.filter((item) => item.id !== opportunityId),
          certifications: feed.certifications.filter((item) => item.id !== opportunityId),
          projects: feed.projects.filter((item) => item.id !== opportunityId),
        });
      }
    } catch (err) {
      console.error('Error ignoring item:', err);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackItemId) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      await fetch('/api/recommendations/progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'feedback', opportunityId: feedbackItemId, feedback: feedbackOption })
      });
      setFeedbackItemId(null);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  // Filtering helpers
  const filterList = <T extends { title?: string; name?: string; description?: string; difficulty?: string; difficultyLevel?: string; type?: string; cost?: number; duration?: string }>(
    list: T[]
  ): T[] => {
    return list.filter((item) => {
      // Search match
      const titleText = (item.title || item.name || '').toLowerCase();
      const descText = (item.description || '').toLowerCase();
      const matchesSearch = titleText.includes(searchQuery.toLowerCase()) || descText.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Difficulty match
      const diff = (item.difficulty || item.difficultyLevel || '').toLowerCase();
      if (filterDifficulty !== 'all') {
        if (filterDifficulty === 'beginner' && !(diff.includes('beginner') || diff.includes('entry'))) return false;
        if (filterDifficulty === 'intermediate' && !(diff.includes('intermediate') || diff.includes('mid'))) return false;
        if (filterDifficulty === 'advanced' && !(diff.includes('advanced') || diff.includes('senior'))) return false;
      }

      // Remote match
      if (filterRemote && item.type && !item.type.toLowerCase().includes('remote')) return false;

      // Price match
      if (filterPrice !== 'all') {
        const isFree = item.cost === 0 || item.cost === undefined;
        if (filterPrice === 'free' && !isFree) return false;
        if (filterPrice === 'paid' && isFree) return false;
      }

      // Duration match
      if (filterDuration !== 'all') {
        const dur = (item.duration || '').toLowerCase();
        const isLong = dur.includes('weeks') || dur.includes('months');
        if (filterDuration === 'short' && isLong) return false;
        if (filterDuration === 'long' && !isLong) return false;
      }

      return true;
    });
  };

  const filteredJobs = feed ? filterList(feed.jobs) : [];
  const filteredInternships = feed ? filterList(feed.internships) : [];
  const filteredCourses = feed ? filterList(feed.learning) : [];
  const filteredCerts = feed ? filterList(feed.certifications) : [];
  const filteredProjects = feed ? filterList(feed.projects) : [];

  // Bookmarked count helper
  const allBookmarkedCount = feed 
    ? [...feed.jobs, ...feed.internships, ...feed.learning, ...feed.certifications, ...feed.projects].filter(i => i.isBookmarked).length
    : 0;

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', tracking: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Execution Layer</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>Recommendation Hub</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Transforming Career Intelligence into immediate action. Continuous jobs, internships, coursework, certifications, and portfolio projects matched to your coding profile.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,95,160,0.08)', border: '1px solid rgba(255,95,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="loading-spinner" style={{ border: '3px solid rgba(168,85,247,0.1)', borderTop: '3px solid var(--accent-clay)', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Personalizing execution layer items...</p>
        </div>
      ) : feed ? (
        <div className="animate-fade-up">
          {/* 1. Quick Stats Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="quiz-card" style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)', border: '1px solid rgba(212, 163, 115, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Applications</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{feed.analytics.applicationsSubmitted}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Submitted & Tracked</div>
            </div>
            <div className="quiz-card" style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)', border: '1px solid rgba(212, 163, 115, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Courses Completed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{feed.analytics.coursesCompleted}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Gained missing skills</div>
            </div>
            <div className="quiz-card" style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)', border: '1px solid rgba(212, 163, 115, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projects Finished</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{feed.analytics.projectsFinished}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Added to GitHub</div>
            </div>
            <div className="quiz-card" style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)', border: '1px solid rgba(212, 163, 115, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certification Progress</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{feed.analytics.certificationProgress}%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Catalog ROI completion</div>
            </div>
            <div className="quiz-card" style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)', border: '1px solid rgba(212, 163, 115, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Career Boost</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>+{feed.analytics.careerScoreImprovement}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Readiness Score Delta</div>
            </div>
          </div>

          {/* 2. Top Banner AI Suggestion */}
          {feed.jobs.length > 0 && (
            <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(212, 163, 115, 0.12), rgba(15, 13, 11, 0.95))', border: '1px solid rgba(212, 163, 115, 0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-clay)', fontWeight: 600, fontSize: '0.9rem' }}>
                <span>🤖</span>
                <span>AI SUGGESTED NEXT STEP</span>
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Your best match today is <strong>{feed.jobs[0].title}</strong> at <strong>{feed.jobs[0].company}</strong> ({feed.jobs[0].matchPercentage}% skill compatibility). 
                We recommend reviewing the <strong>{feed.projects[0]?.title}</strong> project to close missing skill gaps like <strong>{feed.jobs[0].missingSkills.slice(0, 2).join(', ') || 'System Design'}</strong>.
              </p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="difficulty-selector" style={{ marginBottom: '1.5rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', overflowX: 'auto', gap: '0.25rem' }}>
            <button className={`difficulty-option ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')} style={{ flex: 1, whiteSpace: 'nowrap' }}>🔥 Feed Overview</button>
            <button className={`difficulty-option ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')} style={{ flex: 1, whiteSpace: 'nowrap' }}>💼 Jobs ({filteredJobs.length})</button>
            <button className={`difficulty-option ${activeTab === 'internships' ? 'active' : ''}`} onClick={() => setActiveTab('internships')} style={{ flex: 1, whiteSpace: 'nowrap' }}>🎓 Internships ({filteredInternships.length})</button>
            <button className={`difficulty-option ${activeTab === 'learning' ? 'active' : ''}`} onClick={() => setActiveTab('learning')} style={{ flex: 1, whiteSpace: 'nowrap' }}>📚 Coursework ({filteredCourses.length + filteredCerts.length})</button>
            <button className={`difficulty-option ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')} style={{ flex: 1, whiteSpace: 'nowrap' }}>💡 Projects ({filteredProjects.length})</button>
            <button className={`difficulty-option ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')} style={{ flex: 1, whiteSpace: 'nowrap' }}>🔖 Bookmarked ({allBookmarkedCount})</button>
          </div>

          {/* Smart Filters Bar */}
          <div className="quiz-card" style={{ padding: '1rem', background: 'rgba(20, 18, 16, 0.55)', border: '1px solid rgba(212, 163, 115, 0.08)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1 }}>
              <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                  <option value="all">Any Difficulty</option>
                  <option value="beginner">Beginner / Entry</option>
                  <option value="intermediate">Intermediate / Mid</option>
                  <option value="advanced">Advanced / Senior</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
                <select value={filterPrice} onChange={(e) => setFilterPrice(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                  <option value="all">Any Cost</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
                <select value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                  <option value="all">Any Duration</option>
                  <option value="short">Short-term (&lt; 1 month)</option>
                  <option value="long">Long-term (1+ months)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={filterRemote} onChange={(e) => setFilterRemote(e.target.checked)} />
                <span>Remote Only</span>
              </label>
            </div>
            <div style={{ position: 'relative', width: '220px' }}>
              <input 
                type="text" 
                placeholder="Search matching titles, skills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '100%', border: '1px solid rgba(212,163,115,0.15)' }}
              />
            </div>
          </div>

          {/* Tab Content Rendering */}
          <div style={{ minHeight: '300px' }}>

            {/* TAB: FEED OVERVIEW */}
            {activeTab === 'feed' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* Top Job Summary */}
                  <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(25, 23, 21, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-clay)' }}>💼 Top Job Opportunity</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match Feed</span>
                    </div>
                    {feed.jobs.length > 0 ? (
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{feed.jobs[0].title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feed.jobs[0].company} • {feed.jobs[0].location}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Relevance Score</span>
                          <span style={{ color: 'var(--accent-clay)', fontWeight: 600 }}>{feed.jobs[0].scores.overall}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(212,163,115,0.1)', borderRadius: '2px', marginTop: '0.25rem' }}>
                          <div style={{ width: `${feed.jobs[0].scores.overall}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '2px' }}></div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => setActiveTab('jobs')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-clay)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>View all Jobs →</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No job recommendations available.</p>
                    )}
                  </div>

                  {/* Top Internship Summary */}
                  <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(25, 23, 21, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-clay)' }}>🎓 Top Internship</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Path</span>
                    </div>
                    {feed.internships.length > 0 ? (
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{feed.internships[0].title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feed.internships[0].company} • {feed.internships[0].location}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Compatibility Tier</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{feed.internships[0].tier}</span>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => setActiveTab('internships')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-clay)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>View all Internships →</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No internships found.</p>
                    )}
                  </div>

                  {/* Top Project/Course Summary */}
                  <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(25, 23, 21, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-clay)' }}>💡 Top Skill Gap Project</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Prep</span>
                    </div>
                    {feed.projects.length > 0 ? (
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{feed.projects[0].title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Difficulty: {feed.projects[0].difficulty} • {feed.projects[0].estimatedTime}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Expected Impact</span>
                          <span style={{ color: 'var(--accent-clay)', fontWeight: 600 }}>High Impact</span>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => setActiveTab('projects')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-clay)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>View all Projects →</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No projects suggested.</p>
                    )}
                  </div>

                </div>

                {/* Feed Table List */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1rem' }}>Today's Best Matches</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[...feed.jobs.slice(0, 2), ...feed.internships.slice(0, 1), ...feed.learning.slice(0, 2)].map((item: any, idx) => (
                    <div className="quiz-card" key={`feed_item_${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(25, 23, 21, 0.25)', borderLeft: '3px solid var(--accent-clay)' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'rgba(212,163,115,0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {'company' in item ? ('stipend' in item ? 'Internship' : 'Job') : 'Course'}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '0.4rem' }}>{item.title || item.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.company || item.provider}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{item.scores?.overall || 85}%</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: JOBS */}
            {activeTab === 'jobs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredJobs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No jobs match your filter criteria.</p>
                ) : (
                  filteredJobs.map((job) => (
                    <div className="quiz-card" key={job.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: job.eligibility.status === 'Eligible' ? '4px solid #10b981' : job.eligibility.status === 'Nearly Eligible' ? '4px solid #f59e0b' : '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{job.title}</h3>
                            <span style={{ background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{job.type}</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{job.provider}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{job.company} • {job.location}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{job.matchPercentage}%</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Skill Compatibility</span>
                          </div>
                          <button 
                            onClick={() => handleToggleBookmark(job.id, 'job')}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: job.isBookmarked ? 'var(--accent-clay)' : 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            🔖
                          </button>
                        </div>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.description}</p>

                      {/* Matching breakdown tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {job.strongSkills.map((s) => (
                          <span key={s} style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>✓ {s}</span>
                        ))}
                        {job.missingSkills.map((s) => (
                          <span key={s} style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>+ Lack {s}</span>
                        ))}
                      </div>

                      {/* Dynamic Compatibility Meters */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Resume Overlap:</span>
                          <span style={{ color: 'var(--text-primary)', marginLeft: '0.4rem', fontWeight: 600 }}>{job.resumeCompatibility}%</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Exp Target:</span>
                          <span style={{ color: 'var(--text-primary)', marginLeft: '0.4rem', fontWeight: 600 }}>{job.experienceRequired}y (Compatibility: {job.experienceCompatibility}%)</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Est. Compensation:</span>
                          <span style={{ color: 'var(--text-primary)', marginLeft: '0.4rem', fontWeight: 600 }}>{job.salaryEstimate}</span>
                        </div>
                      </div>

                      {/* Eligibility checker banner */}
                      <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: job.eligibility.status === 'Eligible' ? 'rgba(16,185,129,0.08)' : job.eligibility.status === 'Nearly Eligible' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: job.eligibility.status === 'Eligible' ? '1px solid rgba(16,185,129,0.2)' : job.eligibility.status === 'Nearly Eligible' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{job.eligibility.status}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{job.eligibility.reason}</span>
                        </div>
                      </div>

                      {/* User Actions: Track Application / Ignore */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="difficulty-option active" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: job.applicationStatus ? 'rgba(212,163,115,0.2)' : 'var(--accent-clay)' }}
                            onClick={() => handleUpdateApplication(job.id, 'job', 'applied', job.company, job.title)}
                            disabled={!!job.applicationStatus}
                          >
                            {job.applicationStatus ? `Tracked: ${job.applicationStatus.toUpperCase()}` : 'Apply Now'}
                          </button>
                          {job.applicationStatus && (
                            <select 
                              value={job.applicationStatus}
                              onChange={(e) => handleUpdateApplication(job.id, 'job', e.target.value, job.company, job.title)}
                              style={{ padding: '0.3rem', fontSize: '0.8rem', background: 'rgba(25,23,21,0.6)', border: '1px solid rgba(212,163,115,0.15)' }}
                            >
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => { setFeedbackItemId(job.id); setFeedbackOption('not-interested'); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Feedback
                          </button>
                          <button 
                            onClick={() => handleIgnoreRecommendation(job.id, 'job')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: INTERNSHIPS */}
            {activeTab === 'internships' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredInternships.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No internships match your filter criteria.</p>
                ) : (
                  filteredInternships.map((intern) => (
                    <div className="quiz-card" key={intern.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--accent-clay)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{intern.title}</h3>
                            <span style={{ background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{intern.duration}</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{intern.tier}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{intern.company} • {intern.location}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{intern.matchPercentage}%</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Match Rate</span>
                          </div>
                          <button 
                            onClick={() => handleToggleBookmark(intern.id, 'internship')}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: intern.isBookmarked ? 'var(--accent-clay)' : 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            🔖
                          </button>
                        </div>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{intern.description}</p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {intern.strongSkills.map((s) => (
                          <span key={s} style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>✓ {s}</span>
                        ))}
                        {intern.missingSkills.map((s) => (
                          <span key={s} style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>+ Lack {s}</span>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Stipend:</span>
                          <span style={{ color: 'var(--text-primary)', marginLeft: '0.4rem', fontWeight: 600 }}>{intern.stipend}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Academic Target:</span>
                          <span style={{ color: 'var(--text-primary)', marginLeft: '0.4rem', fontWeight: 600 }}>{intern.academicYearTarget.join(', ')}</span>
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: intern.eligibility.status === 'Eligible' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: intern.eligibility.status === 'Eligible' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', fontSize: '0.85rem' }}>
                        <strong>{intern.eligibility.status}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{intern.eligibility.reason}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="difficulty-option active" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: intern.applicationStatus ? 'rgba(212,163,115,0.2)' : 'var(--accent-clay)' }}
                            onClick={() => handleUpdateApplication(intern.id, 'internship', 'applied', intern.company, intern.title)}
                            disabled={!!intern.applicationStatus}
                          >
                            {intern.applicationStatus ? `Tracked: ${intern.applicationStatus.toUpperCase()}` : 'Apply Now'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleIgnoreRecommendation(intern.id, 'internship')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: LEARNING */}
            {activeTab === 'learning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Courses */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Personalized Online Courses</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredCourses.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No courses match your filter criteria.</p>
                    ) : (
                      filteredCourses.map((c) => (
                        <div className="quiz-card" key={c.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', background: c.isCompleted ? 'rgba(16,185,129,0.03)' : 'rgba(25,23,21,0.45)', borderLeft: c.isCompleted ? '4px solid #10b981' : '1px solid rgba(212,163,115,0.1)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-clay)', background: 'rgba(212,163,115,0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{c.provider}</span>
                              <button 
                                onClick={() => handleToggleBookmark(c.id, 'course')}
                                style={{ background: 'transparent', border: 'none', color: c.isBookmarked ? 'var(--accent-clay)' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
                              >
                                🔖
                              </button>
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.4rem' }}>{c.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{c.description}</p>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.12)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            💡 <strong>Why:</strong> {c.whyRecommended}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                            <span>⏱ {c.duration}</span>
                            <span>📊 {c.difficulty}</span>
                            <span>💵 {c.cost === 0 ? 'Free' : `₹${c.cost}`}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                            <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-clay)', textDecoration: 'none', fontWeight: 600 }}>Start Course ↗</a>
                            <button 
                              onClick={() => handleMarkComplete(c.id, 'course')}
                              disabled={c.isCompleted}
                              style={{ background: c.isCompleted ? 'transparent' : 'rgba(255,255,255,0.05)', border: 'none', color: c.isCompleted ? '#10b981' : 'var(--text-primary)', fontSize: '0.8rem', cursor: c.isCompleted ? 'default' : 'pointer', padding: '0.35rem 0.65rem', borderRadius: '4px' }}
                            >
                              {c.isCompleted ? '✓ Completed' : 'Mark Complete'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Professional Certifications</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredCerts.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No certifications matched.</p>
                    ) : (
                      filteredCerts.map((cert) => (
                        <div className="quiz-card" key={cert.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', background: 'rgba(25,23,21,0.45)', borderLeft: '1px solid rgba(212,163,115,0.1)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-clay)', background: 'rgba(212,163,115,0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{cert.provider}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>ROI: {cert.roiScore}%</span>
                                <button 
                                  onClick={() => handleToggleBookmark(cert.id, 'certification')}
                                  style={{ background: 'transparent', border: 'none', color: cert.isBookmarked ? 'var(--accent-clay)' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
                                >
                                  🔖
                                </button>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.4rem' }}>{cert.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{cert.description}</p>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.12)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            🎯 {cert.whyRecommended}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                            <span>⏱ {cert.timeInvestment}</span>
                            <span>💵 ₹{cert.cost}</span>
                            <span>📈 Demand: {cert.demandScore}/10</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-clay)', textDecoration: 'none', fontWeight: 600 }}>Planner Details ↗</a>
                            <button 
                              onClick={() => handleMarkComplete(cert.id, 'certification')}
                              disabled={cert.isCompleted}
                              style={{ background: cert.isCompleted ? 'transparent' : 'rgba(255,255,255,0.05)', border: 'none', color: cert.isCompleted ? '#10b981' : 'var(--text-primary)', fontSize: '0.8rem', cursor: cert.isCompleted ? 'default' : 'pointer', padding: '0.35rem 0.65rem', borderRadius: '4px' }}
                            >
                              {cert.isCompleted ? '✓ Obtained' : 'Mark Complete'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {filteredProjects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No projects match your filter criteria.</p>
                ) : (
                  filteredProjects.map((p) => (
                    <div className="quiz-card" key={p.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', background: 'rgba(25,23,21,0.45)', borderLeft: '1px solid rgba(212,163,115,0.1)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(212,163,115,0.15)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>{p.difficulty}</span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {p.githubReady && <span style={{ fontSize: '0.75rem', background: 'rgba(168,85,247,0.15)', color: '#c084fc', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>★ GitHub Ready</span>}
                            <button 
                              onClick={() => handleToggleBookmark(p.id, 'project')}
                              style={{ background: 'transparent', border: 'none', color: p.isBookmarked ? 'var(--accent-clay)' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
                            >
                              🔖
                            </button>
                          </div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>{p.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{p.description}</p>

                        <div style={{ background: 'rgba(212, 163, 115, 0.05)', border: '1px solid rgba(212, 163, 115, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                          🌟 <strong>Why Suggested:</strong> {p.whyRecommended}
                        </div>

                        {/* Steps to build */}
                        <div style={{ marginTop: '1rem' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Build Milestones:</h4>
                          <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {p.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ Est: {p.estimatedTime}</span>
                        <button 
                          onClick={() => handleMarkComplete(p.id, 'project')}
                          disabled={p.isCompleted}
                          style={{ background: p.isCompleted ? 'transparent' : 'var(--accent-clay)', border: 'none', color: p.isCompleted ? '#10b981' : 'var(--text-primary)', fontSize: '0.8rem', cursor: p.isCompleted ? 'default' : 'pointer', padding: '0.35rem 0.75rem', borderRadius: '4px', fontWeight: 600 }}
                        >
                          {p.isCompleted ? '✓ Completed & Added' : 'Mark Completed'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: BOOKMARKS */}
            {activeTab === 'bookmarks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {allBookmarkedCount === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No bookmarked opportunities yet. Explore other tabs and save items you like!</p>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Your Bookmarks ({allBookmarkedCount})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {[
                        ...feed.jobs.filter(j => j.isBookmarked),
                        ...feed.internships.filter(i => i.isBookmarked),
                        ...feed.learning.filter(c => c.isBookmarked),
                        ...feed.certifications.filter(cert => cert.isBookmarked),
                        ...feed.projects.filter(p => p.isBookmarked)
                      ].map((item: any) => (
                        <div className="quiz-card" key={`bookmark_${item.id}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', background: 'rgba(25,23,21,0.45)', borderLeft: '2px solid var(--accent-clay)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                {'company' in item ? ('stipend' in item ? 'Internship' : 'Job') : 'Learning'}
                              </span>
                              <button 
                                onClick={() => handleToggleBookmark(item.id, 'company' in item ? ('stipend' in item ? 'internship' : 'job') : 'course')}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-clay)', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
                              >
                                🔖
                              </button>
                            </div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '0.25rem' }}>{item.title || item.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.company || item.provider}</p>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-clay)', textDecoration: 'none', fontWeight: 600 }}>Explore Opportunity ↗</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Feedback Modal Overlay */}
          {feedbackItemId && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="quiz-card" style={{ width: '400px', maxWidth: '90%', background: 'rgba(20,18,16,0.95)', border: '1px solid var(--accent-clay)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Share Feedback</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tell us why this recommendation isn't a good fit so we can calibrate future suggestions.</p>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reason:</label>
                  <select value={feedbackOption} onChange={(e) => setFeedbackOption(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}>
                    <option value="not-interested">Not interested in this specific role</option>
                    <option value="too-hard">Prerequisites are too difficult</option>
                    <option value="too-easy">Too simple / already mastered</option>
                    <option value="low-compensation">Compensation estimate is too low</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="difficulty-option" onClick={() => setFeedbackItemId(null)}>Cancel</button>
                  <button className="difficulty-option active" style={{ background: 'var(--accent-clay)' }} onClick={handleSubmitFeedback}>Submit</button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 2rem', background: 'rgba(25, 23, 21, 0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 16, maxWidth: 500, margin: '2rem auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Profile Setup Required</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            {error || "We couldn't retrieve your recommendations feed. Please make sure your profile is fully set up and synchronized."}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => window.location.href = '/dashboard'} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
              Go to Dashboard
            </button>
            <button onClick={() => window.location.href = '/profile'} className="btn-ghost" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
              Complete Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <ProtectedRoute>
      <RecommendationsDashboard />
    </ProtectedRoute>
  );
}
