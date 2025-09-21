/**
 * This file contains the Sidebar component, which serves as the main
 * navigation for the SkillSphere application.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// --- SVG ICON ---

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );

// --- TYPE DEFINITION ---

/**
 * Defines the props required by the Sidebar component, which are used
 * to control its visibility on mobile devices from the parent layout.
 */
type SidebarProps = {
  isOpen: boolean; // True if the mobile sidebar should be visible.
  onClose: () => void; // Callback function to close the mobile sidebar.
};

/**
 * The main Sidebar component. It displays navigation links and the user's
 * authentication status, and is designed to be responsive.
 */
const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  // --- HOOKS ---
  const pathname = usePathname(); // Hook to get the current URL path for active link styling.
  const { user } = useAuth(); // Hook to get the current user's authentication state.

  /**
   * Handles the user sign-out process using Firebase Authentication.
   */
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose(); // Close the sidebar on mobile after signing out.
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // --- DATA ---
  // A centralized array to define the navigation links, making them easy to manage.
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/resume-helper', label: 'AI Resume Co-Pilot' },
  ];

  // --- RENDER ---
  return (
    <>
      {/* Mobile Overlay: A dark background that covers the content when the sidebar is open on mobile. */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      
      {/* Sidebar container with responsive transformations */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white flex-shrink-0 p-4 flex flex-col
                  transform transition-transform duration-300 ease-in-out 
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                  md:relative md:translate-x-0 md:flex`}
      >
        {/* Header Section */}
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex-shrink-0 w-10 h-10">
              <img
                src="/logo.png"
                alt="SkillSphere Logo"
                width="40"
                height="40"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold">SkillSphere</span>
          </Link>
        </div>
        
        {/* Navigation Section */}
        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-4">
                <Link
                  href={item.href}
                  onClick={onClose}
                  // Conditionally applies styling for the active link
                  className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                    pathname === item.href ? 'bg-sky-600' : 'hover:bg-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer/Auth Section */}
        <div className="border-t border-slate-700 pt-4">
          {user ? (
            // If user is logged in, show the "Sign Out" button.
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-2 rounded-md text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogoutIcon />
              <span>Sign Out</span>
            </button>
          ) : (
            // If user is logged out, show a simple message.
            <div className="text-sm text-slate-500 text-center">Please sign in.</div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
