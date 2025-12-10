'use client';

import { useState } from 'react';

interface SimpleCaptchaProps {
  onVerify: (verified: boolean) => void;
  isModal?: boolean;
}

export default function SimpleCaptcha({ onVerify, isModal = false }: SimpleCaptchaProps) {
  const [answer, setAnswer] = useState('');
  const [num1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2] = useState(Math.floor(Math.random() * 10) + 1);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);

  const handleVerify = () => {
    const userAnswer = parseInt(answer);
    const correctAnswer = num1 + num2;

    if (userAnswer === correctAnswer) {
      setIsVerified(true);
      setError(false);
      onVerify(true);
    } else {
      setError(true);
      setIsVerified(false);
      onVerify(false);
      setAnswer('');
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Verified ✓</span>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'bg-slate-800/50' : 'bg-slate-900/50'} border border-slate-700 rounded-lg p-4 space-y-3`}>
      <div className="flex items-center gap-2 text-slate-300">
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-sm font-medium">Security Check</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-slate-800 px-4 py-2 rounded border border-slate-600 text-white font-mono text-lg">
          {num1} + {num2} = ?
        </div>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          placeholder="?"
        />
        <button
          onClick={handleVerify}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded transition-colors"
        >
          Verify
        </button>
      </div>
      
      {error && (
        <p className="text-red-400 text-sm">Incorrect answer. Please try again.</p>
      )}
    </div>
  );
}
