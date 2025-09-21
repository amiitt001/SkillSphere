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
        <div className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus-within:ring-2 focus-within:ring-sky-500 flex flex-wrap gap-2 items-center min-h-[44px]">
            
            {/* Render a badge for each existing tag */}
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
            
            {/* The actual text input field */}
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''} // Only show placeholder when empty
            className="bg-transparent flex-grow outline-none text-sm"
            />
        </div>
        </div>
    );
    };

    export default TagInput;
