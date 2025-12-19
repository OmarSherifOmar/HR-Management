'use client';

import React from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

interface Step6ObjectionWindowProps {
  userRole: string | null;
}

export default function Step6ObjectionWindow({ userRole }: Step6ObjectionWindowProps) {
  const isEmployee = userRole === 'department employee';

  return (
    <div className="space-y-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
          <span className="text-sm font-bold text-orange-400">6</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-400">Step 6: Objection Window (Decision Point)</h3>
          <p className="mt-1 text-sm text-orange-300">
            Employee may use 7-day window to flag or raise concerns about rating and record a dispute.
          </p>
        </div>
        {isEmployee ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-orange-400/10 p-3">
          <p className="font-medium text-orange-300">User Story:</p>
          <p className="mt-1 text-xs text-orange-200">REQ-AE-07: Flag or raise concern about rating within 7-day window</p>
        </div>
        <div className="rounded bg-orange-400/10 p-3">
          <p className="font-medium text-orange-300">Business Rule:</p>
          <p className="mt-1 text-xs text-orange-200">
            BR 31: Employees have right to file formal appeal within pre-set time window after appraisal outcome
          </p>
        </div>
        <div className="flex items-start gap-2 rounded bg-orange-400/10 p-3">
          <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-orange-300">Decision Point:</p>
            <p className="mt-1 text-xs text-orange-200">
              If objection filed → proceed to Step 7 (Resolution). If no objection → end process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
