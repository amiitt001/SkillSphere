'use client';

import { useState } from 'react';
// We won't use CareerCard for the raw stream, so it can be removed if you don't use it elsewhere.
// import CareerCard from "@/components/CareerCard"; 
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import TagInput from '@/components/TagInput';

export default function Home() {
  const { user } = useAuth();

  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  
  // --- CHANGE #1: State for the streaming text ---
  // We'll store the incoming AI text in 'completion' instead of a structured 'recommendations' array.
  const [completion, setCompletion] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- CHANGE #2: The entire handleSubmit function is replaced with the streaming logic ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setCompletion(''); // Clear previous completion text

    try {
      // Start the fetch request to your backend
      const response = await fetch('/api/generate-recommendations',  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicStream, skills, interests }),
      });

      if (!response.body) {
        throw new Error('Response body is empty.');
      }

      // Get a reader and decoder to process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Read the stream in a loop
      while (true) {
        // CORRECT VERSION
const { done, value } = await reader.read();
        if (done) break; // The stream is finished

        // Decode the chunk and append it to our state
        const decodedChunk = decoder.decode(value);
        setCompletion((prev) => prev + decodedChunk);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      console.error("Error fetching streaming data:", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white">
        Personalized Recommendations
      </h1>
      <p className="text-slate-400 mt-2 mb-8">
        Your Personal AI Career Navigator - Now Deployed Automatically!
      </p>

      {/* Input Form (no changes here) */}
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Academic Stream</label>
            <input 
              type="text"
              value={academicStream}
              onChange={(e) => setAcademicStream(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
            <TagInput tags={skills} setTags={setSkills} placeholder="Type a skill and press Enter..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Interests</label>
            <TagInput tags={interests} setTags={setInterests} placeholder="Type an interest and press Enter..." />
          </div>
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Get AI Recommendations'}
        </button>
      </form>

      {/* --- CHANGE #3: The results section now displays the raw streaming text --- */}
      <div className="mt-8">
        {isLoading && !completion && (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {/* Render the completion text as it arrives */}
        {completion && (
          <div className="bg-slate-800 p-6 rounded-lg text-white">
            {/* Using a <pre> tag helps preserve formatting like newlines from the AI's response */}
            <pre className="whitespace-pre-wrap font-sans">
              {completion}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}