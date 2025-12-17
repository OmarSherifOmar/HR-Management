'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'CLOSED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'SUBMITTED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ACKNOWLEDGED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'RESOLVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ARCHIVED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span
      className={`inline-block rounded border px-3 py-1 text-sm font-medium ${getStatusStyles(status)} ${className}`}
    >
      {status?.toUpperCase()}
    </span>
  );
}
