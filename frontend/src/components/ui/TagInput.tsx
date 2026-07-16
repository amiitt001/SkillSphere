'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- TYPE DEFINITION ---
type TagInputProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
};

interface SkillItem {
  name: string;
  category: string;
}

const POPULAR_SKILLS: SkillItem[] = [
  { name: 'Python', category: 'Languages' },
  { name: 'JavaScript', category: 'Languages' },
  { name: 'TypeScript', category: 'Languages' },
  { name: 'Go', category: 'Languages' },
  { name: 'Rust', category: 'Languages' },
  { name: 'Java', category: 'Languages' },
  { name: 'C++', category: 'Languages' },
  { name: 'SQL', category: 'Languages' },
  { name: 'HTML', category: 'Languages' },
  { name: 'CSS', category: 'Languages' },
  { name: 'React', category: 'Frameworks & Tools' },
  { name: 'Next.js', category: 'Frameworks & Tools' },
  { name: 'Node.js', category: 'Frameworks & Tools' },
  { name: 'TensorFlow', category: 'Frameworks & Tools' },
  { name: 'PyTorch', category: 'Frameworks & Tools' },
  { name: 'Docker', category: 'Frameworks & Tools' },
  { name: 'Kubernetes', category: 'Frameworks & Tools' },
  { name: 'Git', category: 'Frameworks & Tools' },
  { name: 'AWS', category: 'Frameworks & Tools' },
  { name: 'GCP', category: 'Frameworks & Tools' },
  { name: 'PostgreSQL', category: 'Frameworks & Tools' },
  { name: 'Redis', category: 'Frameworks & Tools' }
];

const TagInput = ({ tags, setTags, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SkillItem[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter popular suggestions
  useEffect(() => {
    if (inputValue.trim() === '') {
      // Suggest not yet added popular items
      setSuggestions(POPULAR_SKILLS.filter(s => !tags.map(t => t.toLowerCase()).includes(s.name.toLowerCase())).slice(0, 8));
    } else {
      const match = POPULAR_SKILLS.filter(
        s =>
          s.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.map(t => t.toLowerCase()).includes(s.name.toLowerCase())
      );
      setSuggestions(match);
    }
    setActiveSuggestionIdx(0);
  }, [inputValue, tags]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        addTag(suggestions[activeSuggestionIdx].name);
        return;
      }
      if (event.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (newTag) {
        addTag(newTag);
      }
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !tags.map(t => t.toLowerCase()).includes(normalizedTag.toLowerCase())) {
      setTags([...tags, normalizedTag]);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div className="tag-input-container">
        {tags.map((tag, index) => (
          <div key={index} className="tag transition-all hover:scale-102">
            <span style={{ marginRight: 4 }}>
              {POPULAR_SKILLS.find(s => s.name.toLowerCase() === tag.toLowerCase())?.category === 'Languages' ? '💻' : '⚙️'}
            </span>
            {tag}
            <span
              className="tag-remove"
              onClick={() => removeTag(tag)}
              role="button"
              aria-label={`Remove ${tag}`}
            >
              ×
            </span>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-grow outline-none bg-transparent border-none p-0 text-sm font-body text-primary min-w-[120px]"
        />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="tag-autocomplete-dropdown">
          {['Languages', 'Frameworks & Tools'].map((cat) => {
            const catItems = suggestions.filter(s => s.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} style={{ padding: '4px 0' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px 2px' }}>
                  {cat}
                </div>
                {catItems.map((item) => {
                  const absoluteIdx = suggestions.indexOf(item);
                  return (
                    <div
                      key={item.name}
                      className="tag-autocomplete-item"
                      style={{
                        background: activeSuggestionIdx === absoluteIdx ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        color: activeSuggestionIdx === absoluteIdx ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => addTag(item.name)}
                    >
                      {item.name}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TagInput;
