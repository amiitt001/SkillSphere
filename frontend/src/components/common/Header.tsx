/**
 * This file contains the Header component for the SkillSphere application.
 * It is responsible for displaying the navigation, logo, and authentication component.
 */
'use client';

import React, { useState } from 'react';
import Auth from './Auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// --- TYPE DEFINITION ---
type HeaderProps = {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
  onCollapseToggle?: () => void;
  isCollapsed?: boolean;
  onSidebarHideToggle?: () => void;
};

// --- SVG ICONS ---
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDown = ({ rotated }: { rotated: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
    style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: rotated ? 'rotate(180deg)' : 'none' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const Header = ({ onMenuClick, sidebarOpen = false, onCollapseToggle, isCollapsed, onSidebarHideToggle }: HeaderProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/history') || pathname.startsWith('/resume-helper') || pathname.startsWith('/profile') || pathname.startsWith('/profile-aggregator') || pathname.startsWith('/skill-quiz') || pathname.startsWith('/resume-analyzer') || pathname.startsWith('/project-generator') || pathname.startsWith('/interview-prep') || pathname.startsWith('/resume-intelligence');
  const [toolsOpen, setToolsOpen] = useState(false);

  // --- RENDER ---
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 100,
        backgroundColor: 'rgba(15, 13, 11, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(196, 112, 75, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Logo/Brand */}
        <Link href="/" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #ffffff, #e5e5e5)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
              color: '#121212',
              boxShadow: '0 0 20px rgba(196, 112, 75, 0.3)',
            }}
          >
            S
          </div>
        </Link>

        {/* Desktop Sidebar Toggle Button (similar to ChatGPT) */}
        {user && onSidebarHideToggle && (
          <button
            onClick={onSidebarHideToggle}
            title="Toggle sidebar"
            className="hidden md:flex"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
        )}


        {/* Navigation Links — desktop only */}
        {!isDashboard && (
          <div className="header-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link href="/" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: pathname === '/' ? 'var(--accent-terra)' : 'var(--text-secondary)',
              transition: 'color 0.2s', textDecoration: 'none',
            }}>Home</Link>
            <Link href="/dashboard" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: pathname === '/dashboard' ? 'var(--accent-terra)' : 'var(--text-secondary)',
              transition: 'color 0.2s', textDecoration: 'none',
            }}>Advisor</Link>

            {/* AI Tools Dropdown */}
            <div
              style={{ position: 'relative', padding: '8px 0' }}
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                AI Tools
                <ChevronDown rotated={toolsOpen} />
              </button>
              {toolsOpen && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 220,
                    padding: '6px 0',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(23, 20, 18, 0.97)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(196,112,75,0.05)',
                  }}
                >
                  {[
                    { href: '/skill-quiz', icon: '🧩', label: 'Skill Quiz' },
                    { href: '/resume-analyzer', icon: '📊', label: 'Resume Analyzer' },
                    { href: '/resume-intelligence', icon: '🧠', label: 'Resume Intelligence' },
                    { href: '/project-generator', icon: '🛠️', label: 'Project Generator' },
                    { href: '/interview-prep', icon: '🎤', label: 'Interview Prep' },
                    { href: '/resume-helper', icon: '📝', label: 'Resume Co-Pilot' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setToolsOpen(false)}
                      className="no-underline"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.15s',
                        textDecoration: 'none',
                        borderRadius: 8,
                        margin: '0 4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent-terra)';
                        e.currentTarget.style.background = 'rgba(196, 112, 75, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Global Search Bar (Ctrl+K) */}
        {user && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer w-60"
            style={{ outline: 'none' }}
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-grow text-left">Search platform...</span>
            <kbd className="text-[0.7rem] bg-white/10 px-1.5 py-0.5 rounded font-mono text-zinc-500">Ctrl K</kbd>
          </button>
        )}

        {/* AI Agent Status Indicator */}
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline font-medium">AI Active</span>
          </div>
        )}

        {/* Notification Center Dropdown */}
        {user && (
          <NotificationCenter />
        )}

        {/* Menu toggle button - dashboard context only */}
        {isDashboard && (
          <button
            onClick={onMenuClick}
            className="header-mobile-menu"
            style={{
              display: 'none', /* shown via CSS on mobile */
              padding: 8,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        )}

        {/* Sign In / Auth button */}
        {user ? (
          <Auth />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/signin" className="header-signin-link no-underline" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-secondary)', textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-gradient no-underline" style={{ textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Weekly Diagnostic Complete', message: 'Your career readiness score increased by 4 points.', category: 'Career', time: '10m ago', unread: true },
    { id: '2', title: 'Docker Gaps Identified', message: '2 recommended courses added matching your gap analysis.', category: 'Learning', time: '1h ago', unread: true },
    { id: '3', title: 'New Job Match Found', message: 'Backend Engineer at Razorpay matches your technical profile.', category: 'Jobs', time: '2h ago', unread: false },
    { id: '4', title: 'Mock Interview Evaluation', message: 'Your speech rate scored 85% on system answers.', category: 'Interview', time: '1d ago', unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div 
      style={{ position: 'relative' }}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span 
            className="absolute top-1.5 right-1.5 flex h-2 w-2"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.72rem', fontWeight: 500 }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <div key={n.id} className="notif-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {n.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{n.time}</span>
                    {n.unread && <span className="notif-dot"></span>}
                  </div>
                </div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
