'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step4HRMonitoringProps {
  userRole: string | null;
}

export default function Step4HRMonitoring({ userRole }: Step4HRMonitoringProps) {
  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin', 'HR Employee'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          <span className="text-sm font-bold text-purple-400">4</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-400">Step 4: HR Monitoring & Publication</h3>
          <p className="mt-1 text-sm text-purple-300">
            HR Manager tracks completion via dashboard; HR Employee monitors progress and sends reminders; then publishes final ratings to employees.
          </p>
        </div>
        {isHRRole ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-purple-400/10 p-3">
          <p className="font-medium text-purple-300">User Stories:</p>
          <ul className="mt-1 space-y-1 text-xs text-purple-200">
            <li>REQ-AE-10: Consolidated dashboard tracking appraisal completion</li>
            <li>REQ-AE-06: Monitor progress and send reminders</li>
          </ul>
        </div>
        <div className="rounded bg-purple-400/10 p-3">
          <p className="font-medium text-purple-300">Actions:</p>
          <p className="mt-1 text-xs text-purple-200">Track progress by department, send reminders, publish ratings</p>
        </div>
        <div className="rounded bg-purple-400/10 p-3">
          <p className="font-medium text-purple-300">Output:</p>
          <p className="mt-1 text-xs text-purple-200">Finalized appraisal record created, employee notifications sent</p>
        </div>
      </div>
    </div>
  );
}
