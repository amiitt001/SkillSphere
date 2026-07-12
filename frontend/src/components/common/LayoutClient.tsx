'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from '../chatbot/Chatbot';

export default function LayoutClient({
  children,
  fontClassName
}: {
  children: ReactNode;
  fontClassName?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state
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
        />

        {/* Main Content Area - ONLY this element scrolls */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            minWidth: 0,
          }}
        >
          <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Chatbot - Available on all dashboard pages */}
      {user && <Chatbot />}
    </div>
  );
}
