'use client';

import React from 'react';

interface ProgressTrackerProps {
  current: number;
  total: number;
  percentage?: number;
  label?: string;
  showLabel?: boolean;
}

export default function ProgressTracker({
  current,
  total,
  percentage,
  label,
  showLabel = true,
}: ProgressTrackerProps) {
  const calculatedPercentage = percentage || (total > 0 ? Math.round((current / total) * 100) : 0);

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{label || 'Progress'}</span>
          <span className="text-sm text-gray-400">
            {current} / {total}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
          style={{ width: `${calculatedPercentage}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500">{calculatedPercentage}% complete</span>}
    </div>
  );
}
