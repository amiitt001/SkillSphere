'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, DollarSign, TrendingUp, Award, Map, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Recommendation } from '@/types';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  career1: Recommendation;
  career2: Recommendation;
}

export default function CompareDrawer({ isOpen, onClose, career1, career2 }: CompareDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'skills'>('overview');

  // Compute growth indicator
  const getGrowthColor = (title: string) => {
    const isHigh = title.toLowerCase().match(/(ai|ml|data engineer|cloud|devops|security)/);
    return isHigh ? 'text-emerald-400 border-emerald-950 bg-emerald-950/20' : 'text-zinc-400 border-zinc-900 bg-zinc-900/40';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 right-0 z-[130] h-screen w-full sm:max-w-2xl bg-zinc-950 border-l border-zinc-900 shadow-2xl flex flex-col text-zinc-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  Compare Paths
                </span>
                <h3 className="text-xl font-bold text-white mt-2 leading-tight flex items-center gap-2">
                  <span className="text-zinc-400">{career1.title}</span>
                  <span className="text-zinc-600 text-sm">vs</span>
                  <span className="text-white">{career2.title}</span>
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Premium Tab Selectors */}
            <div className="px-6 py-3 border-b border-zinc-950 bg-zinc-900/20 flex gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'overview' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Briefcase size={13} />
                Overview & Metrics
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'roadmap' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Map size={13} />
                Learning Roadmaps
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'skills' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Award size={13} />
                Skills & Certifications
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Side-by-Side Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">{career1.title} Focus</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{career1.justification}</p>
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">{career2.title} Focus</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{career2.justification}</p>
                    </div>
                  </div>

                  {/* Core Metrics Comparison Table */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                      <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">Decision Parameters</span>
                    </div>

                    <div className="divide-y divide-zinc-900">
                      {/* Metric: Salary */}
                      <div className="p-4 grid grid-cols-3 gap-2 items-center text-xs">
                        <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                          <DollarSign size={13} className="text-zinc-500" />
                          Est. Salary
                        </span>
                        <span className="font-mono text-zinc-200">{career1.estimatedSalary || '₹8L - ₹15L'}</span>
                        <span className="font-mono text-zinc-200">{career2.estimatedSalary || '₹8L - ₹15L'}</span>
                      </div>

                      {/* Metric: Growth */}
                      <div className="p-4 grid grid-cols-3 gap-2 items-center text-xs">
                        <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-zinc-500" />
                          Growth Profile
                        </span>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${getGrowthColor(career1.title)}`}>
                            {career1.title.toLowerCase().match(/(ai|ml|data engineer|cloud|devops|security)/) ? 'High' : 'Medium'}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${getGrowthColor(career2.title)}`}>
                            {career2.title.toLowerCase().match(/(ai|ml|data engineer|cloud|devops|security)/) ? 'High' : 'Medium'}
                          </span>
                        </div>
                      </div>

                      {/* Metric: Target Employers */}
                      <div className="p-4 grid grid-cols-3 gap-2 items-start text-xs">
                        <span className="font-semibold text-zinc-400 flex items-center gap-1.5 pt-0.5">
                          <Briefcase size={13} className="text-zinc-500" />
                          Key Companies
                        </span>
                        <span className="text-zinc-300 leading-tight">{career1.keyCompanies?.join(', ') || 'Top Tech Firms'}</span>
                        <span className="text-zinc-300 leading-tight">{career2.keyCompanies?.join(', ') || 'Top Tech Firms'}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Match Overview Box */}
                  <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl space-y-2 flex items-start gap-3">
                    <ShieldCheck className="text-white shrink-0 mt-0.5" size={18} />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white">AI Compatibility Recommendation</span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Evaluate both paths based on your current skill gaps. {career1.title} requires slightly more specialized modeling experience, while {career2.title} leverages your systems engineering foundations immediately.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'roadmap' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-6"
                >
                  {/* Career 1 Roadmap */}
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold text-zinc-400 block border-b border-zinc-900 pb-2">{career1.title}</span>
                    <div className="space-y-3">
                      {career1.roadmap.map((step, idx) => (
                        <div key={idx} className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg flex gap-2">
                          <span className="w-4 h-4 shrink-0 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center font-mono mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-zinc-300 leading-tight">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Career 2 Roadmap */}
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold text-white block border-b border-zinc-900 pb-2">{career2.title}</span>
                    <div className="space-y-3">
                      {career2.roadmap.map((step, idx) => (
                        <div key={idx} className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg flex gap-2">
                          <span className="w-4 h-4 shrink-0 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center font-mono mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-zinc-300 leading-tight">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'skills' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Side-by-Side Skills and Certs */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Career 1 Gaps */}
                    <div className="space-y-4">
                      <span className="text-xs font-mono font-bold text-zinc-400 block border-b border-zinc-900 pb-2">{career1.title} Readiness</span>
                      
                      {career1.skillGapAnalysis && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-500 font-mono block">RELEVANT SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {career1.skillGapAnalysis.currentSkills.map((s, i) => (
                                <span key={i} className="bg-emerald-950/20 text-emerald-400 border border-emerald-950 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-500 font-mono block">MISSING SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {career1.skillGapAnalysis.missingSkills.map((s, i) => (
                                <span key={i} className="bg-amber-950/20 text-amber-500 border border-amber-955 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertTriangle size={10} /> {s.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-zinc-500 font-mono block">SUGGESTED CERTS</span>
                        <div className="space-y-1">
                          {career1.suggestedCertifications?.map((c, i) => (
                            <div key={i} className="text-xs text-zinc-300 flex items-center gap-1.5">
                              <span className="text-zinc-600">•</span>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Career 2 Gaps */}
                    <div className="space-y-4">
                      <span className="text-xs font-mono font-bold text-white block border-b border-zinc-900 pb-2">{career2.title} Readiness</span>
                      
                      {career2.skillGapAnalysis && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-500 font-mono block">RELEVANT SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {career2.skillGapAnalysis.currentSkills.map((s, i) => (
                                <span key={i} className="bg-emerald-950/20 text-emerald-400 border border-emerald-950 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-500 font-mono block">MISSING SKILLS</span>
                            <div className="flex flex-wrap gap-1">
                              {career2.skillGapAnalysis.missingSkills.map((s, i) => (
                                <span key={i} className="bg-amber-950/20 text-amber-500 border border-amber-955 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertTriangle size={10} /> {s.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-zinc-500 font-mono block">SUGGESTED CERTS</span>
                        <div className="space-y-1">
                          {career2.suggestedCertifications?.map((c, i) => (
                            <div key={i} className="text-xs text-zinc-300 flex items-center gap-1.5">
                              <span className="text-zinc-600">•</span>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-900 flex justify-end">
              <button
                onClick={onClose}
                className="btn-ghost py-2.5 px-6 text-xs font-semibold"
              >
                Close Comparison
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
