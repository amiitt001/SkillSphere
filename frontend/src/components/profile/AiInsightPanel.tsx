'use client';

/**
 * AiInsightPanel — Structured AI career analysis display
 */

import { useState } from 'react';
import type { AIProfileAnalysis } from '@/types';

interface AiInsightPanelProps {
  analysis: AIProfileAnalysis;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const priorityConfig = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'High Priority' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Medium' },
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Low' },
};

export default function AiInsightPanel({ analysis, onRefresh, isLoading }: AiInsightPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'careers' | 'actions'>('overview');

  const tabs = [
    { id: 'overview', label: '🎯 Overview' },
    { id: 'skills', label: '🧩 Skill Gaps' },
    { id: 'careers', label: '💼 Career Matches' },
    { id: 'actions', label: '🚀 Action Plan' },
  ] as const;

  return (
    <div>
      {/* Summary banner */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.08))',
          border: '1px solid rgba(139,92,246,0.2)',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ marginRight: 6 }}>🤖</span>
        {analysis.careerReadinessSummary}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`ai-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: activeTab === tab.id ? '1px solid var(--accent-teal)' : '1px solid var(--border-subtle)',
              background: activeTab === tab.id ? 'rgba(0,229,195,0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-teal)' : 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {tab.label}
          </button>
        ))}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: isLoading ? 'var(--text-dim)' : 'var(--text-secondary)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {isLoading ? '⏳ Analyzing...' : '🔄 Refresh'}
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Strengths */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✅ Strengths
            </div>
            {analysis.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#10b981', fontSize: '0.75rem', marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
          {/* Weaknesses */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚠️ Areas to Improve
            </div>
            {analysis.weaknesses.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {analysis.missingSkills.map((skill, i) => {
            const cfg = priorityConfig[skill.priority];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.color, background: `${cfg.color}20`, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', marginTop: 1 }}>
                  {cfg.label}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    {skill.skill}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{skill.reason}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'careers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analysis.careerMatches.map((career, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{career.title}</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: career.matchPercentage >= 70 ? '#10b981' : career.matchPercentage >= 50 ? '#f59e0b' : '#f87171',
                  }}
                >
                  {career.matchPercentage}% match
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${career.matchPercentage}%`,
                    borderRadius: 99,
                    background: career.matchPercentage >= 70 ? '#10b981' : career.matchPercentage >= 50 ? '#f59e0b' : '#f87171',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {career.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'actions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Certifications */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎓 Certifications
            </div>
            {analysis.suggestedCertifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{cert.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{cert.provider}</div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              💡 Portfolio Projects
            </div>
            {analysis.suggestedProjects.map((project, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{project}</span>
              </div>
            ))}
          </div>

          {/* Interview Topics */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎯 Interview Preparation Topics
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {analysis.interviewTopics.map((topic) => (
                <span
                  key={topic}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#f59e0b',
                    fontWeight: 500,
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
