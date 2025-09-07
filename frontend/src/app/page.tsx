'use client';

import { useState } from 'react';
import CareerCard from "@/components/CareerCard";
import { Recommendation } from '@/types';
import { fetchRecommendations, saveRecommendationToHistory } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner'; // 1. Import the new component

export default function Home() {
  const { user } = useAuth(); 

  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState('Python, JavaScript, SQL');
  const [interests, setInterests] = useState('AI Ethics, Open Source');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setRecommendations([]);

    const skillsArray = skills.split(',').map(s => s.trim());
    const interestsArray = interests.split(',').map(i => i.trim());

    try {
      const newRecommendations = await fetchRecommendations(academicStream, skillsArray, interestsArray);
      setRecommendations(newRecommendations);

      if (user && newRecommendations.length > 0) {
        const userInput = { academicStream, skills: skillsArray, interests: interestsArray };
        await saveRecommendationToHistory(user.uid, userInput, newRecommendations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white">Personalized Recommendations</h1>
      <p className="text-slate-400 mt-2 mb-8">Powered by Google Gemini AI</p>

      {/* Input Form (no changes here) */}
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Academic Stream</label>
            <input 
              type="text"
              value={academicStream}
              onChange={(e) => setAcademicStream(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Skills (comma-separated)</label>
            <input 
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Interests (comma-separated)</label>
            <input 
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
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

      {/* --- THIS IS THE UPDATED RESULTS SECTION --- */}
      <div className="mt-8">
        {isLoading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        )}
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

