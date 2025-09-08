'use client';

import React from 'react';
import Auth from './Auth'; // Your existing authentication component

// A simple SVG icon for the "hamburger" menu
const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

type HeaderProps = {
  onMenuClick: () => void; // A function to call when the menu button is clicked
};

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="flex justify-between items-center p-4 border-b border-slate-700 md:justify-end">
      {/* Hamburger Menu Button - only visible on mobile (hidden on medium screens and up) */}
      <button 
        onClick={onMenuClick} 
        className="md:hidden text-white p-2 rounded-md hover:bg-slate-700"
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Your existing Auth component for login/logout */}
      <Auth />
    </header>
  );
};

export default Header;
