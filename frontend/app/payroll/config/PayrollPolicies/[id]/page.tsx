'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useAuth, authenticatedFetch } from '../../../../context/AuthContext';

interface RuleDefinition {
  percentage?: number;
  fixedAmount?: number;
  thresholdAmount?: number;
}

interface PayrollPolicy {
  _id?: string;
  policyName: string;
  policyType: string;
  description: string;
  effectiveDate: string;
  ruleDefinition?: RuleDefinition;
  applicability: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PayrollPolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [policy, setPolicy] = useState<PayrollPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  // Role-based permission check
  const canView = () => {
    const allowedRoles = [
      'Payroll Specialist', 
      'Payroll Manager'
    ];
    return allowedRoles.includes(user?.role || '');
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-yellow-600';
      case 'APPROVED': return 'bg-green-600';
      case 'REJECTED': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await authenticatedFetch(
          `${backendBaseUrl}/payroll-configuration/payroll-policies/${params.id}`,
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load payroll policy');
        }
        const data = await res.json();
        setPolicy({
          ...data,
          effectiveDate: data.effectiveDate
            ? new Date(data.effectiveDate).toISOString().slice(0, 10)
            : '',
        });
      } catch (err: any) {
        setError(err.message || 'Error loading payroll policy');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.id, backendBaseUrl]);

  // Check if user has permission to view this page
  if (!canView()) {
    return (
      <DashboardLayout title="Access Denied" description="You don't have permission to view this page">
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-red-400">You don't have permission to view payroll policy configurations.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Payroll Config — Policy Details"
      description="View detailed information about a specific payroll policy"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/payroll/config/PayrollPolicies')}
              className="mb-2 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              ← Back to Policies
            </button>
            <h1 className="text-2xl font-bold text-white">Policy Details</h1>
            <p className="text-gray-400">Detailed view of payroll policy configuration</p>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-400">Loading policy details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        ) : !policy ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg">Policy not found</p>
              <p className="text-gray-500 text-sm">The requested policy may have been deleted or moved</p>
            </div>
          </div>
        ) : (
          /* Policy Details */
          <div className="space-y-6">
            {/* Policy Header Card */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{policy.policyName}</h2>
                  <p className="text-gray-400 text-sm mb-3">Policy ID: {policy._id}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium">
                      {policy.policyType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusBadgeColor(policy.status)}`}>
                      {policy.status || 'DRAFT'}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  {policy.createdAt && (
                    <p>Created: {new Date(policy.createdAt).toLocaleDateString()}</p>
                  )}
                  {policy.updatedAt && (
                    <p>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Policy Description - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                <div className="bg-[#2a2a2a] rounded-lg p-6 h-full">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Policy Description
                  </h3>
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {policy.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Details - Takes 1 column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-[#2a2a2a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Effective Date:</span>
                      <span className="text-white font-medium">
                        {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Applicability:</span>
                      <span className="text-white font-medium">{policy.applicability}</span>
                    </div>
                  </div>
                </div>

                {/* Rule Definition */}
                <div className="bg-[#2a2a2a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Rule Definition
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Percentage:</span>
                          <span className="text-white font-bold text-lg">
                            {policy.ruleDefinition?.percentage ?? 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Fixed Amount:</span>
                          <span className="text-white font-bold text-lg">
                            ${Number(policy.ruleDefinition?.fixedAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Threshold:</span>
                          <span className="text-white font-bold text-lg">
                            ${Number(policy.ruleDefinition?.thresholdAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
