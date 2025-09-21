/**
 * This file contains the Header component for the SkillSphere application.
 * It is responsible for displaying the mobile "hamburger" menu and the
 * main authentication component.
 */
'use in client';

import React from 'react';
import Auth from './Auth'; // The authentication component (Sign in/User Profile)

// --- SVG ICON ---

/**
 * A simple, stateless functional component for the "hamburger" menu icon.
 */
const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// --- TYPE DEFINITION ---

/**
 * Defines the props required by the Header component.
 */
type HeaderProps = {
  onMenuClick: () => void; // A callback function to open the mobile sidebar.
};

/**
 * The main Header component. It is displayed at the top of the content area
 * and provides navigation controls.
 * @param {HeaderProps} props The props for the component.
 * @returns The header element.
 */
const Header = ({ onMenuClick }: HeaderProps) => {
  // --- RENDER ---
  return (
    <header className="flex justify-between items-center p-4 border-b border-slate-700 md:justify-end">
      
      {/* Hamburger Menu Button */}
      {/* This button is only visible on mobile screens (it is hidden on medium screens and up). */}
      {/* Clicking it calls the onMenuClick function passed down from the root layout. */}
      <button 
        onClick={onMenuClick} 
        className="md:hidden text-white p-2 rounded-md hover:bg-slate-700"
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Authentication Component */}
      {/* This component handles the entire login/logout flow and user display. */}
      <Auth />
    </header>
  );
};

export default Header;
