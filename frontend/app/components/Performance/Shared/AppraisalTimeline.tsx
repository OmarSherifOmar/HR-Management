'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed';
  date?: string;
}

interface AppraisalTimelineProps {
  steps: TimelineStep[];
  currentStep?: string;
}

export default function AppraisalTimeline({ steps, currentStep }: AppraisalTimelineProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.status === 'completed';

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'border-green-500 bg-green-500/20'
                    : isActive
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-700'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-green-400" />
                ) : (
                  <span className={`text-sm font-semibold ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`my-2 h-12 w-0.5 transition-colors ${
                    isCompleted ? 'bg-green-500/30' : 'bg-gray-600'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className={`transition-colors ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                <h4 className="text-sm font-semibold">{step.title}</h4>
              </div>
              {step.description && <p className="mt-1 text-xs text-gray-400">{step.description}</p>}
              {step.date && <p className="mt-1 text-xs text-gray-500">{step.date}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
