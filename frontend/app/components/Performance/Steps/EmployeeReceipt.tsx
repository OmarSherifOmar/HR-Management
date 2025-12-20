'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step5EmployeeReceiptProps {
  userRole: string | null;
}

export default function Step5EmployeeReceipt({ userRole }: Step5EmployeeReceiptProps) {
  const isEmployee = userRole === 'department employee';

  return (
    <div className="space-y-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
          <span className="text-sm font-bold text-cyan-400">5</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-cyan-400">Step 5: Employee Receipt & Profile Update</h3>
          <p className="mt-1 text-sm text-cyan-300">
            Employee views final ratings, feedback, and development notes. System automatically saves appraisal details to employee profile.
          </p>
        </div>
        {isEmployee ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-cyan-400/10 p-3">
          <p className="font-medium text-cyan-300">User Story:</p>
          <p className="mt-1 text-xs text-cyan-200">REQ-OD-01: View final ratings, feedback, and development notes</p>
        </div>
        <div className="rounded bg-cyan-400/10 p-3">
          <p className="font-medium text-cyan-300">Business Rule:</p>
          <p className="mt-1 text-xs text-cyan-200">BR 6: Employee Appraisals saved on profile with date, method, scale, and score</p>
        </div>
        <div className="rounded bg-cyan-400/10 p-3">
          <p className="font-medium text-cyan-300">Output:</p>
          <p className="mt-1 text-xs text-cyan-200">Final score/rating recorded in Employee Profile module</p>
        </div>
      </div>
    </div>
  );
}
