'use client';

import { useState } from 'react';
import CareerCard from "@/components/CareerCard"; // We'll use this again!
import LoadingSpinner from '@/components/LoadingSpinner';
import TagInput from '@/components/TagInput';

// Define the structure of a single recommendation
interface Recommendation {
  title: string;
  justification: string;
  roadmap: string[];
}

export default function Home() {
  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  
  // State to hold the final, parsed recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setRecommendations([]); // Clear previous recommendations

    try {
      const params = new URLSearchParams({
        academicStream,
        skills: skills.join(','),
        interests: interests.join(','),
      });
      const url = `/api/generate-recommendations?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok || !response.body) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      // Read the stream and assemble the full string
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value);
      }
      
      // Once the stream is done, parse the complete JSON string
      const resultJson = JSON.parse(fullResponse);
      setRecommendations(resultJson.recommendations);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      console.error("Error fetching or parsing data:", message);
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
        Powered by Google Gemini AI
      </p>

      {/* Input Form (Unchanged) */}
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8">
        {/* ... your form inputs are unchanged ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Academic Stream</label><input type="text" value={academicStream} onChange={(e) => setAcademicStream(e.target.value)} className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"/></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Skills</label><TagInput tags={skills} setTags={setSkills} placeholder="Type a skill and press Enter..." /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Interests</label><TagInput tags={interests} setTags={setInterests} placeholder="Type an interest and press Enter..." /></div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
            {isLoading ? 'Generating...' : 'Get AI Recommendations'}
        </button>
      </form>

      {/* Results Section - Updated to render cards */}
      <div className="mt-8">
        {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <CareerCard
                key={index}
                title={rec.title}
                justification={rec.justification}
                roadmap={rec.roadmap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}