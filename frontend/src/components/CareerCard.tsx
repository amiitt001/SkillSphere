import React from 'react';

type CareerCardProps = {
  title: string;
  justification: string;
  roadmap: string[];
};

const CareerCard = ({ title, justification, roadmap }: CareerCardProps) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-sky-400 mb-2">{title}</h3>
      <p className="text-slate-400 mb-4">{justification}</p>
      <div>
        <h4 className="font-semibold text-white mb-2">Roadmap:</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          {roadmap.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CareerCard;