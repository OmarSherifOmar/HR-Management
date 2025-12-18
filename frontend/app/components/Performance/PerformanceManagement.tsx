'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceAccess, AccessGuard } from '@/app/hooks/usePerformanceAccess';
import { PerformanceFeature } from '@/app/utils/performanceAccess';
import PerformanceTemplates from './PerformanceTemplates';
import PerformanceCycles from './PerformanceCycles';
import PerformanceAssignments from './PerformanceAssignments';
import AppraisalForm from './AppraisalForm';
import DisputeManagement from './DisputeManagement';
import PerformanceReporting from './PerformanceReporting';
import HRDashboard from './HRDashboard';

interface Tab {
  id: string;
  label: string;
  feature: PerformanceFeature;
  component: React.ComponentType<any>;
}

interface PerformanceManagementProps {
  userRole: string | null;
  employeeId: string;
}

export default function PerformanceManagement({ userRole, employeeId }: PerformanceManagementProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const access = usePerformanceAccess({ userRole });

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const tabs: Tab[] = [
    {
      id: 'templates',
      label: 'Templates',
      feature: PerformanceFeature.VIEW_TEMPLATES,
      component: PerformanceTemplates,
    },
    {
      id: 'cycles',
      label: 'Cycles',
      feature: PerformanceFeature.VIEW_CYCLES,
      component: PerformanceCycles,
    },
    {
      id: 'assignments',
      label: 'Assignments',
      feature: PerformanceFeature.VIEW_ASSIGNMENTS,
      component: PerformanceAssignments,
    },
    {
      id: 'appraisals',
      label: 'Appraisals',
      feature: PerformanceFeature.VIEW_MY_APPRAISALS,
      component: AppraisalForm,
    },
    {
      id: 'disputes',
      label: 'Disputes',
      feature: PerformanceFeature.VIEW_DISPUTES,
      component: DisputeManagement,
    },
    {
      id: 'reporting',
      label: 'Reporting',
      feature: PerformanceFeature.VIEW_REPORTS,
      component: PerformanceReporting,
    },
  ];

  // Filter tabs based on user access
  const accessibleTabs = tabs.filter((tab) => access.can(tab.feature));

  // Set first accessible tab as default if current tab not accessible
  useEffect(() => {
    if (activeTab !== 'dashboard' && !tabs.find((t) => t.id === activeTab && access.can(t.feature))) {
      setActiveTab(accessibleTabs[0]?.id || 'dashboard');
    }
  }, [userRole]);

  if (!userRole) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-yellow-400">Please Log In</h3>
        <p className="text-sm text-yellow-300">You need to be logged in to access Performance Management.</p>
      </div>
    );
  }

  if (accessibleTabs.length === 0) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-400">No Access</h3>
        <p className="text-sm text-red-300">Your role does not have access to Performance Management features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-white">Performance Management</h1>
        <p className="mt-2 text-sm text-gray-400">
          Role: <span className="font-semibold text-blue-400">{access.roleDisplayName}</span>
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 top-6 rounded-lg px-6 py-3 text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'border border-green-500/30 bg-green-500/10 text-green-400'
              : 'border border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Dashboard
          </button>
          {accessibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg bg-gray-900/50 p-6">
        {activeTab === 'dashboard' ? (
          access.isHR ? (
            <HRDashboard userRole={userRole} employeeId={employeeId} onNotify={showToast} />
          ) : (
            <OverviewTab access={access} userRole={userRole} />
          )
        ) : (
          (() => {
            const tab = tabs.find((t) => t.id === activeTab);
            if (!tab) return null;

            const Component = tab.component;
            return (
              <AccessGuard feature={tab.feature} userRole={userRole}>
                <Component userRole={userRole} employeeId={employeeId} onNotify={showToast} />
              </AccessGuard>
            );
          })()
        )}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500">
        <p>Performance Management Module • Last synced: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

// Overview Component
interface OverviewTabProps {
  access: any;
  userRole: string | null;
}

function OverviewTab({ access, userRole }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Performance Management</h2>
        <p className="text-gray-400">
          Manage appraisals, templates, cycles, and performance reviews. Select a tab above to get started.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Template Card */}
        {access.can(PerformanceFeature.VIEW_TEMPLATES) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-blue-500/50 transition-colors">
            <h3 className="font-semibold text-blue-400">Templates</h3>
            <p className="mt-2 text-xs text-gray-400">
              {access.can(PerformanceFeature.CREATE_TEMPLATE)
                ? 'Create and manage appraisal templates with rating scales'
                : 'View available appraisal templates'}
            </p>
          </div>
        )}

        {/* Cycles Card */}
        {access.can(PerformanceFeature.VIEW_CYCLES) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-green-500/50 transition-colors">
            <h3 className="font-semibold text-green-400">Cycles</h3>
            <p className="mt-2 text-xs text-gray-400">
              {access.can(PerformanceFeature.CREATE_CYCLE)
                ? 'Create and manage appraisal cycles with schedules'
                : 'View active and past appraisal cycles'}
            </p>
          </div>
        )}

        {/* Assignments Card */}
        {access.can(PerformanceFeature.VIEW_ASSIGNMENTS) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-purple-500/50 transition-colors">
            <h3 className="font-semibold text-purple-400">Assignments</h3>
            <p className="mt-2 text-xs text-gray-400">
              {access.can(PerformanceFeature.CREATE_ASSIGNMENTS)
                ? 'Assign appraisals to managers in bulk'
                : 'View your appraisal assignments'}
            </p>
          </div>
        )}

        {/* Appraisals Card */}
        {access.can(PerformanceFeature.VIEW_MY_APPRAISALS) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-yellow-500/50 transition-colors">
            <h3 className="font-semibold text-yellow-400">Appraisals</h3>
            <p className="mt-2 text-xs text-gray-400">
              {access.can(PerformanceFeature.SUBMIT_APPRAISAL)
                ? 'Submit and review performance appraisals'
                : 'View and acknowledge your appraisals'}
            </p>
          </div>
        )}

        {/* Disputes Card */}
        {access.can(PerformanceFeature.VIEW_DISPUTES) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-red-500/50 transition-colors">
            <h3 className="font-semibold text-red-400">Disputes</h3>
            <p className="mt-2 text-xs text-gray-400">
              {access.can(PerformanceFeature.RESOLVE_DISPUTE)
                ? 'Review and resolve appraisal disputes'
                : 'Submit disputes on your appraisal ratings'}
            </p>
          </div>
        )}

        {/* Reporting Card */}
        {access.can(PerformanceFeature.VIEW_REPORTS) && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-cyan-500/50 transition-colors">
            <h3 className="font-semibold text-cyan-400">Reporting</h3>
            <p className="mt-2 text-xs text-gray-400">View reports, analyze trends, and archive appraisals</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-300">
          <span className="font-semibold">Quick Tip:</span> Navigate using the tabs above to access the performance management features available to your role.
        </p>
      </div>
    </div>
  );
}
