'use client';

import { useState } from 'react';
import CareerCard from "@/components/CareerCard";
import LoadingSpinner from '@/components/LoadingSpinner';
import TagInput from '@/components/TagInput';
import { Recommendation } from '@/types';
import ComparisonTable from '@/components/ComparisonTable';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown'; // Import for styling the new feature's output

// Define the type for our table data
interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

export default function Home() {
  const { user } = useAuth();
  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState('');
  const [tableData, setTableData] = useState<TableRow[]>([]);

  // --- ADD THIS NEW STATE for the Resume Co-Pilot ---
  const [jobDescription, setJobDescription] = useState('');
  const [isHelping, setIsHelping] = useState(false);
  const [resumePoints, setResumePoints] = useState('');

  const handleSelectCareer = (title: string) => {
    setSelectedCareers(prevSelected => {
      if (prevSelected.includes(title)) { return prevSelected.filter(t => t !== title); }
      if (prevSelected.length < 2) { return [...prevSelected, title]; }
      return prevSelected;
    });
  };
  
  // --- ADD THIS NEW FUNCTION for the Resume Co-Pilot ---
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

  const handleSubmit = async (event: React.FormEvent) => {
    // ... This function is unchanged ...
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setRecommendations([]);
    setSelectedCareers([]);
    setComparisonSummary('');
    setTableData([]);

    try {
      const params = new URLSearchParams({ academicStream, skills: skills.join(','), interests: interests.join(',') });
      const url = `/api/generate-recommendations?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok || !response.body) { throw new Error(`Server responded with status: ${response.status}`); }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; fullResponse += decoder.decode(value); }
      const jsonMatch = fullResponse.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        const resultJson = JSON.parse(jsonString);
        setRecommendations(resultJson.recommendations);
        if (user && resultJson.recommendations.length > 0) {
          const userInput = { academicStream, skills, interests };
          await saveRecommendationToHistory(user.uid, userInput, resultJson.recommendations);
        }
      } else {
        throw new Error("No valid JSON object found in the AI response.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    // ... This function is unchanged ...
    if (selectedCareers.length !== 2) return;
    setIsComparing(true);
    setComparisonSummary('');
    setTableData([]);
    setError('');

    try {
      const params = new URLSearchParams({ career1: selectedCareers[0], career2: selectedCareers[1] });
      const url = `/api/compare-careers?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok || !response.body) { throw new Error(`Server responded with status: ${response.status}`); }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; fullResponse += decoder.decode(value); }
      const jsonMatch = fullResponse.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        const resultJson = JSON.parse(jsonString);
        setComparisonSummary(resultJson.summary);
        setTableData(resultJson.tableData);
      } else {
        throw new Error("No valid JSON object found in the AI response.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white">Personalized Recommendations</h1>
      <p className="text-slate-400 mt-2 mb-8">Powered by Google Gemini AI</p>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8">{/* ... form content ... */}</form>

      {/* ... Results Section, Compare Button, Comparison Table, and Career Cards are unchanged ... */}
      
      {/* --- ADD THIS ENTIRE NEW SECTION for the Resume Co-Pilot --- */}
      <div className="mt-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">AI Resume Co-Pilot</h2>
          <p className="text-slate-400 mb-4">Paste a job description below, and the AI will generate powerful resume bullet points based on your skills.</p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            rows={8}
            placeholder="Paste the job description here..."
          />
          <button
            onClick={handleResumeHelper}
            disabled={isHelping || !jobDescription}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isHelping ? 'Generating Points...' : 'Generate Resume Points'}
          </button>
          
          {isHelping && !resumePoints && <div className="flex justify-center py-6"><LoadingSpinner /></div>}

          {resumePoints && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-2">Suggested Resume Points:</h3>
              <div className="bg-slate-900 p-4 rounded-md">
                 <div className="prose prose-invert prose-sm">
                   <ReactMarkdown>
                   {resumePoints}
                 </ReactMarkdown>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}