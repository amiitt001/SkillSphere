'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from '../chatbot/Chatbot';
import CommandPalette from '../ui/CommandPalette';

export default function LayoutClient({
  children,
  fontClassName
}: {
  children: ReactNode;
  fontClassName?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state
  const [isSidebarHidden, setIsSidebarHidden] = useState(false); // Desktop hidden state
  const pathname = usePathname();
  const { user } = useAuth();

  // Auth-only routes that don't need header at all
  const authRoutes = ['/signin', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Landing page shows header but no sidebar
  const isLandingPage = pathname === '/';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // AUTH ROUTES: No sidebar, no header — clean auth UX
  if (isAuthRoute) {
    return (
      <div className={`min-h-screen ${fontClassName || ''}`}>
        {children}
      </div>
    );
  }

  // LANDING PAGE: Header only, no sidebar
  if (isLandingPage) {
    return (
      <div className={`min-h-screen ${fontClassName || ''}`}>
        <Header
          onMenuClick={toggleSidebar}
          sidebarOpen={isSidebarOpen}
        />
        {children}
      </div>
    );
  }

  // DASHBOARD LAYOUT: Locked viewport — body never scrolls, only <main> does
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      className={fontClassName || ''}
    >
      {/* Top Navbar - Full width, spans entire top */}
      <Header
        onMenuClick={toggleSidebar}
        sidebarOpen={isSidebarOpen}
        onCollapseToggle={toggleSidebarCollapse}
        isCollapsed={isSidebarCollapsed}
        onSidebarHideToggle={() => setIsSidebarHidden(!isSidebarHidden)}
      />

      {/* Flex Container: Sidebar + Main Content — fills remaining height */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          marginTop: '64px',
        }}
      >
        {/* Sidebar - Fixed width, never scrolls the page */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isCollapsed={isSidebarCollapsed}
          onCollapseToggle={toggleSidebarCollapse}
          isHidden={isSidebarHidden}
          onHideToggle={() => setIsSidebarHidden(true)}
        />

        {/* Main Content Area - ONLY this element scrolls */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            minWidth: 0,
            position: 'relative',
          }}
        >
          {/* Show Sidebar button if hidden (Desktop only, similar to ChatGPT) */}
          {isSidebarHidden && (
            <button
              onClick={() => setIsSidebarHidden(false)}
              title="Show sidebar"
              aria-label="Show sidebar"
              className="hidden md:flex animate-fade-in"
              style={{
                position: 'fixed',
                left: 16,
                top: 80,
                zIndex: 95,
                background: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: 8,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                width: 36,
                height: 36,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(20, 20, 20, 0.8)'; }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Chatbot & Command Palette */}
      {user && (
        <>
          <Chatbot />
          <CommandPalette />
        </>
      )}
    </div>
  );
}
