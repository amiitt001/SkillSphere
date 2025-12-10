/**
 * This file contains the Sidebar component. This is the final version
 * that correctly handles the auth loading state and fixes all rendering bugs.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
// --- FIX: Using relative path to ensure module resolution ---
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
// --- FIX: Using relative path to ensure module resolution ---
import { auth } from '../lib/firebase';

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ResumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean; // Desktop collapse state
};

const Sidebar = ({ isOpen, onClose, isCollapsed = false }: SidebarProps) => {
  const pathname = usePathname();
  // --- FIX: Using the loading state from our AuthContext ---
  const { user, loading } = useAuth();

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
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/history', label: 'History', icon: HistoryIcon },
    { href: '/resume-helper', label: 'AI Resume Co-Pilot', icon: ResumeIcon },
  ];

  // --- FIX: While loading, show a skeleton UI to prevent hydration errors ---
  if (loading) {
    return (
      <aside className={`hidden md:flex ${isCollapsed ? 'w-16' : 'w-60 min-w-[15rem]'} shrink-0 flex-col bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/30 shadow-xl overflow-y-auto transition-all duration-300`}>
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700/50 rounded-lg"></div>
              {!isCollapsed && <div className="h-6 bg-slate-700/50 rounded-lg w-28"></div>}
            </div>
          </div>
          <nav className="flex-1 space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-700/50 rounded-lg"></div>
            ))}
          </nav>
          <div className="border-t border-slate-700/30 pt-4 mt-auto animate-pulse">
            <div className="h-10 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      </aside>
    );
  }

  // Once loaded, render the actual sidebar
  return (
    <>
      {/* Mobile Overlay - Only visible on mobile when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar - Collapsible on desktop, drawer on mobile */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          ${isCollapsed ? 'md:w-16' : 'w-60 md:min-w-[15rem]'} shrink-0
          flex flex-col
          bg-slate-900/95 backdrop-blur-sm text-white
          border-r border-slate-700/30 shadow-2xl
          transform transition-all duration-300 ease-out md:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* Sidebar Content Container */}
        <div className={`${isCollapsed ? 'p-2' : 'p-5'} flex-1 flex flex-col min-h-0 transition-all duration-300`}>
          {/* Logo/Brand Header */}
          <div className="mb-6 shrink-0">
            <Link href="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} group`} onClick={onClose}>
              <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-sky-500/30 group-hover:ring-sky-400/50 transition-all duration-200 shrink-0">
                <Image src="/logo.png" alt="SkillSphere" width={36} height={36} className="w-full h-full object-contain" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                  SkillSphere
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Links - Takes available space */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 rounded-lg text-sm font-medium 
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' 
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 whitespace-nowrap">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section - Auth - Sticks to bottom */}
          <div className="border-t border-slate-700/30 pt-4 mt-4 shrink-0">
            {user ? (
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600/90 hover:text-white transition-all duration-200`}
                title={isCollapsed ? 'Sign Out' : undefined}
              >
                <LogoutIcon />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            ) : (
              !isCollapsed && (
                <div className="text-xs text-slate-500 text-center py-2.5 bg-slate-800/40 rounded-lg border border-slate-700/30">
                  Please sign in
                </div>
              )
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

