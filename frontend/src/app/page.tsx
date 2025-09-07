'use client'; // This makes the component interactive

import { useState } from 'react';
import CareerCard from "@/components/CareerCard";

// Define a type for our recommendation data for better code quality
type Recommendation = {
  title: string;
  justification: string;
  roadmap: string[];
};

export default function Home() {
  // State variables to hold our data
  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState('Python, JavaScript, SQL');
  const [interests, setInterests] = useState('AI Ethics, Open Source');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle the form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the page from reloading
    setIsLoading(true);
    setError('');
    setRecommendations([]);

    try {
      // Call your backend API
      const response = await fetch('https://skillsphere-backend-479787868915.asia-south1.run.app/api/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicStream,
          skills: skills.split(',').map(s => s.trim()), // Convert string to array
          interests: interests.split(',').map(i => i.trim()), // Convert string to array
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations from the server.');
      }

      const data = await response.json();
      setRecommendations(data.careerPaths);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
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

      {/* Input Form */}
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

      {/* Results Section */}
      {isLoading && <p className="text-white text-center">Loading recommendations...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
      
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
    </div>
  );
}