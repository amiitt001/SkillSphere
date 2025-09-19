// frontend/src/components/CareerCard.tsx
import React from 'react';
import { Recommendation } from '@/types';

// --- CHANGE #1: Define props for the component, including the new selection logic ---
interface CareerCardProps extends Recommendation {
  isSelected: boolean;
  onSelect: (title: string) => void;
}

// --- Icons (unchanged) ---
const SalaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CertificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.905 59.905 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.07.002z" /></svg>;
const CompanyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m6.75 3.375V3" /></svg>;

const CareerCard = ({ title, justification, roadmap, estimatedSalary, suggestedCertifications, keyCompanies, isSelected, onSelect }: CareerCardProps) => {
  
  // --- CHANGE #2: Conditionally set class names for the border ---
  const cardClasses = `
    bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col h-full
    border-2
    ${isSelected ? 'border-sky-500' : 'border-slate-700'}
    cursor-pointer hover:border-sky-600 transition-colors
  `;

  return (
    // --- CHANGE #3: Apply the dynamic classes and the onClick handler ---
    <div className={cardClasses} onClick={() => onSelect(title)}>
      {/* The rest of your card's content is unchanged */}
      <h3 className="text-xl font-bold text-sky-400 mb-2">{title}</h3>
      <p className="text-slate-400 mb-4 text-sm">{justification}</p>
      
      <div className="border-t border-slate-700 pt-4 mt-auto">
        <h4 className="font-semibold text-white mb-2 text-sm">Roadmap:</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm mb-4">
          {roadmap.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>

        {estimatedSalary && (
          <div className="flex items-start gap-3 mt-4">
            <SalaryIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">Salary</h5>
              <p className="text-slate-400 text-sm">{estimatedSalary}</p>
            </div>
          </div>
        )}

        {suggestedCertifications && suggestedCertifications.length > 0 && (
          <div className="flex items-start gap-3 mt-4">
            <CertificationIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">Certifications</h5>
              <p className="text-slate-400 text-sm">{suggestedCertifications.join(', ')}</p>
            </div>
          </div>
        )}

        {keyCompanies && keyCompanies.length > 0 && (
          <div className="flex items-start gap-3 mt-4">
            <CompanyIcon />
            <div>
              <h5 className="font-semibold text-white text-sm">Key Companies</h5>
              <p className="text-slate-400 text-sm">{keyCompanies.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerCard;