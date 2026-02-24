/**
 * This file contains the Header component for the SkillSphere application.
 * It is responsible for displaying the navigation, logo, and authentication component.
 */
'use client';

import React from 'react';
import Auth from './Auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- TYPE DEFINITION ---
type HeaderProps = {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
  onCollapseToggle?: () => void;
  isCollapsed?: boolean;
};

// --- SVG ICONS ---
const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Header = ({ onMenuClick, sidebarOpen = false, onCollapseToggle, isCollapsed = false }: HeaderProps) => {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/history') || pathname.startsWith('/resume-helper');

  // --- RENDER ---
  return (
    <nav className="fixed top-0 left-0 right-0 h-[72px] flex items-center justify-between px-4 sm:px-10 z-[100] bg-void/75 backdrop-blur-nav border-b border-white/5">
      <div className="flex items-center gap-10">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 bg-gradient-brand rounded-[10px] flex items-center justify-center font-display font-bold text-void shadow-[0_0_20px_rgba(0,229,195,0.4)] group-hover:scale-105 transition-transform duration-300">
            S
          </div>
          <span className="font-display text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            SkillSphere
          </span>
        </Link>

        {/* Navigation Links - Hidden on mobile, visible on desktop landing */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className={`text-sm font-medium tracking-wide transition-colors ${pathname === '/' ? 'text-teal' : 'text-secondary hover:text-teal'}`}>
              Home
            </Link>
            <Link href="/dashboard" className={`text-sm font-medium tracking-wide transition-colors ${pathname === '/dashboard' ? 'text-teal' : 'text-secondary hover:text-teal'}`}>
              Advisor
            </Link>
            <Link href="/history" className="text-sm font-medium tracking-wide text-secondary hover:text-teal transition-colors">
              History
            </Link>
            <Link href="/resume-helper" className={`text-sm font-medium tracking-wide transition-colors ${pathname === '/resume-helper' ? 'text-teal' : 'text-secondary hover:text-teal'}`}>
              Resume AI
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Menu toggle button - visible only on mobile/dashboard context */}
        {isDashboard && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-secondary hover:text-teal hover:bg-white/5 rounded-lg transition-all"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        )}

        {/* Authentication component */}
        <Auth />
      </div>
    </nav>
  );
};

export default Header;
