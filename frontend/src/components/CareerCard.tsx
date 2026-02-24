/**
 * This file contains the CareerCard component, a reusable UI element
 * for displaying a single AI-generated career recommendation.
 */
import React from 'react';
import { Recommendation } from '@/types';

// --- TYPE DEFINITION ---
interface CareerCardProps extends Recommendation {
  isSelected: boolean;
  onSelect: (title: string) => void;
  className?: string; // Optional className for animation delays
}

// --- SVG ICONS ---
const SalaryIcon = () => <svg className="w-4 h-4 text-secondary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CertificationIcon = () => <svg className="w-4 h-4 text-secondary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.186.12l-2.014-.403a2 2 0 00-1.022.547l-2.14 2.14a2 2 0 01-2.827 0l-2.14-2.14a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.186.12l-2.014-.403a2 2 0 00-1.022.547l-2.14 2.14a2 2 0 01-2.827 0l-2.14-2.14" /></svg>;
const CompanyIcon = () => <svg className="w-4 h-4 text-secondary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;

const CareerCard = ({
  title,
  justification,
  roadmap,
  estimatedSalary,
  suggestedCertifications,
  keyCompanies,
  isSelected,
  onSelect,
  className = ""
}: CareerCardProps) => {

  return (
    <div
      className={`card flex flex-col group cursor-pointer relative overflow-hidden ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => onSelect(title)}
    >
      {/* ══ CARD HEADER GRADIENT ══ */}
      <div className="px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, rgba(0,229,195,0.07), rgba(10,240,255,0.03))', borderBottom: '1px solid var(--border-subtle)' }}>
        {/* ══ SELECTION BADGE ══ */}
        {isSelected && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal rounded-full flex items-center justify-center text-void shadow-glow-teal z-10 animate-bounce-subtle" style={{ backgroundColor: 'var(--accent-teal)', color: 'var(--bg-void)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div className="section-label mb-2">Recommended Path</div>
        <h3 className="text-2xl font-display font-bold text-primary mb-3 leading-tight">{title}</h3>
        <p className="text-secondary text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
          {justification}
        </p>
      </div>

      {/* ══ CARD BODY ══ */}
      <div className="px-7 py-5 flex flex-col flex-grow">

        <div className="space-y-6 flex-grow">
          {/* Roadmap */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
              <h4 className="text-[0.75rem] font-bold uppercase tracking-widest text-secondary">Step-by-Step Roadmap</h4>
            </div>
            <ul className="space-y-2.5">
              {roadmap.slice(0, 3).map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="text-teal font-mono font-bold text-[0.85rem] mt-0.5">{index + 1}.</span>
                  <span className="text-primary/90 leading-snug">{step}</span>
                </li>
              ))}
              {roadmap.length > 3 && (
                <li className="text-secondary text-xs italic pl-6">+ {roadmap.length - 3} more steps</li>
              )}
            </ul>
          </div>

          {/* Detailed Insights */}
          <div className="pt-5 border-t border-white/5 space-y-4 shadow-[0_-20px_20px_-20px_rgba(0,0,0,0.5)]">
            {estimatedSalary && (
              <div className="flex gap-3">
                <SalaryIcon />
                <div>
                  <span className="block text-[0.65rem] uppercase tracking-wider text-dim font-bold">Estimated Salary</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>{estimatedSalary}</span>
                </div>
              </div>
            )}

            {suggestedCertifications && suggestedCertifications.length > 0 && (
              <div className="flex gap-3">
                <CertificationIcon />
                <div>
                  <span className="block text-[0.65rem] uppercase tracking-wider text-dim font-bold">Certifications</span>
                  <span className="text-sm text-secondary">{suggestedCertifications[0]}</span>
                </div>
              </div>
            )}

            {keyCompanies && keyCompanies.length > 0 && (
              <div className="flex gap-3">
                <CompanyIcon />
                <div>
                  <span className="block text-[0.65rem] uppercase tracking-wider text-dim font-bold">Top Hiring</span>
                  <span className="text-sm text-secondary">{keyCompanies[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-4 flex items-center justify-between">
          <span className="text-xs text-dim font-medium uppercase tracking-widest">{isSelected ? 'Selected for Comparison' : 'Select to Compare'}</span>
          <div className={`w-5 h-5 rounded-full border ${isSelected ? '' : 'border-white/10 group-hover:border-teal/50'} transition-all`} style={isSelected ? { backgroundColor: 'var(--accent-teal)', borderColor: 'var(--accent-teal)' } : {}}></div>
        </div>
      </div>
    </div>
  );
};

export default CareerCard;
