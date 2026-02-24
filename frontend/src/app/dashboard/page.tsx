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
  const { user } = useAuth();

  // State for the user's input profile
  const [academicStream, setAcademicStream] = useState('Engineering / Tech');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  const [additionalContext, setAdditionalContext] = useState('');

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

  const handleSelectCareer = (title: string) => {
    setSelectedCareers(prevSelected => {
      if (prevSelected.includes(title)) {
        return prevSelected.filter(t => t !== title);
      }
      if (prevSelected.length < 2) {
        return [...prevSelected, title];
      }
      return prevSelected;
    });
  };

  const handleCaptchaVerify = (verified: boolean) => {
    if (verified) {
      setIsCaptchaVerified(true);
      setShowCaptchaModal(false);
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 100);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isCaptchaVerified) {
      setShowCaptchaModal(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendations([]);
    setSelectedCareers([]);
    setComparisonSummary('');
    setTableData([]);

    try {
      const params = new URLSearchParams({
        academicStream,
        skills: skills.join(','),
        interests: interests.join(','),
        additionalContext
      });
      const url = `/api/generate-recommendations?${params.toString()}`;

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
        setRecommendations(resultJson.recommendations);
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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
    <div className="max-w-5xl mx-auto py-8 lg:py-12">
      {/* ══ STEPS INDICATOR ══ */}
      <div className="steps mb-10">
        <div className="step done">
          <div className="step-circle">✓</div>
          <div className="step-label">Background</div>
        </div>
        <div className="step-line done"></div>
        <div className="step current">
          <div className="step-circle">2</div>
          <div className="step-label">Profile</div>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <div className="step-circle">3</div>
          <div className="step-label">Results</div>
        </div>
      </div>

      <div className="progress-bar mb-12">
        <div className="progress-fill" style={{ width: recommendations.length > 0 ? '100%' : '65%' }}></div>
      </div>

      {/* ══ FORM CONTAINER ══ */}
      <div className="form-container">
        <h2 className="form-title">Tell us about yourself</h2>
        <p className="form-subtitle">The more detail you share, the more personalized your career recommendations will be.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Academic Stream</label>
              <select
                value={academicStream}
                onChange={(e) => setAcademicStream(e.target.value)}
              >
                <option>Engineering / Tech</option>
                <option>Science (PCM)</option>
                <option>Science (PCB)</option>
                <option>Commerce</option>
                <option>Arts / Humanities</option>
                <option>Design</option>
              </select>
            </div>
            <div className="form-group">
              <label>Current Status</label>
              <select>
                <option>Undergraduate (2nd Year)</option>
                <option>Post-Graduate</option>
                <option>Working Professional</option>
                <option>Recent Graduate</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Your Skills</label>
            <TagInput tags={skills} setTags={setSkills} placeholder="Type a skill and press Enter..." />
          </div>

          <div className="form-group">
            <label>Interests & Hobbies</label>
            <TagInput tags={interests} setTags={setInterests} placeholder="Type an interest and press Enter..." />
          </div>

          <div className="form-group">
            <label>Additional Context <span className="text-dim normal-case text-[0.75rem] ml-1">(optional)</span></label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any specific goals, constraints, or preferences? E.g. 'I want to work remotely' or 'I'm interested in fintech'..."
            />
          </div>

          <div className="form-footer">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary py-3 px-10 text-[0.95rem]"
            >
              {isLoading ? '⟳ Analyzing...' : 'Generate Recommendations →'}
            </button>
          </div>
        </form>
      </div>

      {/* ══ RESULTS SECTION ══ */}
      <div id="results-section" className="mt-20">
        {isLoading && (
          <div className="loader">
            <div className="loader-dots">
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
            </div>
            <span className="ml-2">SkillSphere AI is analyzing your profile...</span>
          </div>
        )}

        {error && (
          <div className="glass p-8 border-rose/30 text-rose text-center mb-10">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="results-section animate-fade-up">
            <div className="results-header">
              <div className="section-label">AI Analysis Complete</div>
              <h2 className="text-3xl font-display font-bold">Your Personalized Career Paths</h2>
            </div>

            {/* Compare button */}
            <div className="flex justify-center mb-10">
              <button
                onClick={handleCompare}
                disabled={selectedCareers.length !== 2 || isComparing}
                className="btn-primary py-2.5 px-8 shadow-glow-teal disabled:opacity-50"
              >
                {isComparing ? '⟳ Comparing...' : `Compare (${selectedCareers.length}/2 Selected)`}
              </button>
            </div>

            {isComparing && (
              <div className="loader py-10">
                <div className="loader-dots">
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                </div>
              </div>
            )}

            {/* Comparison results */}
            {!isComparing && (comparisonSummary || tableData.length > 0) && (
              <div className="glass p-8 mb-14 animate-fade-in border-white/5">
                <h2 className="text-2xl font-display font-bold text-teal mb-6">Career Comparison</h2>
                <div className="bg-teal/5 border border-teal/20 rounded-radius p-6 mb-8">
                  <div className="section-label mb-2">AI Recommendation</div>
                  <p className="text-secondary leading-relaxed">{comparisonSummary}</p>
                </div>
                <ComparisonTable
                  data={tableData}
                  career1Title={selectedCareers[0]}
                  career2Title={selectedCareers[1]}
                />
              </div>
            )}

            {/* Career cards */}
            <div className="career-cards">
              {recommendations.map((rec, index) => (
                <CareerCard
                  key={rec.title}
                  {...rec}
                  isSelected={selectedCareers.includes(rec.title)}
                  onSelect={handleSelectCareer}
                  className={`anim-delay-${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <button
              onClick={() => setShowCaptchaModal(false)}
              className="modal-close"
            >
              ✕
            </button>

            <div className="text-3xl mb-4">🚀</div>
            <h3 className="modal-title">Security Verification</h3>
            <p className="modal-sub">Please verify you&apos;re human before we generate AI recommendations</p>

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
