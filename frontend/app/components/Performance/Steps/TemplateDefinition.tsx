'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Step1TemplateDefinitionProps {
  userRole: string | null;
}

export default function Step1TemplateDefinition({ userRole }: Step1TemplateDefinitionProps) {
  const isHRManager = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
          <span className="text-sm font-bold text-blue-400">1</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-400">Step 1: Template Definition</h3>
          <p className="mt-1 text-sm text-blue-300">
            HR Managers configure standardized appraisal templates defining rating scales, names, types, and assignment to organizational units.
          </p>
        </div>
        {isHRManager ? (
          <Unlock className="h-5 w-5 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded bg-blue-400/10 p-3">
          <p className="font-medium text-blue-300">User Stories:</p>
          <p className="mt-1 text-xs text-blue-200">REQ-PP-01: Configure standardized appraisal templates and rating scales</p>
        </div>
        <div className="rounded bg-blue-400/10 p-3">
          <p className="font-medium text-blue-300">Output:</p>
          <p className="mt-1 text-xs text-blue-200">Standardized templates are created and saved for re-use</p>
        </div>
        <div className="rounded bg-blue-400/10 p-3">
          <p className="font-medium text-blue-300">Status:</p>
          <p className="mt-1 text-xs text-blue-200">
            {isHRManager ? '✓ Authorized to create templates' : '✓ View templates only'}
          </p>
        </div>
      </div>
    </div>
  );
}
