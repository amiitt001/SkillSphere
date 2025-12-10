'use client';

import { useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Chatbot from './Chatbot';

export default function LayoutClient({ 
  children,
  fontClassName 
}: { 
  children: ReactNode;
  fontClassName: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // PUBLIC ROUTES: No sidebar, no header - just content
  if (isPublicRoute) {
    return (
      <div className={`min-h-screen bg-slate-900 ${fontClassName}`}>
        {children}
      </div>
    );
  }

  // DASHBOARD LAYOUT: Proper hierarchy with navbar at top, then flex container for sidebar + content
  return (
    <div className={`min-h-screen bg-slate-900 ${fontClassName}`}>
      {/* Top Navbar - Full width, spans entire top */}
      <Header 
        onMenuClick={toggleSidebar} 
        sidebarOpen={isSidebarOpen}
        onCollapseToggle={toggleSidebarCollapse}
        isCollapsed={isSidebarCollapsed}
      />
      
      {/* Flex Container: Sidebar + Main Content */}
      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* Sidebar - Fixed width, no shrinking, collapsible on desktop */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar}
          isCollapsed={isSidebarCollapsed}
        />
        
        {/* Main Content Area - Takes remaining space */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-900">
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
