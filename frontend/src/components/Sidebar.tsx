/**
 * This file contains the Sidebar component.
 * Earth-tone design with warm accents and clean navigation.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
);
const CompareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const ResumeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const QuizIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);
const ResumeAnalyzerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const ProjectIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
);
const InterviewIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
);
const ProfileIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const AggregatorIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
};

function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

const Sidebar = ({ isOpen, onClose, isCollapsed = false, onCollapseToggle }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/dashboard', label: 'Advisor', icon: DashboardIcon },
    { href: '/skill-quiz', label: 'Skill Quiz', icon: QuizIcon },
    { href: '/resume-analyzer', label: 'Resume Scan', icon: ResumeAnalyzerIcon },
    { href: '/resume-helper', label: 'Resume AI', icon: ResumeIcon },
    { href: '/project-generator', label: 'Projects', icon: ProjectIcon },
    { href: '/interview-prep', label: 'Interview', icon: InterviewIcon },
    { href: '/history', label: 'Compare', icon: CompareIcon },
    { href: '/profile', label: 'Profile', icon: ProfileIcon },
    { href: '/profile-aggregator', label: 'Aggregator', icon: AggregatorIcon },
  ];

  const [recentSessions, setRecentSessions] = useState<{ id: string; title: string; date: string }[]>([]);

  useEffect(() => {
    if (!user) {
      setRecentSessions([]);
      return;
    }

    const q = query(
      collection(db, 'history', user.uid, 'entries'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Map',
          date: formatRelativeTime(data.createdAt),
        };
      });
      setRecentSessions(sessions);
    }, (err) => {
      console.error("Error listening to history changes:", err);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      <aside
        className={`dashboard-sidebar transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          width: isCollapsed ? 72 : 250,
          minWidth: isCollapsed ? 72 : 250,
          left: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          backgroundColor: 'rgba(15, 13, 11, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(196, 112, 75, 0.08)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{ padding: isCollapsed ? '20px 12px' : '20px' }}
          className="flex flex-col h-full"
        >
          {/* Brand — click logo to toggle sidebar */}
          <div
            className="flex items-center mb-8 overflow-hidden"
            style={{
              gap: 12,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <button
              onClick={onCollapseToggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="w-8 h-8 min-w-[32px] rounded-lg flex items-center justify-center font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #e5e5e5)',
                fontFamily: 'var(--font-display)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              S
            </button>
            {!isCollapsed && (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                SkillSphere
              </span>
            )}
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`nav-pill ${isActive ? 'active' : ''}`}
                  style={{
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px 0' : '10px 16px',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Recent Sessions List — hidden when collapsed */}
          {!isCollapsed && (
            <div className="flex-grow overflow-y-auto no-scrollbar">
              <div className="section-label mb-3" style={{ fontSize: '0.65rem' }}>Recent Sessions</div>
              <div className="space-y-0.5">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/dashboard?session=${session.id}`}
                    onClick={onClose}
                    className="session-item group no-underline flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary group-hover:text-terra transition-colors">
                        {session.title}
                      </span>
                      <span className="text-[0.65rem] text-dim">{session.date}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-dim group-hover:text-terra opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
                {recentSessions.length === 0 && (
                  <p className="text-xs text-dim italic pl-1">No recent maps</p>
                )}
              </div>
            </div>
          )}

          {/* User / Logout */}
          <div className="mt-auto pt-5 border-t" style={{ borderColor: 'rgba(196, 112, 75, 0.08)' }}>
            <button
              onClick={handleSignOut}
              className="nav-pill w-full"
              style={{
                color: 'var(--text-secondary)',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '10px 16px',
              }}
              title={isCollapsed ? 'Logout' : undefined}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.background = 'rgba(196, 94, 106, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LogoutIcon />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
