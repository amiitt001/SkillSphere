'use client';

import { useState } from 'react';
import CareerCard from "@/components/CareerCard";
import LoadingSpinner from '@/components/LoadingSpinner';
import TagInput from '@/components/TagInput';
import { Recommendation } from '@/types';
import ComparisonTable from '@/components/ComparisonTable';


interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

export default function Home() {
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

  const handleSelectCareer = (title: string) => {
    setSelectedCareers(prevSelected => {
      if (prevSelected.includes(title)) { return prevSelected.filter(t => t !== title); }
      if (prevSelected.length < 2) { return [...prevSelected, title]; }
      return prevSelected;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
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

      {/* Results Section */}
      <div className="mt-8">
        {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}

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