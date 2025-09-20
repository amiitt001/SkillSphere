// In frontend/src/app/resume-helper/page.tsx
'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';

export default function ResumeHelperPage() {
  const { user } = useAuth();
  // We get the user's skills from the main page's state, but for this page, we'll need to fetch them or manage them differently in a real app.
  // For the hackathon, we can hardcode them or assume they are the same as the main page. Let's assume a default for now.
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [jobDescription, setJobDescription] = useState('');
  const [isHelping, setIsHelping] = useState(false);
  const [resumePoints, setResumePoints] = useState('');
  const [error, setError] = useState('');

  const handleResumeHelper = async () => {
    if (!jobDescription) return;
    setIsHelping(true);
    setResumePoints('');
    setError('');

    try {
      const response = await fetch('/api/resume-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, jobDescription }),
      });

      if (!response.ok || !response.body) { throw new Error(`Server responded with status: ${response.status}`); }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value);
        setResumePoints((prev) => prev + decodedChunk);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsHelping(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white">AI Resume Co-Pilot</h1>
      <p className="text-slate-400 mt-2 mb-8">Paste a job description below, and the AI will generate powerful resume bullet points based on your skills.</p>
      
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