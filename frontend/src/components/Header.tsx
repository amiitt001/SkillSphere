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

const Header = ({ onMenuClick, sidebarOpen = false }: HeaderProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/history') || pathname.startsWith('/resume-helper') || pathname.startsWith('/profile') || pathname.startsWith('/profile-aggregator');
  const [toolsOpen, setToolsOpen] = useState(false);

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    letterSpacing: '0.025em',
    color: active ? 'var(--accent-teal)' : 'var(--text-secondary)',
    transition: 'color 0.2s',
    textDecoration: 'none',
  });

  // --- RENDER ---
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        zIndex: 100,
        backgroundColor: 'rgba(3, 4, 10, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        {/* Logo/Brand */}
        <Link href="/" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #00e5c3, #0af0ff)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700,
              color: 'var(--bg-void)',
              boxShadow: '0 0 20px rgba(0, 229, 195, 0.4)',
            }}
          >
            S
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700,
              background: 'linear-gradient(90deg, #00e5c3, #0af0ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SkillSphere
          </span>
        </Link>

        {/* Navigation Links — desktop only */}
        {!isDashboard && (
          <div className="header-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/" style={navLinkStyle(pathname === '/')}>Home</Link>
            <Link href="/dashboard" style={navLinkStyle(pathname === '/dashboard')}>Advisor</Link>

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
                  fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em',
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
                    paddingTop: 0,
                    width: 224,
                    padding: '8px 0',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(11, 18, 35, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,229,195,0.08)',
                  }}
                >
                  {[
                    { href: '/skill-quiz', icon: '🧩', label: 'Skill Quiz' },
                    { href: '/resume-analyzer', icon: '📊', label: 'Resume Analyzer' },
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
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent-teal)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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

export default Header;
