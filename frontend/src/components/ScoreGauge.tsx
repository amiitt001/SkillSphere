'use client';

/**
 * ScoreGauge — Circular SVG gauge for displaying scores (ATS, quiz, etc.)
 * Animated fill on mount.
 */

import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
    score: number;       // 0-100
    label?: string;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

export default function ScoreGauge({
    score,
    label = 'Score',
    size = 160,
    strokeWidth = 10,
    color,
}: ScoreGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    // Determine color based on score
    const getColor = () => {
        if (color) return color;
        if (score >= 80) return '#00e5c3';
        if (score >= 60) return '#0af0ff';
        if (score >= 40) return '#f5c842';
        return '#ff5fa0';
    };

    const getGrade = () => {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Average';
        if (score >= 40) return 'Needs Work';
        return 'Weak';
    };

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="score-gauge" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />
                {/* Score arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ filter: `drop-shadow(0 0 6px ${getColor()}40)` }}
                />
            </svg>
            <span className="score-value" style={{ color: getColor() }}>{score}</span>
            <span className="score-label">
                {label} · {getGrade()}
            </span>
        </div>
    );
}
