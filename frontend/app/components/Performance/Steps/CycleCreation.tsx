'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step2CycleCreationProps {
  userRole: string | null;
}

export default function Step2CycleCreation({ userRole }: Step2CycleCreationProps) {
  const canCreateCycle = ['HR Manager', 'HR Admin', 'HR Employee', 'System Admin'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-green-500/30 bg-green-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
          <span className="text-sm font-bold text-green-400">2</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-400">Step 2: Cycle Creation & Setup</h3>
          <p className="mt-1 text-sm text-green-300">
            HR Employee/Manager defines and schedules appraisal cycles, then assigns appraisal forms and templates to employees and managers in bulk.
          </p>
        </div>
        {canCreateCycle ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-green-400/10 p-3">
          <p className="font-medium text-green-300">User Stories:</p>
          <ul className="mt-1 space-y-1 text-xs text-green-200">
            <li>REQ-PP-02: Define and schedule appraisal cycles</li>
            <li>REQ-PP-05: Assign appraisal forms and templates in bulk</li>
          </ul>
        </div>
        <div className="rounded bg-green-400/10 p-3">
          <p className="font-medium text-green-300">Dependencies:</p>
          <p className="mt-1 text-xs text-green-200">Uses organizational structure for reviewer chains</p>
        </div>
        <div className="rounded bg-green-400/10 p-3">
          <p className="font-medium text-green-300">Output:</p>
          <p className="mt-1 text-xs text-green-200">Cycle created, assignments generated, notifications sent</p>
        </div>
      </div>
    </div>
  );
}
