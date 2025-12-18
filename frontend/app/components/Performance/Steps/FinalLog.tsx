'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface StepEndFinalLogProps {
  userRole: string | null;
}

export default function StepEndFinalLog({ userRole }: StepEndFinalLogProps) {
  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin', 'HR Employee'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
          <span className="text-sm font-bold text-indigo-400">END</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-400">Final Log & Archiving</h3>
          <p className="mt-1 text-sm text-indigo-300">
            Finalized appraisal record is archived and made available for historical trend analysis and outcome reports.
          </p>
        </div>
        {isHRRole ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-indigo-400/10 p-3">
          <p className="font-medium text-indigo-300">User Stories:</p>
          <ul className="mt-1 space-y-1 text-xs text-indigo-200">
            <li>REQ-OD-08: Access past appraisal history and multi-cycle trend views</li>
            <li>REQ-OD-06: Generate and export outcome reports</li>
          </ul>
        </div>
        <div className="rounded bg-indigo-400/10 p-3">
          <p className="font-medium text-indigo-300">Output:</p>
          <p className="mt-1 text-xs text-indigo-200">Final historical record saved, archived for trend analysis and reporting</p>
        </div>
      </div>
    </div>
  );
}
