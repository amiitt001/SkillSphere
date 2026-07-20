'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  label: string;
  category: string;
  href: string;
  shortcut?: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const commandItems: CommandItem[] = [
    { label: 'Home / Welcome', category: 'Pages', href: '/' },
    { label: 'Career Advisor diagnostics', category: 'Pages', href: '/dashboard' },
    { label: 'AI Copilot chat mentor', category: 'Pages', href: '/copilot' },
    { label: 'Career GPS analytics tracker', category: 'Pages', href: '/intelligence' },
    { label: 'AI Recommendations dashboard', category: 'Pages', href: '/recommendations' },
    { label: 'AI Resume Scan enhancer', category: 'Pages', href: '/resume-analyzer' },
    { label: 'Resume Intelligence single source of truth', category: 'Pages', href: '/resume-intelligence' },
    { label: 'Resume AI bullets assistant', category: 'Pages', href: '/resume-helper' },
    { label: 'AI Interview preparation engine', category: 'Pages', href: '/interview-prep' },
    { label: 'Interactive Skill Quiz assessment', category: 'Pages', href: '/skill-quiz' },
    { label: 'AI Project Generator templates', category: 'Pages', href: '/project-generator' },
    { label: 'Workspace integrations calendar', category: 'Pages', href: '/workspace' },
    { label: 'Profile Aggregator manager', category: 'Pages', href: '/profile-aggregator' },
    { label: 'SaaS Billing subscription plans', category: 'Pages', href: '/billing' },
    { label: 'My Profile settings', category: 'Pages', href: '/profile' },
    { label: 'History of diagnostics', category: 'Pages', href: '/history' },
    { label: '/copilot', category: 'AI Commands', href: '/copilot', shortcut: '⌘ C' },
    { label: '/quiz', category: 'AI Commands', href: '/skill-quiz', shortcut: '⌘ Q' },
    { label: '/resume', category: 'AI Commands', href: '/resume-helper', shortcut: '⌘ R' },
    { label: '/advisor', category: 'AI Commands', href: '/dashboard', shortcut: '⌘ A' }
  ];

  // Listen to keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleToggleEvent = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-command-palette', handleToggleEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-command-palette', handleToggleEvent);
    };
  }, []);

  // Filter commands
  const filtered = commandItems.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Reset active index on search change
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Handle keys when open
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        router.push(filtered[activeIndex].href);
        setIsOpen(false);
        setSearch('');
      }
    }
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={handleBackdropClick}>
      <div className="cmd-container animate-fade-up" ref={containerRef} onKeyDown={handleKeyDown}>
        <div className="cmd-input-wrap">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Type a command or search page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cmd-search-input"
            autoFocus
          />
          <span className="text-[0.7rem] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">ESC</span>
        </div>

        <div className="cmd-results">
          {filtered.length > 0 ? (
            <div>
              {/* Group items by category */}
              {['Pages', 'AI Commands'].map((cat) => {
                const catItems = filtered.filter((item) => item.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="mb-2">
                    <div className="cmd-group-title">{cat}</div>
                    {catItems.map((item) => {
                      const absoluteIndex = filtered.indexOf(item);
                      return (
                        <div
                          key={item.label}
                          className={`cmd-item ${activeIndex === absoluteIndex ? 'active' : ''}`}
                          onClick={() => {
                            router.push(item.href);
                            setIsOpen(false);
                            setSearch('');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500">
                              {cat === 'Pages' ? '📄' : '⚡'}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && (
                            <span className="cmd-shortcut">{item.shortcut}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
}
