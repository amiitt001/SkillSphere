/**
 * CareerCard — displays a single AI-generated career recommendation.
 * Premium monochromatic SaaS design with glassmorphism, subtle glows, and detailed roadmap modal.
 */
import React, { useState } from 'react';
import { Recommendation, SkillGapAnalysis } from '@/types';

interface CareerCardProps extends Recommendation {
  isSelected: boolean;
  onSelect: (title: string) => void;
  index?: number;
  className?: string;
}

// Simple helper to get relevant skills based on career titles
const getSkillsForCareer = (title: string): string[] => {
  const t = title.toLowerCase();
  if (t.includes('machine learning') || t.includes('ml') || t.includes('ai') || t.includes('deep learning') || t.includes('data scientist')) {
    return ['Python', 'TensorFlow', 'MLOps'];
  }
  if (t.includes('data engineer') || t.includes('data engineering') || t.includes('big data')) {
    return ['Python', 'SQL', 'Apache Spark'];
  }
  if (t.includes('data analyst') || t.includes('analytics') || t.includes('business analyst')) {
    return ['SQL', 'Python', 'Power BI'];
  }
  if (t.includes('cloud') || t.includes('devops') || t.includes('infrastructure')) {
    return ['AWS', 'Docker', 'Kubernetes'];
  }
  if (t.includes('software') || t.includes('developer') || t.includes('frontend') || t.includes('backend')) {
    return ['TypeScript', 'React', 'Node.js'];
  }
  if (t.includes('product') || t.includes('manager') || t.includes('pm')) {
    return ['Agile', 'Jira', 'Roadmapping'];
  }
  if (t.includes('cyber') || t.includes('security')) {
    return ['Linux', 'Wireshark', 'IAM'];
  }
  return ['SQL', 'Git', 'Problem Solving'];
};

// Generates high-fidelity fallback SkillGapAnalysis if none is stored/returned
const getFallbackSkillGap = (title: string): SkillGapAnalysis => {
  const t = title.toLowerCase();
  if (t.includes('machine learning') || t.includes('ml') || t.includes('ai') || t.includes('deep learning') || t.includes('data scientist')) {
    return {
      readinessScore: 80,
      estimatedTime: "4-6 Months",
      currentSkills: ["Python", "SQL", "JavaScript", "Open Source"],
      missingSkills: [
        { name: "TensorFlow", level: 0 },
        { name: "PyTorch", level: 0 },
        { name: "MLOps", level: 0 },
        { name: "Statistics", level: 40 }
      ],
      topPrioritySkills: ["TensorFlow", "PyTorch", "MLOps"],
      aiInsight: "You already possess the programming foundation required for this role. Completing these skills could increase your readiness score from 80% to 95%."
    };
  }
  if (t.includes('data engineer') || t.includes('data engineering')) {
    return {
      readinessScore: 75,
      estimatedTime: "3-5 Months",
      currentSkills: ["Python", "SQL", "Git"],
      missingSkills: [
        { name: "Apache Spark", level: 20 },
        { name: "Kafka", level: 0 },
        { name: "Data Warehousing", level: 30 }
      ],
      topPrioritySkills: ["Apache Spark", "Kafka", "Data Warehousing"],
      aiInsight: "Your strong SQL base matches data engineering needs. Focus on distributed computing framework Spark and queue systems like Kafka."
    };
  }
  // Default fallback
  return {
    readinessScore: 70,
    estimatedTime: "3-6 Months",
    currentSkills: ["SQL", "Git", "Problem Solving"],
    missingSkills: [
      { name: "React", level: 10 },
      { name: "Node.js", level: 20 },
      { name: "System Design", level: 0 }
    ],
    topPrioritySkills: ["React", "Node.js", "System Design"],
    aiInsight: "You possess robust analytical foundations. Prioritize expanding your knowledge of modern frontend frameworks and system design concepts."
  };
};

