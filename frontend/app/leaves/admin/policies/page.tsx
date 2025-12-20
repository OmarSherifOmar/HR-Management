'use client';

import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Calendar, Users, Clock, Settings } from 'lucide-react';

type LeavePolicy = {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
  } | string;
  annualEntitlement: number;
  waitingPeriod: {
    enabled: boolean;
    months: number;
  };
  carryOverRules: {
    enabled: boolean;
    maxDays: number;
    expirationMonths: number;
  };
  accrualRate: {
    enabled: boolean;
    ratePerMonth: number;
  };
  createdAt: string;
  updatedAt: string;
};

export default function AdminPoliciesPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    // Check if user is HR Admin
    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (isLoggedIn && user?.role === 'HR Admin') {
      fetchPolicies();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchPolicies = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      setError(null);
      const response = await fetch(`${URL}/leaves/configuration/policies`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch policies:', response.status, errorText);
        throw new Error(`Failed to fetch policies: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched policies:', data);
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/leaves/configuration/policies/${policyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete policy');
      }

      setPolicies(policies.filter(p => p._id !== policyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  return (
    <DashboardLayout
      title="Leave Policy Management"
      description="Configure and manage leave policies for the organization"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="text-blue-500" size={28} />
              Leave Policy Management
            </h1>
          </div>
          <button
            onClick={() => router.push('/leaves/admin/policies/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create Policy
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No policies configured yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Click "Create Policy" to get started
              </p>
            </div>
          ) : (
            policies.map((policy) => (
              <div
                key={policy._id}
                className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {policy.leaveTypeId ? (typeof policy.leaveTypeId === 'string' ? 'Leave Type' : policy.leaveTypeId.name) : 'Unknown Leave Type'}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">
                      {policy.leaveTypeId ? (typeof policy.leaveTypeId === 'string' ? policy.leaveTypeId : policy.leaveTypeId.code) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/leaves/admin/policies/create?id=${policy._id}`)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit Policy"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletePolicy(policy._id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Policy"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">

                  {policy.accrualRate?.enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-green-400" />
                      <span className="text-gray-400">Accrual Rate:</span>
                      <span className="text-white font-semibold ml-auto">
                        {policy.accrualRate.ratePerMonth} days/month
                      </span>
                    </div>
                  )}

                  {policy.waitingPeriod?.enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-yellow-400" />
                      <span className="text-gray-400">Waiting Period:</span>
                      <span className="text-white font-semibold ml-auto">
                        {policy.waitingPeriod.months} months
                      </span>
                    </div>
                  )}

                  {policy.carryOverRules?.enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <Settings size={16} className="text-purple-400" />
                      <span className="text-gray-400">Max Carry-over:</span>
                      <span className="text-white font-semibold ml-auto">
                        {policy.carryOverRules.maxDays} days
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => router.push(`/leaves/admin/policies/create?id=${policy._id}`)}
                    className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
