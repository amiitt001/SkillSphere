'use client';

import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { Recommendation } from '@/types';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

interface AnalyticsSectionProps {
  recommendations: Recommendation[];
}

// Deterministic helper to generate realistic metrics based on career title
function getMetricsForTitle(title: string) {
  const t = title.toLowerCase();
  if (t.includes('machine learning') || t.includes('ml') || t.includes('ai') || t.includes('deep learning')) {
    return { salary: 95, demand: 98, growth: 98, difficulty: 85, remote: 75, stability: 96, salaryLakhs: 18 };
  }
  if (t.includes('data scientist') || t.includes('data science')) {
    return { salary: 90, demand: 92, growth: 90, difficulty: 80, remote: 80, stability: 92, salaryLakhs: 15 };
  }
  if (t.includes('data engineer') || t.includes('data engineering')) {
    return { salary: 88, demand: 94, growth: 92, difficulty: 75, remote: 85, stability: 94, salaryLakhs: 14 };
  }
  if (t.includes('full stack') || t.includes('developer') || t.includes('software engineer')) {
    return { salary: 80, demand: 88, growth: 82, difficulty: 65, remote: 90, stability: 85, salaryLakhs: 10 };
  }
  if (t.includes('cloud') || t.includes('devops')) {
    return { salary: 85, demand: 90, growth: 88, difficulty: 70, remote: 80, stability: 90, salaryLakhs: 12 };
  }
  if (t.includes('product') || t.includes('manager')) {
    return { salary: 85, demand: 80, growth: 80, difficulty: 60, remote: 60, stability: 80, salaryLakhs: 12 };
  }
  if (t.includes('security') || t.includes('cyber')) {
    return { salary: 90, demand: 95, growth: 95, difficulty: 80, remote: 70, stability: 95, salaryLakhs: 15 };
  }
  return { salary: 75, demand: 75, growth: 75, difficulty: 60, remote: 70, stability: 75, salaryLakhs: 8 };
}

export default function AnalyticsSection({ recommendations }: AnalyticsSectionProps) {
  if (!recommendations || recommendations.length < 3) return null;

  const r1 = recommendations[0];
  const r2 = recommendations[1];
  const r3 = recommendations[2];

  const m1 = getMetricsForTitle(r1.title);
  const m2 = getMetricsForTitle(r2.title);
  const m3 = getMetricsForTitle(r3.title);

  // 1. Radar Chart Data
  const radarData = [
    { subject: 'Salary Potential', [r1.title]: m1.salary, [r2.title]: m2.salary, [r3.title]: m3.salary },
    { subject: 'Market Demand', [r1.title]: m1.demand, [r2.title]: m2.demand, [r3.title]: m3.demand },
    { subject: 'Growth Rate', [r1.title]: m1.growth, [r2.title]: m2.growth, [r3.title]: m3.growth },
    { subject: 'Difficulty', [r1.title]: m1.difficulty, [r2.title]: m2.difficulty, [r3.title]: m3.difficulty },
    { subject: 'Remote Jobs', [r1.title]: m1.remote, [r2.title]: m2.remote, [r3.title]: m3.remote },
    { subject: 'Stability', [r1.title]: m1.stability, [r2.title]: m2.stability, [r3.title]: m3.stability },
  ];

  // 2. Bar Chart Data: Salary Potential (Lakhs per Annum)
  const barData = [
    { name: r1.title.split(' ')[0], Salary: m1.salaryLakhs },
    { name: r2.title.split(' ')[0], Salary: m2.salaryLakhs },
    { name: r3.title.split(' ')[0], Salary: m3.salaryLakhs },
  ];

  // 3. Line Chart Data: 3-Year Projected Demand Growth
  const lineData = [
    {
      year: '2025 (Current)',
      [r1.title]: m1.demand,
      [r2.title]: m2.demand,
      [r3.title]: m3.demand,
    },
    {
      year: '2026',
      [r1.title]: Math.min(99, m1.demand + m1.growth * 0.05),
      [r2.title]: Math.min(99, m2.demand + m2.growth * 0.05),
      [r3.title]: Math.min(99, m3.demand + m3.growth * 0.05),
    },
    {
      year: '2027',
      [r1.title]: Math.min(99, m1.demand + m1.growth * 0.10),
      [r2.title]: Math.min(99, m2.demand + m2.growth * 0.10),
      [r3.title]: Math.min(99, m3.demand + m3.growth * 0.10),
    },
    {
      year: '2028 (Projected)',
      [r1.title]: Math.min(99, m1.demand + m1.growth * 0.15),
      [r2.title]: Math.min(99, m2.demand + m2.growth * 0.15),
      [r3.title]: Math.min(99, m3.demand + m3.growth * 0.15),
    },
  ];

  // Custom tooltip styles for premium dark mode aesthetics
  const tooltipContentStyle = {
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#fafafa',
    fontSize: '11px',
    fontFamily: 'monospace'
  };

  return (
    <div className="space-y-12">
      <div className="border-t border-zinc-900 my-8 pt-8">
        <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
          Career Match Insights & Visualizations
        </h3>
        <p className="text-zinc-500 text-xs">
          Interactive metrics mapping out market analysis, salary ranges, and future scaling vectors.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart Panel */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
              <Award size={12} /> Model Compatibility
            </span>
            <h4 className="text-sm font-semibold text-white">Radar Parameter Comparison</h4>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" fontSize={9} />
                <Radar name={r1.title} dataKey={r1.title} stroke="#ffffff" fill="#ffffff" fillOpacity={0.05} />
                <Radar name={r2.title} dataKey={r2.title} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} />
                <Radar name={r3.title} dataKey={r3.title} stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.05} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Panel */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
              <DollarSign size={12} /> Financial Potential
            </span>
            <h4 className="text-sm font-semibold text-white">Salary Benchmarking (India)</h4>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                <YAxis unit="L" stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="Salary" fill="#ffffff" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart Panel */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
              <TrendingUp size={12} /> Projected Outlook
            </span>
            <h4 className="text-sm font-semibold text-white">3-Year Demand Growth Trend</h4>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" fontSize={9} />
                <YAxis domain={[50, 100]} stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey={r1.title} stroke="#ffffff" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey={r2.title} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey={r3.title} stroke="#a1a1aa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
