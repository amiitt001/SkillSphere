/**
 * This file contains the TagInput component, a reusable UI element for
 * entering a list of tags or skills.
 */
'use client';

import React, { useState } from 'react';

// --- TYPE DEFINITION ---
type TagInputProps = {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder: string;
};

/**
 * A custom input component that allows users to enter a list of tags.
 * Tags can be added by pressing Enter or Comma, and removed by clicking a button.
 */
const TagInput = ({ tags, setTags, placeholder }: TagInputProps) => {
    // --- STATE MANAGEMENT ---
    const [inputValue, setInputValue] = useState('');

    /**
     * Handles the keydown event on the input field to add a new tag.
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const newTag = inputValue.trim();

            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    /**
     * Removes a specific tag from the tags array.
     */
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // --- RENDER ---
    return (
        <div className="tag-input-container">
            {/* Existing Tags */}
            {tags.map((tag, index) => (
                <div key={index} className="tag">
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

            {/* Input field */}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-grow outline-none bg-transparent border-none p-0 text-sm font-body text-primary min-w-[120px]"
            />
        </div>
    );
};

export default TagInput;
