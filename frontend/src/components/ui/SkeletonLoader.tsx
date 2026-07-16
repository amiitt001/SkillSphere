'use client';

import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bento-card relative overflow-hidden" style={{ minHeight: 180 }}>
      <div className="shimmer" style={{ width: '40%', height: 20, marginBottom: 16 }}></div>
      <div className="shimmer" style={{ width: '85%', height: 14, marginBottom: 10 }}></div>
      <div className="shimmer" style={{ width: '70%', height: 14, marginBottom: 10 }}></div>
      <div className="shimmer" style={{ width: '55%', height: 14 }}></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto py-4">
      {/* Hero Welcome Shimmer */}
      <div className="mb-8">
        <div className="shimmer" style={{ width: '30%', height: 36, marginBottom: 12 }}></div>
        <div className="shimmer" style={{ width: '50%', height: 18 }}></div>
      </div>

      {/* Bento Grid Shimmer */}
      <div className="bento-grid">
        <div className="bento-card col-span-8" style={{ minHeight: 220 }}>
          <div className="shimmer" style={{ width: '25%', height: 22, marginBottom: 16 }}></div>
          <div className="shimmer" style={{ width: '90%', height: 14, marginBottom: 10 }}></div>
          <div className="shimmer" style={{ width: '80%', height: 14, marginBottom: 10 }}></div>
          <div className="shimmer" style={{ width: '45%', height: 14 }}></div>
        </div>

        <div className="bento-card col-span-4" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="shimmer" style={{ width: 100, height: 100, borderRadius: '50%', marginBottom: 12 }}></div>
          <div className="shimmer" style={{ width: '50%', height: 16 }}></div>
        </div>

        <div className="bento-card col-span-4" style={{ minHeight: 200 }}>
          <div className="shimmer" style={{ width: '50%', height: 20, marginBottom: 16 }}></div>
          <div className="shimmer" style={{ width: '80%', height: 12, marginBottom: 10 }}></div>
          <div className="shimmer" style={{ width: '70%', height: 12 }}></div>
        </div>

        <div className="bento-card col-span-4" style={{ minHeight: 200 }}>
          <div className="shimmer" style={{ width: '50%', height: 20, marginBottom: 16 }}></div>
          <div className="shimmer" style={{ width: '85%', height: 12, marginBottom: 10 }}></div>
          <div className="shimmer" style={{ width: '60%', height: 12 }}></div>
        </div>

        <div className="bento-card col-span-4" style={{ minHeight: 200 }}>
          <div className="shimmer" style={{ width: '55%', height: 20, marginBottom: 16 }}></div>
          <div className="shimmer" style={{ width: '80%', height: 12, marginBottom: 10 }}></div>
          <div className="shimmer" style={{ width: '75%', height: 12 }}></div>
        </div>
      </div>
    </div>
  );
}
