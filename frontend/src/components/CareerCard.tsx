/**
 * This file contains the CareerCard component, a reusable UI element
 * for displaying a single AI-generated career recommendation.
 */
import React from 'react';
import { Recommendation } from '@/types';

// --- TYPE DEFINITION ---

/**
 * Defines the props required by the CareerCard component.
 * It extends the base Recommendation type with additional props
 * for handling the interactive selection state in the UI.
 */
interface CareerCardProps extends Recommendation {
  isSelected: boolean; // True if the card is currently selected by the user.
  onSelect: (title: string) => void; // Callback function to handle card selection.
}

// --- SVG ICONS ---
// These are stateless functional components for displaying inline SVG icons.

const SalaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CertificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.905 59.905 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.07.002z" /></svg>;
const CompanyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m6.75 3.375V3" /></svg>;

/**
 * A reusable UI component to display a single career recommendation.
 * It shows details like justification, roadmap, salary, etc., and handles
 * user selection for the comparison feature.
 */
const CareerCard = ({ title, justification, roadmap, estimatedSalary, suggestedCertifications, keyCompanies, isSelected, onSelect }: CareerCardProps) => {
  
  // Dynamically constructs the card's class names based on its selection state.
  // This is a clean way to handle conditional styling in React.
  const cardClasses = `
    bg-gradient-to-br from-slate-800 to-slate-800/50 p-6 rounded-xl shadow-lg flex flex-col h-full
    border-2 transition-all duration-300
    ${isSelected ? 'border-sky-500 shadow-sky-500/20 scale-105' : 'border-slate-700 hover:border-sky-400'}
    cursor-pointer hover:shadow-xl
  `;

  // --- RENDER ---
  return (
    <div className={cardClasses} onClick={() => onSelect(title)}>
      
      {/* Card Header Section */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{justification}</p>
      </div>
      
      {/* Card Body Section with Detailed Information */}
      <div className="border-t border-slate-700/50 pt-4 mt-auto flex-grow flex flex-col">
        <div className="mb-4">
          <h4 className="font-semibold text-sky-300 mb-3 text-sm uppercase tracking-wider">📍 Roadmap:</h4>
          <ul className="space-y-2">
            {roadmap.map((step, index) => (
              <li key={index} className="text-slate-300 text-sm flex gap-2">
                <span className="text-sky-400 font-bold flex-shrink-0">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The following sections are rendered conditionally, only if the AI provides the data. */}
        {estimatedSalary && (
          <div className="flex items-start gap-3 mt-4 p-3 bg-slate-700/30 rounded-lg">
            <SalaryIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">💰 Salary Range</h5>
              <p className="text-sky-300 text-sm font-medium">{estimatedSalary}</p>
            </div>
          </div>
        )}

        {suggestedCertifications && suggestedCertifications.length > 0 && (
          <div className="flex items-start gap-3 mt-3 p-3 bg-slate-700/30 rounded-lg">
            <CertificationIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">🎓 Certifications</h5>
              <p className="text-slate-300 text-sm">{suggestedCertifications.join(', ')}</p>
            </div>
          </div>
        )}

        {keyCompanies && keyCompanies.length > 0 && (
          <div className="flex items-start gap-3 mt-3 p-3 bg-slate-700/30 rounded-lg">
            <CompanyIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">🏢 Top Companies</h5>
              <p className="text-slate-300 text-sm">{keyCompanies.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerCard;

