'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step3ManagerEvaluationProps {
  userRole: string | null;
}

export default function Step3ManagerEvaluation({ userRole }: Step3ManagerEvaluationProps) {
  const isManager = userRole === 'department head';
  const canSubmitAppraisal = ['department head', 'department employee'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
          <span className="text-sm font-bold text-yellow-400">3</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-400">Step 3: Manager Evaluation</h3>
          <p className="mt-1 text-sm text-yellow-300">
            Line managers view assigned appraisal forms, complete structured ratings, add comments, examples, and development recommendations.
          </p>
        </div>
        {canSubmitAppraisal ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-yellow-400/10 p-3">
          <p className="font-medium text-yellow-300">User Stories:</p>
          <ul className="mt-1 space-y-1 text-xs text-yellow-200">
            <li>REQ-PP-13: View assigned appraisal forms</li>
            <li>REQ-AE-03: Complete structured appraisal ratings for direct reports</li>
            <li>REQ-AE-04: Add comments, examples and development recommendations</li>
          </ul>
        </div>
        <div className="rounded bg-yellow-400/10 p-3">
          <p className="font-medium text-yellow-300">Inputs:</p>
          <p className="mt-1 text-xs text-yellow-200">Time Management data informs ratings (attendance, punctuality)</p>
        </div>
        <div className="rounded bg-yellow-400/10 p-3">
          <p className="font-medium text-yellow-300">Output:</p>
          <p className="mt-1 text-xs text-yellow-200">Manager ratings, scores, and feedback recorded in PM module</p>
        </div>
      </div>
    </div>
  );
}
