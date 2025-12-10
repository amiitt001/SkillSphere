/**
 * Landing Page for SkillSphere
 * A beautiful, informative homepage that welcomes users and guides them
 * to sign in and access the career recommendation features.
 */
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-block mb-6 px-4 py-2 bg-sky-500/20 border border-sky-500/50 rounded-full text-sky-300 text-sm font-semibold">
              ✨ Powered by Google Gemini AI
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
            Your AI Career Advisor
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
            Discover your perfect career path with personalized recommendations powered by advanced AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="group px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-lg text-lg transition-all shadow-lg hover:shadow-sky-500/50 transform hover:scale-105"
            >
              <span className="flex items-center gap-2 justify-center">
                {user ? "Go to Dashboard" : "Get Started"}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
            <button
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-white font-bold rounded-lg text-lg transition-colors border border-slate-600"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-transparent to-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20 hover:transform hover:scale-105">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-2xl font-bold mb-4 text-white">AI Recommendations</h3>
              <p className="text-slate-400 leading-relaxed">
                Get personalized career recommendations based on your academic stream, skills, and interests using advanced AI.
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-blue-500/0 group-hover:from-sky-500/10 group-hover:to-blue-500/10 rounded-xl transition-colors pointer-events-none"></div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20 hover:transform hover:scale-105">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Career Comparison</h3>
              <p className="text-slate-400 leading-relaxed">
                Compare two careers side-by-side to understand the differences in skills, tools, salary, and growth potential.
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-blue-500/0 group-hover:from-sky-500/10 group-hover:to-blue-500/10 rounded-xl transition-colors pointer-events-none"></div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20 hover:transform hover:scale-105">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📝</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Resume Assistant</h3>
              <p className="text-slate-400 leading-relaxed">
                Get AI-powered suggestions to improve your resume and tailor it to specific job descriptions.
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-blue-500/0 group-hover:from-sky-500/10 group-hover:to-blue-500/10 rounded-xl transition-colors pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          
          <div className="space-y-8">
            {[
              { number: 1, title: "Sign In with Google", desc: "Create an account using your Google credentials. It's quick, secure, and easy." },
              { number: 2, title: "Tell Us About Yourself", desc: "Enter your academic stream, skills, and interests. The more details you provide, the better our recommendations." },
              { number: 3, title: "Get AI Recommendations", desc: "Our AI analyzes your profile and suggests the best career paths tailored just for you." },
              { number: 4, title: "Compare & Explore", desc: "Compare careers, explore roadmaps, view salary ranges, and find the perfect fit for your future." }
            ].map((step) => (
              <div key={step.number} className="flex gap-6 group">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 group-hover:scale-110 transition-transform shadow-lg">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-r from-sky-600/20 to-blue-600/20 border-y border-sky-500/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-white">Ready to Find Your Perfect Career?</h2>
          <p className="text-xl mb-10 text-sky-100">
            Join thousands of users who have discovered their ideal career path with SkillSphere.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-10 py-4 bg-white text-sky-600 font-bold rounded-lg text-lg hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-700">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p className="mb-4 text-lg font-semibold text-white">SkillSphere</p>
          <p className="mb-2">Your AI Career Advisor</p>
          <p className="text-sm">Powered by Google Gemini AI | Built with Next.js & React</p>
        </div>
      </footer>
    </div>
  );
}


