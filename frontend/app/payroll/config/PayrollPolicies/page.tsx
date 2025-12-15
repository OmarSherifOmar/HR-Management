'use client';

import { useEffect, useState } from 'react';
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
  const { user, isLoading } = useAuth();
  const [policies, setPolicies] = useState<PayrollPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<PayrollPolicy>(emptyPolicy);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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

  return (
    <DashboardLayout
      title="Payroll Policies"
      description="Define and manage payroll policies."
    >
      <div className="space-y-4">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Existing Policies</h2>
            {!isLoading && user && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
              >
                + New Policy
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-300 text-sm">Loading...</p>
          ) : policies.length === 0 ? (
            <p className="text-gray-400 text-sm">No payroll policies found yet. Use "+ New" to create one.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {policies.map((policy) => (
                <div
                  key={policy._id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg transition-colors ${
                    editingId === policy._id
                      ? 'bg-[#0f172a] ring-1 ring-blue-500'
                      : 'bg-[#1a1a1a] hover:bg-[#333333]'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-base font-medium text-white">{policy.policyName}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Type: {policy.policyType} | Effective: {policy.effectiveDate}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {policy.description}
                    </p>
                  </div>
                  {policy.status && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white self-start">
                      {policy.status}
                    </span>
                  )}
                  <div className="flex flex-col gap-2 self-start ml-3">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => handleEdit(policy)}
                    >
                      Edit
                    </button>
                    <a
                      href={`/payroll/config/PayrollPolicies/${policy._id}`}
                      className="text-xs px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-center"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}
          {success && (
            <p className="mt-3 text-xs text-green-400">{success}</p>
          )}
        </div>
      </div>

      {isModalOpen && (
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
