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
import ProtectedRoute from '@/components/ProtectedRoute';
import SimpleCaptcha from '@/components/SimpleCaptcha';

// Define the type for the comparison table's data structure
interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

function DashboardContent() {
  // --- STATE MANAGEMENT ---

  const { } = useAuth();

  // State for the user's input profile
  const [academicStream, setAcademicStream] = useState('Computer Science');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);

  // State for managing UI and data fetching for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);

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
   * Handle CAPTCHA verification from modal
   */
  const handleCaptchaVerify = (verified: boolean) => {
    if (verified) {
      setIsCaptchaVerified(true);
      setShowCaptchaModal(false);
      // Trigger form submission after verification
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 100);
    }
  };

  /**
   * Main form submission handler to fetch career recommendations from the AI.
   * It calls the backend API and processes the streamed JSON response.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Show CAPTCHA modal if not verified
    if (!isCaptchaVerified) {
      setShowCaptchaModal(true);
      return;
    }
    
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
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
          Personalized Recommendations
        </h1>
        <p className="text-slate-400 text-lg">Powered by Google Gemini AI</p>
      </div>

      {/* Input form for user's profile */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-xl mb-10 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-colors">
        <h2 className="text-xl font-bold text-white mb-6">Tell Us About Yourself</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Academic Stream</label>
            <input 
              type="text" 
              value={academicStream} 
              onChange={(e) => setAcademicStream(e.target.value)} 
              className="w-full bg-slate-700/50 text-white rounded-lg p-3 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none focus:border-transparent transition-all min-h-[44px] placeholder-slate-500" 
              placeholder="e.g., Computer Science"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Skills</label>
            <TagInput tags={skills} setTags={setSkills} placeholder="Type a skill and press Enter..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Interests</label>
            <TagInput tags={interests} setTags={setInterests} placeholder="Type an interest and press Enter..." />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-sky-500/50 text-lg"
        >
          {isLoading ? 'Generating Recommendations...' : 'Get AI Recommendations'}
        </button>
      </form>

      {/* Results section */}
      <div className="mt-12">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-slate-400 text-lg">Analyzing your profile...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-red-400 text-center">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {/* Compare button appears only when recommendations are visible */}
        {recommendations.length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleCompare}
              disabled={selectedCareers.length !== 2 || isComparing}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/50 text-lg"
            >
              {isComparing ? 'Comparing...' : `Compare (${selectedCareers.length}/2 Selected)`}
            </button>
          </div>
        )}

        {isComparing && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-slate-400 text-lg">Comparing careers...</p>
            </div>
          </div>
        )}

        {/* Comparison results are displayed here */}
        {!isComparing && (comparisonSummary || tableData.length > 0) && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-xl text-white mb-10 border border-slate-700/50 shadow-lg">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">Career Comparison</h2>
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">{comparisonSummary}</p>
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

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowCaptchaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-2">Security Verification</h3>
            <p className="text-slate-400 mb-6">Please verify you're human before we generate AI recommendations</p>
            
            <SimpleCaptcha onVerify={handleCaptchaVerify} isModal={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
