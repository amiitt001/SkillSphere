/**
 * This is the main dashboard inputs page for the SkillSphere application.
 * It handles the academic background and profile form, verifies the CAPTCHA,
 * calls the recommendations API, saves the search to Firestore, and redirects
 * the user to the results page.
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TagInput from '@/components/TagInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SimpleCaptcha from '@/components/SimpleCaptcha';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

function DashboardContent() {
  // --- STATE MANAGEMENT ---
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  // State for the user's input profile
  const [academicStream, setAcademicStream] = useState('Engineering / Tech');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  const [additionalContext, setAdditionalContext] = useState('');

  // State for managing UI and API loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);

  // past session ID redirect
  useEffect(() => {
    if (sessionId) {
      router.push(`/dashboard/results?session=${sessionId}`);
    }
  }, [sessionId, router]);

  // --- HANDLER FUNCTIONS ---

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

    try {
      const params = new URLSearchParams({
        academicStream,
        skills: skills.join(','),
        interests: interests.join(','),
        additionalContext
      });
      const url = `/api/generate-recommendations?${params.toString()}`;

      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error("SkillSphere AI is currently experiencing high request volumes. Please wait a few seconds and try again.");
      }
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

        // Save to Firestore history subcollection if user is logged in
        if (user) {
          try {
            const docRef = await addDoc(collection(db, 'history', user.uid, 'entries'), {
              title: academicStream + " Career Map",
              content: JSON.stringify({
                academicStream,
                skills,
                interests,
                additionalContext,
                recommendations: resultJson.recommendations
              }),
              createdAt: serverTimestamp()
            });

            // Redirect to results page
            router.push(`/dashboard/results?session=${docRef.id}`);
          } catch (dbErr) {
            console.error("Error saving search to Firestore history:", dbErr);
            setError('Failed to save search history.');
          }
        } else {
          setError('User session not found.');
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
        <div className="progress-fill" style={{ width: '65%' }}></div>
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

      {/* ══ LOADING & ERROR AREA ══ */}
      <div className="mt-12">
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
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
