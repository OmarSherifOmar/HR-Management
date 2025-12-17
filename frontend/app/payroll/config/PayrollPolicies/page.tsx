'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth, authenticatedFetch } from '../../../context/AuthContext';

interface RuleDefinition {
  percentage: number | '';
  fixedAmount: number | '';
  thresholdAmount: number | '';
}

interface PayrollPolicy {
  _id?: string;
  policyName: string;
  policyType: string;
  description: string;
  effectiveDate: string; // ISO string for input[type=date]
  ruleDefinition: RuleDefinition;
  applicability: string;
  status?: string;
}

const emptyPolicy: PayrollPolicy = {
  policyName: '',
  policyType: '',
  description: '',
  effectiveDate: '',
  ruleDefinition: {
    percentage: 0,
    fixedAmount: 0,
    thresholdAmount: 0,
  },
  applicability: '',
};

export default function PayrollPoliciesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [policies, setPolicies] = useState<PayrollPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<PayrollPolicy>(emptyPolicy);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  // Auto-clear success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Role-based permission checks
  const canCreate = () => {
    return user?.role === 'Payroll Specialist';
  };

  const canEdit = (policy: PayrollPolicy) => {
    const isDraftStatus = policy.status?.toUpperCase() === 'DRAFT' || policy.status?.toLowerCase() === 'draft';
    const canEditRole = user?.role === 'Payroll Specialist' || user?.role === 'Payroll Manager';
    return isDraftStatus && canEditRole;
  };

  const canApproveReject = () => {
    return user?.role === 'Payroll Manager';
  };

  const canDelete = () => {
    return user?.role === 'Payroll Manager';
  };

  const canView = () => {
    const allowedRoles = [
      'Payroll Specialist', 
      'Payroll Manager'
    ];
    return allowedRoles.includes(user?.role || '');
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(
        `${backendBaseUrl}/payroll-configuration/payroll-policies`,
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load payroll policies');
      }

      const data = await res.json();

      // Normalize effectiveDate to yyyy-MM-dd for the date input
      const normalized = data.map((p: any) => ({
        ...p,
        effectiveDate: p.effectiveDate
          ? new Date(p.effectiveDate).toISOString().slice(0, 10)
          : '',
      }));

      setPolicies(normalized);
    } catch (err: any) {
      setError(err.message || 'Error loading payroll policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyPolicy);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId
        ? `${backendBaseUrl}/payroll-configuration/payroll-policies/${editingId}`
        : `${backendBaseUrl}/payroll-configuration/payroll-policies`;

      const payload = {
        policyName: form.policyName,
        policyType: form.policyType,
        description: form.description,
        effectiveDate: form.effectiveDate,
        ruleDefinition: {
          percentage: Number(form.ruleDefinition.percentage),
          fixedAmount: Number(form.ruleDefinition.fixedAmount),
          thresholdAmount: Number(form.ruleDefinition.thresholdAmount),
        },
        applicability: form.applicability,
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save payroll policy');
      }

      await fetchPolicies();
      resetForm();
      setSuccess(
        editingId ? 'Payroll policy updated successfully' : 'Payroll policy created successfully',
      );
    } catch (err: any) {
      setError(err.message || 'Error saving payroll policy');
    }
  };

  const handleEdit = (policy: PayrollPolicy) => {
    setForm({
      _id: policy._id,
      policyName: policy.policyName,
      policyType: policy.policyType,
      description: policy.description,
      effectiveDate: policy.effectiveDate
        ? new Date(policy.effectiveDate).toISOString().slice(0, 10)
        : '',
      ruleDefinition: {
        percentage: policy.ruleDefinition?.percentage ?? 0,
        fixedAmount: policy.ruleDefinition?.fixedAmount ?? 0,
        thresholdAmount: policy.ruleDefinition?.thresholdAmount ?? 0,
      },
      applicability: policy.applicability,
      status: policy.status,
    });
    setEditingId(policy._id || null);
    setIsModalOpen(true);
  };

  const handleApprove = async (policyId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/payrollPolicies/${policyId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchPolicies();
        setSuccess('Policy approved successfully');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to approve policy');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve policy');
    }
  };

  const handleReject = async (policyId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/payrollPolicies/${policyId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchPolicies();
        setSuccess('Policy rejected successfully');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to reject policy');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject policy');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/payrollPolicies/${policyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPolicies();
        setSuccess('Policy deleted successfully');
        setDeleteConfirm(null);
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to delete policy');
        setDeleteConfirm(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete policy');
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (policyId: string) => {
    setDeleteConfirm(policyId);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-yellow-600';
      case 'APPROVED': return 'bg-green-600';
      case 'REJECTED': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

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
      title="Payroll Config — Policies"
      description="Define and manage payroll policies."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Payroll Policies</h1>
            <p className="text-gray-400">Configure payroll policies for deductions, allowances, and benefits</p>
            <p className="text-sm text-yellow-400 mt-1">
              Role: {user?.role} | {canCreate() ? 'Can create/edit' : 'View only'}
              {canApproveReject() && ' | Can approve/reject'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchPolicies()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
            {canCreate() && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Create Policy
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#333333]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Policy Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Effective Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fixed Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Applicability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                      No policies found
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr key={policy._id} className="hover:bg-[#333333] transition-colors">
                      <td className="px-4 py-4 text-white font-medium max-w-[150px] truncate">
                        {policy.policyName}
                      </td>
                      <td className="px-4 py-4 text-white">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          {policy.policyType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-300 max-w-[200px] truncate">
                        {policy.description}
                      </td>
                      <td className="px-4 py-4 text-white">
                        {new Date(policy.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-white">
                        {policy.ruleDefinition?.percentage || 0}%
                      </td>
                      <td className="px-4 py-4 text-white">
                        ${Number(policy.ruleDefinition?.fixedAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-white max-w-[120px] truncate">
                        {policy.applicability}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBadgeColor(policy.status)}`}>
                          {policy.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2 flex-wrap">
                          <button
                            onClick={() => router.push(`/payroll/config/PayrollPolicies/${policy._id}`)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                          >
                            View
                          </button>
                          
                          {canEdit(policy) && (
                            <button
                              onClick={() => handleEdit(policy)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          
                          {canApproveReject() && (policy.status?.toUpperCase() === 'DRAFT' || policy.status?.toLowerCase() === 'draft') && (
                            <>
                              <button
                                onClick={() => handleApprove(policy._id!)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(policy._id!)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {canDelete() && policy.status !== 'APPROVED' && (
                            <>
                              {deleteConfirm === policy._id ? (
                                <>
                                  <button
                                    onClick={() => handleDeletePolicy(policy._id!)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={cancelDelete}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => confirmDelete(policy._id!)}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                          
                          {!canEdit(policy) && !canApproveReject() && !canDelete() && (
                            <span className="px-3 py-1 bg-gray-600 text-gray-400 text-sm rounded">
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (canCreate() || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-xl bg-[#111827] border border-gray-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Payroll Policy' : 'Create Payroll Policy'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <p className="text-gray-300 text-sm">Checking authentication...</p>
            ) : !user ? (
              <p className="text-gray-300 text-sm">
                You must be logged in to manage payroll policies.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Policy Name</label>
                  <input
                    type="text"
                    required
                    value={form.policyName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, policyName: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Policy Type</label>
                  <select
                    required
                    value={form.policyType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, policyType: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="" disabled>Select policy type</option>
                    <option value="Deduction">Deduction</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Benefit">Benefit</option>
                    <option value="Misconduct">Misconduct</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={form.effectiveDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, effectiveDate: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Percentage</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step={1}
                      value={form.ruleDefinition.percentage}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          setForm((prev) => ({
                            ...prev,
                            ruleDefinition: {
                              ...prev.ruleDefinition,
                              percentage: '',
                            },
                          }));
                        }
                      }}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ruleDefinition: {
                            ...prev.ruleDefinition,
                            percentage: e.target.value === '' ? '' : Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Fixed Amount</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1}
                      value={form.ruleDefinition.fixedAmount}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          setForm((prev) => ({
                            ...prev,
                            ruleDefinition: {
                              ...prev.ruleDefinition,
                              fixedAmount: '',
                            },
                          }));
                        }
                      }}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ruleDefinition: {
                            ...prev.ruleDefinition,
                            fixedAmount: e.target.value === '' ? '' : Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Threshold Amount</label>
                    <input
                      type="number"
                      required
                      min={1}
                      step={1}
                      value={form.ruleDefinition.thresholdAmount}
                      onFocus={(e) => {
                        if (e.target.value === '0') {
                          setForm((prev) => ({
                            ...prev,
                            ruleDefinition: {
                              ...prev.ruleDefinition,
                              thresholdAmount: '',
                            },
                          }));
                        }
                      }}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ruleDefinition: {
                            ...prev.ruleDefinition,
                            thresholdAmount: e.target.value === '' ? '' : Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Applicability</label>
                  <select
                    required
                    value={form.applicability}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, applicability: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="" disabled>Select applicability</option>
                    <option value="All Employees">All Employees</option>
                    <option value="Full Time Employees">Full Time Employees</option>
                    <option value="Part Time Employees">Part Time Employees</option>
                    <option value="Contractors">Contractors</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-60"
                    disabled={loading}
                  >
                    {editingId ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
