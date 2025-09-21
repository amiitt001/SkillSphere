/**
 * This is the main dashboard page for the SkillSphere application.
 * It handles all user input, fetches AI-powered recommendations, allows users
 * to select careers for comparison, and displays all results to the user.
 */
'use client';

import { useState } from 'react';
import CareerCard from "@/components/CareerCard";
import LoadingSpinner from '@/components/LoadingSpinner';
import TagInput from '@/components/TagInput';
import { Recommendation } from '@/types';
import ComparisonTable from '@/components/ComparisonTable';
import { useAuth } from '@/context/AuthContext';

// Define the type for the comparison table's data structure
interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

export default function Home() {
  // --- STATE MANAGEMENT ---

  const { user } = useAuth();

  // State for the user's input profile
  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);

  // State for managing UI and data fetching for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State specifically for the Career Comparison feature
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState('');
  const [tableData, setTableData] = useState<TableRow[]>([]);

  // --- HANDLER FUNCTIONS ---

  /**
   * Handles both selecting and deselecting career cards for comparison.
   * Allows a maximum of two cards to be selected at a time.
   * @param title The title of the career card that was clicked.
   */
  const handleSelectCareer = (title: string) => {
    setSelectedCareers(prevSelected => {
      if (prevSelected.includes(title)) {
        return prevSelected.filter(t => t !== title); // Deselect if already present
      }
      if (prevSelected.length < 2) {
        return [...prevSelected, title]; // Select if less than 2 are selected
      }
      return prevSelected; // Otherwise, do nothing
    });
  };

  /**
   * Main form submission handler to fetch career recommendations from the AI.
   * It calls the backend API and processes the streamed JSON response.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Reset all states for a new search
    setIsLoading(true);
    setError('');
    setRecommendations([]);
    setSelectedCareers([]);
    setComparisonSummary('');
    setTableData([]);

    try {
      // Construct the API URL with user input as search parameters
      const params = new URLSearchParams({ academicStream, skills: skills.join(','), interests: interests.join(',') });
      const url = `/api/generate-recommendations?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Read the streamed response from the server and assemble the full JSON string
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value);
      }

      // Find and parse the JSON object from the AI's potentially messy response
      const jsonMatch = fullResponse.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        const resultJson = JSON.parse(jsonString);
        setRecommendations(resultJson.recommendations);
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

  /**
   * Fetches the AI-powered comparison for the two selected careers.
   */
  const handleCompare = async () => {
    if (selectedCareers.length !== 2) return;
    setIsComparing(true);
    setComparisonSummary('');
    setTableData([]);
    setError('');

    try {
      const params = new URLSearchParams({ career1: selectedCareers[0], career2: selectedCareers[1] });
      const url = `/api/compare-careers?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value);
      }
      
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

  // --- RENDER ---

  return (
    <div>
      <h1 className="text-4xl font-bold text-white">Personalized Recommendations</h1>
      <p className="text-slate-400 mt-2 mb-8">Powered by Google Gemini AI</p>

      {/* Input form for user's profile */}
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Academic Stream</label>
            <input type="text" value={academicStream} onChange={(e) => setAcademicStream(e.target.value)} className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"/>
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
        <button type="submit" disabled={isLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
          {isLoading ? 'Generating...' : 'Get AI Recommendations'}
        </button>
      </form>

      {/* Results section: Conditionally renders loading spinners, errors, and results */}
      <div className="mt-8">
        {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {/* Compare button appears only when recommendations are visible */}
        {recommendations.length > 0 && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleCompare}
              disabled={selectedCareers.length !== 2 || isComparing}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
            >
              {isComparing ? 'Comparing...' : `Compare (${selectedCareers.length}/2 Selected)`}
            </button>
          </div>
        )}

        {isComparing && <div className="flex justify-center py-10"><LoadingSpinner /></div>}

        {/* Comparison results are displayed here */}
        {!isComparing && (comparisonSummary || tableData.length > 0) && (
          <div className="bg-slate-900 p-6 rounded-lg text-white mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Career Comparison</h2>
            <p className="text-slate-300 mb-6">{comparisonSummary}</p>
            <ComparisonTable 
              data={tableData} 
              career1Title={selectedCareers[0]}
              career2Title={selectedCareers[1]}
            />
          </div>
        )}

        {/* Recommendation cards are displayed here */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <CareerCard
                key={rec.title}
                {...rec}
                isSelected={selectedCareers.includes(rec.title)}
                onSelect={handleSelectCareer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