const CareerCard = ({
  title,
  justification,
  roadmap,
  estimatedSalary,
  suggestedCertifications = [],
  keyCompanies = [],
  skillGapAnalysis,
  isSelected,
  onSelect,
  index = 0,
  className = ""
}: CareerCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skillgap'>('roadmap');

  // Compute a match score based on recommendations order
  const matchScore = Math.max(78, 96 - index * 4);
  const skills = getSkillsForCareer(title);

  // Determine Growth level (premium SaaS logic)
  const isHighGrowth = title.toLowerCase().includes('ai') || 
                       title.toLowerCase().includes('ml') || 
                       title.toLowerCase().includes('data engineer') || 
                       title.toLowerCase().includes('cloud') || 
                       title.toLowerCase().includes('devops') ||
                       title.toLowerCase().includes('security');
  const growthText = isHighGrowth ? "High" : "Medium";

  // Use stored gap analysis or fallback
  const gapData = skillGapAnalysis || getFallbackSkillGap(title);

  return (
    <>
      <div
        className={`flex flex-col justify-between h-full bg-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_0_30px_rgba(255,255,255,0.06)] relative group cursor-pointer ${
          isSelected ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.04)] bg-zinc-900/60' : ''
        } ${className}`}
        onClick={() => onSelect(title)}
      >
        <div>
          {/* Header row: Match score & Selection indicator */}
          <div className="flex items-center justify-between mb-4">
            <span 
              className="text-[11px] font-mono tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e4e4e7',
                whiteSpace: 'nowrap',
                width: 'auto',
                height: 'auto',
                lineHeight: '1.2'
              }}
            >
              {matchScore}% Match
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${isHighGrowth ? 'text-emerald-400' : 'text-zinc-400'}`}>
                Growth: {growthText}
              </span>
            </div>
          </div>

          {/* Career Title */}
          <h3 className="text-xl font-bold tracking-tight text-white mb-2 group-hover:text-zinc-200 transition-colors">
            {title}
          </h3>

          {/* Justification: Clamped to 2 lines max to avoid overload */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2 h-8">
            {justification}
          </p>

          {/* Key Skills Row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {skills.map((s, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[10px] text-zinc-600">•</span>}
                <span className="text-[11px] font-medium text-zinc-300">{s}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Details Row: Salary & Growth */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-zinc-900 mb-4 text-[12px]">
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Salary (India)</span>
              <span className="font-semibold text-zinc-200 font-mono">
                {estimatedSalary ? estimatedSalary.split(' ')[0] : '₹6L - ₹12L'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Top Hiring</span>
              <span className="font-semibold text-zinc-200 truncate block">
                {keyCompanies[0] || 'Top Tech Firms'}
              </span>
            </div>
          </div>

          {/* Roadmap Preview Checklist */}
          <div className="space-y-2 mb-4">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Roadmap Preview</span>
            <div className="space-y-1.5">
              {roadmap.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-zinc-500 mt-0.5 select-none">✓</span>
                  <span className="line-clamp-1">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setActiveTab('roadmap'); setShowModal(true); }}
            className="text-[11px] font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
          >
            <span>View Full Roadmap</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(title)}
              className="sr-only"
            />
            <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300">Compare</span>
            <div 
              className={`flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-white border-white text-black' 
                  : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-550'
              }`}
              style={{
                width: '16px',
                height: '16px',
                minWidth: '16px',
                minHeight: '16px',
                borderRadius: '4px',
                border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                backgroundColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.02)'
              }}
            >
              {isSelected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Full Roadmap & Skill Gap Modal Overlay */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[85vh] animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-900 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  Detailed Path
                </span>
                <h4 className="text-xl font-bold text-white mt-2 leading-tight">{title}</h4>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Premium Tab Selectors */}
            <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg mb-6 text-xs font-semibold">
              <button 
                onClick={() => setActiveTab('roadmap')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                  activeTab === 'roadmap' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Timeline Roadmap
              </button>
              <button 
                onClick={() => setActiveTab('skillgap')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                  activeTab === 'skillgap' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Skill Gap Analysis
              </button>
            </div>

            {/* Modal Content */}
            {activeTab === 'roadmap' ? (
              <div className="space-y-6 animate-fade-in">
                {/* Fit Justification */}
                <div>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">AI Justification</span>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                    {justification}
                  </p>
                </div>

                {/* Complete Step-by-Step Roadmap */}
                <div>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Detailed Roadmap Timeline</span>
                  <div className="space-y-4">
                    {roadmap.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-5 h-5 rounded-full bg-white text-black text-[11px] font-mono font-bold flex items-center justify-center shrink-0 shadow-sm">
                            {idx + 1}
                          </div>
                          {idx < roadmap.length - 1 && (
                            <div className="w-0.5 h-8 bg-zinc-800 my-1"></div>
                          )}
                        </div>
                        <div className="pt-0.5">
                          <p className="text-sm text-zinc-200 font-medium leading-tight">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications and Companies */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                  {suggestedCertifications && suggestedCertifications.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Certifications</span>
                      <ul className="space-y-1">
                        {suggestedCertifications.map((c, i) => (
                          <li key={i} className="text-xs text-zinc-300 leading-relaxed">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {keyCompanies && keyCompanies.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Top Employers</span>
                      <ul className="space-y-1">
                        {keyCompanies.map((c, i) => (
                          <li key={i} className="text-xs text-zinc-300 leading-relaxed">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Dual Lists of Skills */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Current Skills list */}
                  <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-3">
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Skills</span>
                    <div className="space-y-2">
                      {gapData.currentSkills.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-200">
                          <span className="text-emerald-400 font-medium select-none">✓</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills list */}
                  <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-3">
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Missing Skills</span>
                    <div className="space-y-2">
                      {gapData.missingSkills.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-200">
                          <span className="text-amber-500 font-medium select-none">⚠</span>
                          <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skill Readiness Breakdown Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-4">Skill Readiness</span>
                  
                  <div className="space-y-3.5">
                    {/* Render current skills as 100% ready */}
                    {gapData.currentSkills.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-medium truncate max-w-[160px]">{s}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div className="bg-white h-full" style={{ width: '100%' }}></div>
                          </div>
                          <span className="font-mono text-zinc-200 w-8 text-right font-medium">100%</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Render missing skills with specific exposure levels */}
                    {gapData.missingSkills.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-medium truncate max-w-[160px]">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div className="bg-white/40 h-full" style={{ width: `${s.level}%` }}></div>
                          </div>
                          <span className="font-mono text-zinc-400 w-8 text-right font-medium">{s.level}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Readiness and prep time summaries */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-300">
                    <div>
                      <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Overall Readiness</span>
                      <span className="text-white text-sm font-mono">{gapData.readinessScore}% Ready</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Estimated Prep Time</span>
                      <span className="text-white text-sm font-mono">{gapData.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                {/* AI Insight Box */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">AI INSIGHT</span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {gapData.aiInsight}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="btn-ghost py-2 px-5 text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CareerCard;
