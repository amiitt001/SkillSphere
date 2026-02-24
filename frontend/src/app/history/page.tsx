/**
 * This file contains the AI Career Comparison page.
 * It provides a deep-dive diagnostic comparison between two recommended paths.
 */
'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ComparisonTable from '@/components/ComparisonTable';

function ComparisonContent() {
    // Mock data for the prototype comparison
    const [career1] = useState('Senior Full Stack Developer');
    const [career2] = useState('AI Ethics Specialist');

    const mockTableData = [
        { feature: 'Primary Domain', career1_details: 'Software Engineering & Systems Architects', career2_details: 'Legal, Philosophical & AI Research' },
        { feature: 'Core Skillset', career1_details: 'Python, Node.js, Cloud Dev, React', career2_details: 'Policy Analysis, Bias Audits, ML Theory' },
        { feature: 'Industry Demand', career1_details: 'Critical (Steady High Demand)', career2_details: 'Exponential (Emerging Rapidly)' },
        { feature: 'Typical Salary', career1_details: '$140k - $190k', career2_details: '$120k - $210k' },
        { feature: 'Remote Flexibility', career1_details: '100% (High)', career2_details: '85% (Medium-High)' },
    ];

    return (
        <div className="max-w-6xl mx-auto py-8 lg:py-12">
            <div className="mb-12 animate-fade-in text-center md:text-left">
                <div className="section-label mb-2">Deep-Dive Analysis</div>
                <h1 className="text-4xl font-display font-bold text-primary leading-tight">
                    Career <span className="text-teal">Diagnostics</span>
                </h1>
                <p className="text-secondary mt-3 max-w-2xl">
                    Comparing the intricate details of your selected paths. Our AI evaluates the skill gap, market volatility, and long-term sustainability of each role.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div className="glass p-8 md:p-10 border-white/5 relative overflow-hidden animate-fade-up">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-teal font-mono text-xs font-bold uppercase tracking-widest mb-1 block">Path Alpha</span>
                            <h2 className="text-2xl font-display font-bold text-primary">{career1}</h2>
                        </div>
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-dim font-display italic">vs</div>
                        <div className="text-center md:text-right">
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-widest mb-1 block">Path Beta</span>
                            <h2 className="text-2xl font-display font-bold text-primary">{career2}</h2>
                        </div>
                    </div>

                    <ComparisonTable
                        data={mockTableData}
                        career1Title={career1}
                        career2Title={career2}
                    />

                    <div className="mt-12 p-6 rounded-radius bg-teal/5 border border-teal/10 animate-pulse-subtle">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center text-teal shrink-0 mt-1">💡</div>
                            <div>
                                <h4 className="font-bold text-teal text-sm uppercase tracking-wider mb-1">AI Strategic Advice</h4>
                                <p className="text-secondary text-sm leading-relaxed">
                                    While "{career1}" offers immediate stability, "{career2}" targets a higher market growth trajectory. We recommend pursuing {career1} while obtaining a certification in {career2} over the next 12 months for maximum career leverage.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ComparisonPage() {
    return (
        <ProtectedRoute>
            <ComparisonContent />
        </ProtectedRoute>
    );
}
