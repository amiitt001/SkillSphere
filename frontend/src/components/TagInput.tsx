'use client';

import React, { useState } from 'react';

// A simple SVG icon for the 'x' button on each tag
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Define the props our component will accept
type TagInputProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
};

const TagInput = ({ tags, setTags, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');

  // This function handles adding a new tag when Enter or Comma is pressed
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Prevent the form from submitting
      const newTag = inputValue.trim();

      // Add the new tag if it's not empty and not already in the list
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue(''); // Clear the input field for the next tag
    }
  };

  // This function handles removing a tag when its 'x' button is clicked
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus-within:ring-2 focus-within:ring-sky-500 flex flex-wrap gap-2 items-center min-h-[44px]">
        {/* Map over the tags array and display each tag as a badge */}
        {tags.map((tag, index) => (
          <span key={index} className="bg-sky-600 text-white text-sm font-medium px-2.5 py-1 rounded-md flex items-center gap-2">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-sky-200 hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              <XIcon />
            </button>
          </span>
        ))}
        {/* The actual input field */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent flex-grow outline-none text-sm"
        />
      </div>
    </div>
  );
};

export default TagInput;
