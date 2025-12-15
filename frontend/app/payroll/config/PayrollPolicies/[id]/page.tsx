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
}

export default function PayrollPolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [policy, setPolicy] = useState<PayrollPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  return (
    <DashboardLayout
      title="Payroll Policy Details"
      description="View a single payroll policy by ID."
    >
      {!user && !isLoading && (
        <p className="text-sm text-gray-300 mb-4">
          You must be logged in to view this policy.
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push('/payroll/config/PayrollPolicies')}
        className="mb-4 text-base text-blue-400 hover:text-blue-300"
      >
        ← Back to Policies
      </button>

      {loading ? (
        <p className="text-sm text-gray-300">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : !policy ? (
        <p className="text-sm text-gray-300">No policy found.</p>
      ) : (
        <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-3 text-sm text-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{policy.policyName}</p>
              <p className="text-xs text-gray-400 mt-1">Type: {policy.policyType}</p>
            </div>
            {policy.status && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
                {policy.status}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-300">
            Effective Date: {policy.effectiveDate || 'N/A'}
          </p>

          <div>
            <p className="font-medium text-white mb-1">Description</p>
            <p className="text-gray-300 whitespace-pre-wrap">{policy.description}</p>
          </div>

          {policy.ruleDefinition && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div>
                <p className="text-xs text-gray-400">Percentage</p>
                <p className="text-sm text-white">{policy.ruleDefinition.percentage ?? '-'}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fixed Amount</p>
                <p className="text-sm text-white">{policy.ruleDefinition.fixedAmount ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Threshold Amount</p>
                <p className="text-sm text-white">{policy.ruleDefinition.thresholdAmount ?? '-'}</p>
              </div>
            </div>
          )}

          <div className="mt-2">
            <p className="text-xs text-gray-400">Applicability</p>
            <p className="text-sm text-white">{policy.applicability}</p>
          </div>

          <p className="text-xs text-gray-500 mt-3">ID: {policy._id}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
