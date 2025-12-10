'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

function HistoryContent() {
    return (
        <div className="p-8 text-white">
            <h1 className="text-3xl font-bold mb-4">History</h1>
            <p>Your recommendation history will appear here.</p>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <ProtectedRoute>
            <HistoryContent />
        </ProtectedRoute>
    );
}
