'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step7DisputeResolutionProps {
  userRole: string | null;
}

export default function Step7DisputeResolution({ userRole }: Step7DisputeResolutionProps) {
  const isHRManager = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
          <span className="text-sm font-bold text-red-400">7</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-400">Step 7: HR Manager Dispute Resolution</h3>
          <p className="mt-1 text-sm text-red-300">
            HR Manager reviews and resolves disputes: either deny (finalize original) or approve & change (adjust rating).
          </p>
        </div>
        {isHRManager ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-red-400/10 p-3">
          <p className="font-medium text-red-300">User Story:</p>
          <p className="mt-1 text-xs text-red-200">REQ-OD-07: Resolve disputes between employees and managers about ratings</p>
        </div>
        <div className="rounded bg-red-400/10 p-3">
          <p className="font-medium text-red-300">Outcomes:</p>
          <ul className="mt-1 space-y-1 text-xs text-red-200">
            <li>A) Deny: Original rating finalized and locked on profile</li>
            <li>B) Approve & Change: Rating adjusted, new score reflected</li>
          </ul>
        </div>
        <div className="rounded bg-red-400/10 p-3">
          <p className="font-medium text-red-300">Business Rule:</p>
          <p className="mt-1 text-xs text-red-200">BR 32: Appeals reviewed by HR, outcomes logged in system</p>
        </div>
      </div>
    </div>
  );
}
