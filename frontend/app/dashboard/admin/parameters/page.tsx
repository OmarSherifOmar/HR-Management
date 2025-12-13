'use client';

import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Calendar, Clock, Users, CheckCircle, AlertCircle, Save } from 'lucide-react';

type LeavePolicy = {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
  };
  maxConsecutiveDays?: number;
  minNoticeDays: number;
};

type PolicyParameter = {
  policyId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  maxConsecutiveDays?: number;
  minNoticeDays: number;
  approvalWorkflow?: {
    requiresSupervisorApproval: boolean;
    requiresHRApproval: boolean;
    autoApproveUnderDays?: number;
    approvalLevels?: number;
  };
};

export default function LeaveParametersPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [parameters, setParameters] = useState<Map<string, PolicyParameter>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

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
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/leaves/configuration/policies', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      setPolicies(data);

      // Initialize parameters map
      const paramsMap = new Map<string, PolicyParameter>();
      for (const policy of data) {
        const leaveTypeName = typeof policy.leaveTypeId === 'string' 
          ? 'Unknown' 
          : policy.leaveTypeId.name;
        const leaveTypeCode = typeof policy.leaveTypeId === 'string' 
          ? 'N/A' 
          : policy.leaveTypeId.code;

        paramsMap.set(policy._id, {
          policyId: policy._id,
          leaveTypeName,
          leaveTypeCode,
          maxConsecutiveDays: policy.maxConsecutiveDays,
          minNoticeDays: policy.minNoticeDays || 0,
          approvalWorkflow: {
            requiresSupervisorApproval: true,
            requiresHRApproval: false,
            autoApproveUnderDays: undefined,
            approvalLevels: 1,
          },
        });
      }
      setParameters(paramsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const updateParameter = (policyId: string, field: string, value: any) => {
    setParameters(prev => {
      const newMap = new Map(prev);
      const param = newMap.get(policyId);
      if (param) {
        if (field.startsWith('approvalWorkflow.')) {
          const workflowField = field.split('.')[1];
          param.approvalWorkflow = {
            ...param.approvalWorkflow!,
            [workflowField]: value,
          };
        } else {
          (param as any)[field] = value;
        }
        newMap.set(policyId, param);
      }
      return newMap;
    });
  };

  const saveParameters = async (policyId: string) => {
    const param = parameters.get(policyId);
    if (!param) return;

    try {
      setSaving(true);
      setError(null);

      // Update duration and notice parameters
      const paramResponse = await fetch(`http://localhost:3000/leaves/parameters/policy/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          maxConsecutiveDays: param.maxConsecutiveDays,
          minNoticeDays: param.minNoticeDays,
        }),
      });

      if (!paramResponse.ok) {
        throw new Error('Failed to update parameters');
      }

      // Update approval workflow
      if (param.approvalWorkflow) {
        const workflowResponse = await fetch(
          `http://localhost:3000/leaves/parameters/policy/${policyId}/approval-workflow`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(param.approvalWorkflow),
          }
        );

        if (!workflowResponse.ok) {
          throw new Error('Failed to update approval workflow');
        }
      }

      setSuccess(`Parameters updated successfully for ${param.leaveTypeName}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save parameters');
    } finally {
      setSaving(false);
    }
  };

  const bulkSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = Array.from(parameters.values()).map(param => ({
        policyId: param.policyId,
        maxConsecutiveDays: param.maxConsecutiveDays,
        minNoticeDays: param.minNoticeDays,
      }));

      const response = await fetch('http://localhost:3000/leaves/parameters/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update parameters');
      }

      setSuccess('All parameters updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save all parameters');
    } finally {
      setSaving(false);
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
      title="Leave Parameters Configuration"
      description="Configure duration limits, notice periods, and approval workflows for leave policies"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="text-purple-500" size={28} />
              Leave Parameters Configuration
            </h1>
          </div>
          <button
            onClick={bulkSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Info Card */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg text-blue-400">
          <p className="text-sm">
            <strong>User Story REQ-009:</strong> Configure leave parameters including maximum duration, notice periods, 
            and multi-level approval workflows. These settings define how leave requests are processed and approved.
          </p>
        </div>

        {/* Parameters Grid */}
        {policies.length === 0 ? (
          <div className="text-center py-12">
            <Settings size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No policies configured yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Create leave policies first to configure their parameters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(parameters.values()).map((param) => {
              const isExpanded = selectedPolicy === param.policyId;
              
              return (
                <div
                  key={param.policyId}
                  className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Policy Header */}
                  <div
                    className="p-4 bg-gray-800/50 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedPolicy(isExpanded ? null : param.policyId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <span className="text-purple-400 font-bold">{param.leaveTypeCode}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{param.leaveTypeName}</h3>
                        <p className="text-sm text-gray-400">
                          Notice: {param.minNoticeDays || 0} days
                          {param.maxConsecutiveDays && ` • Max Duration: ${param.maxConsecutiveDays} days`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveParameters(param.policyId);
                        }}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                      <span className="text-gray-400 text-xl">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {/* Expanded Parameters Form */}
                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      {/* Duration & Notice Section */}
                      <div>
                        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                          <Calendar className="text-purple-400" size={20} />
                          Duration & Notice Parameters
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Clock size={16} className="inline mr-2" />
                              Minimum Notice Days
                            </label>
                            <input
                              type="number"
                              value={param.minNoticeDays || ''}
                              onChange={(e) => updateParameter(param.policyId, 'minNoticeDays', Number(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                              placeholder="0"
                              min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Days in advance required before leave starts
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Calendar size={16} className="inline mr-2" />
                              Maximum Consecutive Days
                            </label>
                            <input
                              type="number"
                              value={param.maxConsecutiveDays || ''}
                              onChange={(e) => updateParameter(param.policyId, 'maxConsecutiveDays', e.target.value === '' ? undefined : Number(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                              placeholder="Unlimited"
                              min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum days allowed per request (leave blank for no limit)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Approval Workflow Section */}
                      <div className="border-t border-gray-800 pt-6">
                        <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                          <Users className="text-purple-400" size={20} />
                          Approval Workflow Configuration
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Approval Toggles */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-300">Requires Supervisor Approval</span>
                              <button
                                type="button"
                                onClick={() => updateParameter(
                                  param.policyId, 
                                  'approvalWorkflow.requiresSupervisorApproval', 
                                  !param.approvalWorkflow?.requiresSupervisorApproval
                                )}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  param.approvalWorkflow?.requiresSupervisorApproval ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                    param.approvalWorkflow?.requiresSupervisorApproval ? 'translate-x-6' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-300">Requires HR Approval</span>
                              <button
                                type="button"
                                onClick={() => updateParameter(
                                  param.policyId, 
                                  'approvalWorkflow.requiresHRApproval', 
                                  !param.approvalWorkflow?.requiresHRApproval
                                )}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  param.approvalWorkflow?.requiresHRApproval ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                    param.approvalWorkflow?.requiresHRApproval ? 'translate-x-6' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Additional Workflow Settings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Auto-Approve Under Days
                              </label>
                              <input
                                type="number"
                                value={param.approvalWorkflow?.autoApproveUnderDays || ''}
                                onChange={(e) => updateParameter(
                                  param.policyId, 
                                  'approvalWorkflow.autoApproveUnderDays', 
                                  e.target.value === '' ? undefined : Number(e.target.value)
                                )}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                placeholder="Not set"
                                min="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Automatically approve requests under this many days
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Approval Levels
                              </label>
                              <select
                                value={param.approvalWorkflow?.approvalLevels || 1}
                                onChange={(e) => updateParameter(
                                  param.policyId, 
                                  'approvalWorkflow.approvalLevels', 
                                  Number(e.target.value)
                                )}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                              >
                                <option value={1}>1 Level (Manager)</option>
                                <option value={2}>2 Levels (Manager → HR)</option>
                                <option value={3}>3 Levels (Manager → HR → Director)</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Number of approval levels required
                              </p>
                            </div>
                          </div>

                          {/* Approval Chain Visualization */}
                          <div className="p-4 bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-400 mb-2">Approval Chain:</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded">
                                Employee
                              </span>
                              <span className="text-gray-500">→</span>
                              {param.approvalWorkflow?.requiresSupervisorApproval && (
                                <>
                                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded">
                                    Supervisor/Manager
                                  </span>
                                  <span className="text-gray-500">→</span>
                                </>
                              )}
                              {param.approvalWorkflow?.requiresHRApproval && (
                                <>
                                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded">
                                    HR Admin
                                  </span>
                                  <span className="text-gray-500">→</span>
                                </>
                              )}
                              {param.approvalWorkflow?.approvalLevels && param.approvalWorkflow.approvalLevels >= 3 && (
                                <>
                                  <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded">
                                    Director
                                  </span>
                                  <span className="text-gray-500">→</span>
                                </>
                              )}
                              <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded">
                                Approved
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
