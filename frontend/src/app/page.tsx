/**
 * Landing Page for SkillSphere
 * Earth-tone hero + features + CTA using the warm design system.
 */
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative pt-16">
      {/* ══ HERO SECTION ══ */}
      <section className="hero">
        <div className="hero-badge">
          <span className="dot"></span>
          Powered by Google Gemini AI
        </div>

        <h1 className="hero-title">
          Your Career,<br />
          <span className="accent">Naturally Mapped.</span>
        </h1>

        <p className="hero-subtitle">
          Stop guessing your next move. SkillSphere turns your skills and interests into personalized career roadmaps — powered by AI, grounded in reality.
        </p>

        <div className="hero-cta">
          <Link href={user ? "/dashboard" : "/signup"} className="btn-large primary no-underline">
            {user ? "Go to Dashboard →" : "Build My Career Map →"}
          </Link>
          <button
            className="btn-large outline"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Features
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">7</div>
            <div className="stat-label">AI Tools</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--accent-amber)' }}>AI</div>
            <div className="stat-label">Powered</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--accent-sage)' }}>∞</div>
            <div className="stat-label">Possibilities</div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES SECTION ══ */}
      <section id="features">
        <div className="section-eyebrow">Core Features</div>
        <h2 className="section-heading">Everything you need to navigate your career</h2>
        <p className="section-subtext">
          Seven powerful AI tools, seamlessly integrated into one platform built for clarity.
        </p>

        <div className="features-grid mt-14">
          <Link href="/dashboard" className="feature-card anim-delay-1 no-underline">
            <div className="feature-icon icon-teal">🧭</div>
            <h3>Career Recommendations</h3>
            <p>
              AI generates 3 tailored career paths based on your academic stream, current skills, and personal interests — with salary ranges and growth outlook.
            </p>
          </Link>

          <Link href="/dashboard" className="feature-card anim-delay-2 no-underline">
            <div className="feature-icon icon-cyan">⚖️</div>
            <h3>Side-by-Side Comparison</h3>
            <p>
              Pick any two career paths and get a detailed AI-generated comparison table covering salary, growth, required skills, and work-life balance.
            </p>
          </Link>

          <Link href="/resume-helper" className="feature-card anim-delay-3 no-underline">
            <div className="feature-icon icon-gold">📝</div>
            <h3>Resume Co-Pilot</h3>
            <p>
              Paste a job description and receive powerful, ATS-optimized resume bullet points tailored specifically to your unique skill set.
            </p>
          </Link>

          <div className="feature-card anim-delay-4">
            <div className="feature-icon icon-rose">🔐</div>
            <h3>Secure Authentication</h3>
            <p>
              Sign in with your Google account via Firebase. Your career history and recommendations are saved privately and securely in the cloud.
            </p>
          </div>

          <Link href="/skill-quiz" className="feature-card anim-delay-1 no-underline">
            <div className="feature-icon icon-purple">🧩</div>
            <h3>Skill Assessment Quiz</h3>
            <p>
              AI-generated quizzes to test your knowledge across skills. Get a radar chart, weak area analysis, and personalized learning recommendations.
            </p>
          </Link>

          <Link href="/resume-analyzer" className="feature-card anim-delay-2 no-underline">
            <div className="feature-icon icon-emerald">📊</div>
            <h3>Resume Analyzer</h3>
            <p>
              Get your resume&apos;s ATS score, bullet-by-bullet analysis, missing skills detection, and AI-rewritten professional summaries.
            </p>
          </Link>

          <Link href="/project-generator" className="feature-card anim-delay-3 no-underline">
            <div className="feature-icon icon-blue">🛠️</div>
            <h3>AI Project Generator</h3>
            <p>
              Generate portfolio-worthy projects with tech stacks, architectures, feature lists, and resume-ready descriptions tailored to your career.
            </p>
          </Link>

          <Link href="/interview-prep" className="feature-card anim-delay-4 no-underline">
            <div className="feature-icon icon-gold">🎤</div>
            <h3>Interview Prep</h3>
            <p>
              Practice with AI-generated technical, behavioral, and coding questions. Get instant feedback with scoring on structure, clarity, and depth.
            </p>
          </Link>
        </div>
      </section>

      {/* ══ CTA SECTION ══ */}
      <section className="py-24 mb-20 text-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="glass p-12 max-w-4xl mx-auto" style={{ boxShadow: 'var(--glow-terra)' }}>
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>Get Started Today</div>
          <h2 className="section-heading">Ready to find your perfect career?</h2>
          <p className="section-subtext mx-auto" style={{ marginBottom: '2.5rem' }}>
            Join thousands of users who have discovered their ideal career path with SkillSphere AI.
          </p>
          <Link href={user ? "/dashboard" : "/signup"} className="btn-large primary no-underline">
            Get Started Now →
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem', position: 'relative', zIndex: 1 }}>
        <p>© 2026 SkillSphere · Built with <span style={{ color: 'var(--text-secondary)' }}>Next.js</span> · Powered by <span style={{ color: 'var(--text-secondary)' }}>Google Gemini AI</span></p>
      </footer>
    </div>
  );
}
