/**
 * This file contains the frontend logic and UI for the "AI Resume Co-Pilot" page.
 * It allows users to input a job description, sends it to a backend API along with
 * their skills, and streams the AI-generated resume bullet points back to the screen.
 */
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import SimpleCaptcha from '@/components/SimpleCaptcha';

function ResumeHelperContent() {
  // --- STATE MANAGEMENT ---
  const [skills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [jobDescription, setJobDescription] = useState('');
  const [isHelping, setIsHelping] = useState(false);
  const [resumePoints, setResumePoints] = useState('');
  const [error, setError] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);

  const handleResumeHelper = async () => {
    if (!jobDescription) return;

    if (!isCaptchaVerified) {
      setShowCaptchaModal(true);
      return;
    }

    setIsHelping(true);
    setResumePoints('');
    setError('');

    try {
      const response = await fetch('/api/resume-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, jobDescription }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value);
        setResumePoints((prev) => prev + decodedChunk);
      }
      setIsCaptchaVerified(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsHelping(false);
    }
  };

  const handleCaptchaVerify = (verified: boolean) => {
    if (verified) {
      setIsCaptchaVerified(true);
      setShowCaptchaModal(false);
      setTimeout(() => {
        handleResumeHelper();
      }, 100);
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-4xl mx-auto py-8 lg:py-12">
      <div className="mb-10 animate-fade-in">
        <div className="section-label mb-2">Resume Co-pilot</div>
        <h1 className="text-4xl font-display font-bold text-primary leading-tight">
          Optimization <span className="text-teal">Assistant</span>
        </h1>
        <p className="text-secondary mt-3">
          Paste a job description below. SkillSphere AI will analyze your profile and generate high-impact, ATS-friendly bullet points tailored for the role.
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[300px]"
              placeholder="E.g. 'We are looking for a Software Engineer with experience in Python and cloud infrastructure...'"
            />
          </div>

          <div className="form-footer">
            <button
              onClick={handleResumeHelper}
              disabled={isHelping || !jobDescription}
              className="btn-primary py-3 px-10 shadow-glow-teal"
            >
              {isHelping ? '⟳ Generating Impact Points...' : 'Generate AI Resume Points →'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-16">
        {isHelping && !resumePoints && (
          <div className="loader">
            <div className="loader-dots">
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
            </div>
            <span className="ml-2 text-secondary">Analyzing job description and mapping skills...</span>
          </div>
        )}

        {error && (
          <div className="glass p-8 border-rose/30 text-rose text-center mb-10">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {resumePoints && (
          <div className="animate-fade-up">
            <div className="results-header mb-8">
              <div className="section-label">AI Impact Points</div>
              <h2 className="text-2xl font-display font-bold">Recommended Bullet Points</h2>
            </div>
            <div className="glass p-8 border-teal/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal opacity-50"></div>
              <div className="prose prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-li:my-2">
                <ReactMarkdown>{resumePoints}</ReactMarkdown>
              </div>
              <button
                className="mt-8 text-xs font-bold uppercase tracking-widest text-teal hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(resumePoints);
                  alert('Copied to clipboard!');
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
                </svg>
                Copy to Clipboard
              </button>
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

            <div className="text-3xl mb-4">✍️</div>
            <h3 className="modal-title">Security Verification</h3>
            <p className="modal-sub">Please verify you&apos;re human before generating resume points</p>

            <SimpleCaptcha onVerify={handleCaptchaVerify} isModal={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumeHelperPage() {
  return (
    <ProtectedRoute>
      <ResumeHelperContent />
    </ProtectedRoute>
  );
}
