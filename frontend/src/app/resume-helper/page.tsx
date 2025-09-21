/**
 * This file contains the frontend logic and UI for the "AI Resume Co-Pilot" page.
 * It allows users to input a job description, sends it to a backend API along with
 * their skills, and streams the AI-generated resume bullet points back to the screen.
 */
'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export default function ResumeHelperPage() {
  // --- STATE MANAGEMENT ---
  // Note: For this hackathon prototype, skills are hardcoded. In a full application,
  // this state would be shared from the main dashboard or a user profile.
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [jobDescription, setJobDescription] = useState('');
  const [isHelping, setIsHelping] = useState(false); // Tracks the loading state for this feature
  const [resumePoints, setResumePoints] = useState(''); // Stores the AI-generated response
  const [error, setError] = useState('');

  /**
   * Handles the form submission for the resume helper feature.
   * It calls the backend API and streams the response to the UI.
   */
  const handleResumeHelper = async () => {
    if (!jobDescription) return; // Prevent API call with empty input

    // Reset state for a new request
    setIsHelping(true);
    setResumePoints('');
    setError('');

    try {
      // Call the dedicated backend API for the resume helper
      const response = await fetch('/api/resume-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, jobDescription }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Process the streaming response from the server
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Exit loop when stream is finished
        const decodedChunk = decoder.decode(value);
        // Append each new piece of text to the state, causing a real-time update on the screen
        setResumePoints((prev) => prev + decodedChunk);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsHelping(false); // Ensure loading state is turned off
    }
  };

  // --- RENDER ---
  return (
    <div>
      {/* Page Header */}
      <h1 className="text-4xl font-bold text-white">AI Resume Co-Pilot</h1>
      <p className="text-slate-400 mt-2 mb-8">Paste a job description below, and the AI will generate powerful resume bullet points based on your skills.</p>
      
      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          rows={10}
          placeholder="Paste the job description here..."
        />
        <button
          onClick={handleResumeHelper}
          disabled={isHelping || !jobDescription}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isHelping ? 'Generating Points...' : 'Generate Resume Points'}
        </button>
        
        {/* Conditional Rendering for Error, Loading, and Results */}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        
        {isHelping && !resumePoints && <div className="flex justify-center py-6"><LoadingSpinner /></div>}

        {resumePoints && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-white mb-2">Suggested Resume Points:</h3>
            <div className="bg-slate-900 p-4 rounded-md">
               <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{resumePoints}</ReactMarkdown>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
