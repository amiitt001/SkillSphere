'use client';

import React from 'react';
import { Recommendation } from '@/types';
import { CheckCircle2, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

interface CareerCardProps extends Recommendation {
  isSelected: boolean;
  onSelect: (title: string) => void;
  isActive?: boolean;
  onActivate?: () => void;
  index?: number;
  className?: string;
}

export default function CareerCard({
  title,
  justification,
  estimatedSalary,
  isSelected,
  onSelect,
  isActive = false,
  onActivate,
  index = 0,
  className = ""
}: CareerCardProps) {
  // Compute match score based on recommendations order
  const matchScore = Math.max(78, 96 - index * 4);

  // Determine Growth level
  const isHighGrowth = title.toLowerCase().match(/(ai|ml|data engineer|cloud|devops|security)/);
  const growthText = isHighGrowth ? "High" : "Medium";

  // Parse display salary
  const displaySalary = estimatedSalary ? estimatedSalary.split(' ')[0] : '₹12L - ₹25L';

  return (
    <div
      onClick={() => onActivate?.()}
      className={`group flex flex-col justify-between bg-zinc-900/40 border rounded-2xl p-5 transition-all duration-300 cursor-pointer relative select-none ${
        isActive 
          ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.12)] bg-zinc-900/80' 
          : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
      } ${className}`}
      style={{ minHeight: '210px' }}
    >
      <div className="space-y-4">
        {/* Header row: Match score & Growth */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} />
            {matchScore}% Match
          </span>
          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
            isHighGrowth ? 'text-blue-400' : 'text-zinc-500'
          }`}>
            <TrendingUp size={11} />
            {growthText} Growth
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white group-hover:text-zinc-150 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {justification}
          </p>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-4 pt-3 border-t border-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
          <DollarSign size={13} className="text-zinc-500" />
          <span>Salary:</span>
          <span className="font-mono text-white font-bold">{displaySalary}</span>
        </div>

        {/* Action Toggle (Compare) */}
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => onActivate?.()}
            className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
          >
            Details <ArrowRight size={10} />
          </button>
          
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(title)}
              className="sr-only"
            />
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-mono">Compare</span>
            <div 
              className={`flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-zinc-700 bg-zinc-950 hover:border-zinc-650'
              }`}
              style={{
                width: '14px',
                height: '14px',
                minWidth: '14px',
                minHeight: '14px',
                borderRadius: '4px',
                border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.4)'
              }}
            >
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
