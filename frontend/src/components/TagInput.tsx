    /**
     * This file contains the TagInput component, a reusable UI element for
     * entering a list of tags or skills.
     */
    'use client';

    import React, { useState } from 'react';

    // --- SVG ICON ---
    const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
    );

    // --- TYPE DEFINITION ---
    /**
     * Defines the props required by the TagInput component.
     */
    type TagInputProps = {
    tags: string[]; // The current array of tags.
    setTags: (tags: string[]) => void; // A callback function to update the tags array.
    placeholder: string; // Placeholder text to display when the input is empty.
    };

    /**
     * A custom input component that allows users to enter a list of tags.
     * Tags can be added by pressing Enter or Comma, and removed by clicking a button.
     */
    const TagInput = ({ tags, setTags, placeholder }: TagInputProps) => {
    // --- STATE MANAGEMENT ---
    // Local state to manage the value of the text input field.
    const [inputValue, setInputValue] = useState('');

    /**
     * Handles the keydown event on the input field to add a new tag.
     * @param event The React keyboard event.
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Add the tag when the user presses 'Enter' or ','
        if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault(); // Prevents the default form submission behavior.
        const newTag = inputValue.trim();

        // Add the new tag only if it's not empty and not a duplicate.
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }
        setInputValue(''); // Clear the input field for the next tag.
        }
    };

    /**
     * Removes a specific tag from the tags array.
     * @param tagToRemove The tag string to be removed.
     */
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // --- RENDER ---
    return (
        <div>
        <div className="w-full bg-gradient-to-r from-slate-700/40 to-slate-700/20 text-white rounded-lg p-3 border border-slate-600/50 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500/50 flex flex-wrap gap-2 items-center min-h-[50px] transition-all duration-300 shadow-sm">
            
            {/* Render a badge for each existing tag */}
            {tags.map((tag, index) => (
            <span key={index} className="bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-md hover:shadow-sky-500/50 transition-all duration-200">
                {tag}
                <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-sky-100 hover:text-white transition-colors"
                aria-label={`Remove ${tag}`}
                >
                <XIcon />
                </button>
            </span>
            ))}
            
            {/* The actual text input field */}
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''} // Only show placeholder when empty
            className="bg-transparent flex-grow outline-none text-sm placeholder-slate-400"
            />
        </div>
        </div>
    );
    };

    export default TagInput;
