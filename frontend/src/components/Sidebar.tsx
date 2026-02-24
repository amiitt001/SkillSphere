/**
 * This file contains the Sidebar component.
 * It features the glassmorphism design and the 'Recent Sessions' section
 * as seen in the SkillSphere prototype.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
};

const Sidebar = ({ isOpen, onClose, isCollapsed = false }: SidebarProps) => {
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
    { href: '/history', label: 'Compare', icon: CompareIcon },
    { href: '/resume-helper', label: 'Resume AI', icon: ResumeIcon },
  ];

  const recentSessions = [
    { id: 1, title: 'Software Engineer', date: '2h ago' },
    { id: 2, title: 'Product Designer', date: '5h ago' },
    { id: 3, title: 'Data Scientist', date: 'Yesterday' },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-void/50 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-[100] bg-void/90 backdrop-blur-nav border-r border-white/5 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[260px]'
          } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10 overflow-hidden">
            <div className="w-8 h-8 min-w-[32px] bg-gradient-brand rounded-lg flex items-center justify-center font-display font-bold text-void text-sm">
              S
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-lg text-primary truncate">SkillSphere</span>
            )}
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 mb-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`nav-pill ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Recent Sessions List */}
          {!isCollapsed && (
            <div className="flex-grow overflow-y-auto no-scrollbar">
              <div className="section-label mb-4">Recent Sessions</div>
              <div className="space-y-1">
                {recentSessions.map((session) => (
                  <div key={session.id} className="session-item group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary group-hover:text-teal transition-colors">
                        {session.title}
                      </span>
                      <span className="text-[0.65rem] text-dim">{session.date}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-dim group-hover:text-teal opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User / Logout */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              onClick={handleSignOut}
              className={`nav-pill w-full hover:bg-rose/10 hover:text-rose ${isCollapsed ? 'justify-center px-0' : ''}`}
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

