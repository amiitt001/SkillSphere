/**
 * This file contains the Header component for the SkillSphere application.
 * It is responsible for displaying the mobile "hamburger" menu and the
 * main authentication component.
 */
'use client';

import React from 'react';
import Auth from './Auth'; // The authentication component (Sign in/User Profile)
import Link from 'next/link';

// --- SVG ICONS ---

/**
 * Hamburger menu icon for mobile navigation
 */
const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

/**
 * Close icon for sidebar toggle
 */
const CloseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- TYPE DEFINITION ---

/**
 * Defines the props required by the Header component.
 */
type HeaderProps = {
  onMenuClick: () => void; // A callback function to open/toggle the mobile sidebar.
  sidebarOpen?: boolean; // Whether the sidebar is currently open
  onCollapseToggle?: () => void; // Desktop sidebar collapse toggle
  isCollapsed?: boolean; // Desktop sidebar collapsed state
};

/**
 * Collapse/Expand icon for desktop sidebar
 */
const CollapseIcon = ({ className, isCollapsed }: { className?: string; isCollapsed?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    {isCollapsed ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    )}
  </svg>
);

/**
 * The main Header component. It is displayed at the top of the content area
 * and provides navigation controls and authentication.
 * @param {HeaderProps} props The props for the component.
 * @returns The header element.
 */
const Header = ({ onMenuClick, sidebarOpen = false, onCollapseToggle, isCollapsed = false }: HeaderProps) => {
  // --- RENDER ---
  return (
    <header className="h-[65px] flex items-center justify-between px-4 sm:px-6 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-3">
        {/* Logo/Brand - visible on all screens */}
        <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg hover:text-sky-400 transition-colors">
          <span className="text-2xl">🎯</span>
          <span className="hidden sm:inline bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            SkillSphere
          </span>
        </Link>
        
        {/* Menu toggle button - visible only on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          aria-label="Toggle sidebar"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <CloseIcon className="w-5 h-5" />
          ) : (
            <MenuIcon className="w-5 h-5" />
          )}
        </button>

        {/* Collapse toggle button - visible only on desktop */}
        {onCollapseToggle && (
          <button
            onClick={onCollapseToggle}
            className="hidden md:block p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon className="w-5 h-5" isCollapsed={isCollapsed} />
          </button>
        )}
      </div>
      
      {/* Authentication component on the right */}
      <Auth />
    </header>
  );
};

export default Header;
