'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth, authenticatedFetch } from '../../../context/AuthContext';

interface TerminationBenefit {
  _id?: string;
  name: string;
  amount: number | '';
  terms: string;
  status?: string;
}

export default function TerminationBenefitsPage() {
  const { user, isLoading } = useAuth();
  const [benefits, setBenefits] = useState<TerminationBenefit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<TerminationBenefit>({
    name: '',
    amount: 0,
    terms: '',
  });
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

  const canEdit = (benefit: TerminationBenefit) => {
    const isDraftStatus = benefit.status?.toUpperCase() === 'DRAFT' || benefit.status?.toLowerCase() === 'draft';
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

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(
        `${backendBaseUrl}/payroll-configuration/termination-benefits`,
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load termination benefits');
      }

      const data = await res.json();
      setBenefits(data);
    } catch (err: any) {
      setError(err.message || 'Error loading termination benefits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: '', amount: 0, terms: '' });
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
        ? `${backendBaseUrl}/payroll-configuration/termination-benefits/${editingId}`
        : `${backendBaseUrl}/payroll-configuration/termination-benefits`;

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          amount: Number(form.amount),
          terms: form.terms,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save termination benefit');
      }

      await fetchBenefits();
      resetForm();
      setSuccess(
        editingId ? 'Termination benefit updated successfully' : 'Termination benefit created successfully',
      );
    } catch (err: any) {
      setError(err.message || 'Error saving termination benefit');
    }
  };

  const handleEdit = (benefit: TerminationBenefit) => {
    setForm({
      _id: benefit._id,
      name: benefit.name,
      amount: benefit.amount,
      terms: benefit.terms,
      status: benefit.status,
    });
    setEditingId(benefit._id || null);
    setIsModalOpen(true);
  };

  const handleApprove = async (benefitId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/terminationAndResignationBenefits/${benefitId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchBenefits();
        setSuccess('Termination benefit approved successfully');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to approve termination benefit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve termination benefit');
    }
  };

  const handleReject = async (benefitId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/terminationAndResignationBenefits/${benefitId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchBenefits();
        setSuccess('Termination benefit rejected successfully');
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to reject termination benefit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject termination benefit');
    }
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    try {
      const response = await authenticatedFetch(`${backendBaseUrl}/configurations/terminationAndResignationBenefits/${benefitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBenefits();
        setSuccess('Termination benefit deleted successfully');
        setDeleteConfirm(null);
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to delete termination benefit');
        setDeleteConfirm(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete termination benefit');
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (benefitId: string) => {
    setDeleteConfirm(benefitId);
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
          <p className="text-red-400">You don't have permission to view termination benefit configurations.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Payroll Config — Termination Benefits"
      description="Manage termination and resignation benefits"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Termination Benefits</h1>
            <p className="text-gray-400">Configure termination and resignation benefits for employees</p>
            <p className="text-sm text-yellow-400 mt-1">
              Role: {user?.role} | {canCreate() ? 'Can create/edit' : 'View only'}
              {canApproveReject() && ' | Can approve/reject'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchBenefits()}
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
                + Create Benefit
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
          <table className="w-full">
            <thead className="bg-[#333333]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Terms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : benefits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No termination benefits found
                  </td>
                </tr>
              ) : (
                benefits.map((benefit) => (
                  <tr key={benefit._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{benefit.name}</td>
                    <td className="px-6 py-4 text-white">${Number(benefit.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-white max-w-xs truncate">{benefit.terms}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBadgeColor(benefit.status)}`}>
                        {benefit.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {canEdit(benefit) && (
                          <button
                            onClick={() => handleEdit(benefit)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        
                        {canApproveReject() && (benefit.status?.toUpperCase() === 'DRAFT' || benefit.status?.toLowerCase() === 'draft') && (
                          <>
                            <button
                              onClick={() => handleApprove(benefit._id!)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(benefit._id!)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {canDelete() && benefit.status !== 'APPROVED' && (
                          <>
                            {deleteConfirm === benefit._id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteBenefit(benefit._id!)}
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
                                onClick={() => confirmDelete(benefit._id!)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        
                        {!canEdit(benefit) && !canApproveReject() && !canDelete() && (
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

      {/* Modal */}
      {isModalOpen && (canCreate() || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl bg-[#111827] border border-gray-700 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Termination Benefit' : 'Create Termination Benefit'}
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
                You must be logged in to manage termination benefits.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={form.amount}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        setForm((prev) => ({ ...prev, amount: '' }));
                      }
                    }}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Terms</label>
                  <textarea
                    required
                    rows={4}
                    value={form.terms}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, terms: e.target.value }))
                    }
                    className="w-full rounded-md bg-[#1a1a1a] border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
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
