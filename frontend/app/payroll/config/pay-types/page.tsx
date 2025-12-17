'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';

// Inlined API utilities (previously from _shared/http)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function http<T = any>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
    });

    const status = response.status;
    const ok = response.ok;

    let data: T | undefined;
    let error: string | undefined;

    // Try to parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await response.json();
        if (ok) {
          data = json;
        } else {
          error = json.message || json.error || `HTTP ${status}`;
        }
      } catch (parseError) {
        error = `Failed to parse response: ${parseError}`;
      }
    } else {
      // Handle non-JSON responses
      try {
        const text = await response.text();
        if (ok) {
          data = text as unknown as T;
        } else {
          error = text || `HTTP ${status}`;
        }
      } catch (textError) {
        error = `Failed to read response: ${textError}`;
      }
    }

    if (!ok && !error) {
      error = `Request failed with status ${status}`;
    }

    return {
      ok,
      status,
      data,
      error,
    };
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      error: `Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`,
    };
  }
}

function isDraft(status?: string): boolean {
  return status ? status.toUpperCase() === 'DRAFT' : false;
}

interface PayType {
  _id: string;
  type: string;
  amount: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatePayTypeData {
  type: string;
  amount: number;
}

interface UpdatePayTypeData {
  type?: string;
  amount?: number;
}

export default function PayTypesPage() {
  const { user } = useAuth();
  const [payTypes, setPayTypes] = useState<PayType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayType, setEditingPayType] = useState<PayType | null>(null);
  const [formData, setFormData] = useState<CreatePayTypeData>({ type: '', amount: 0 });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const fetchPayTypes = async () => {
    setLoading(true);
    setError(null);
    const response = await http<PayType[]>('/payroll-configuration/pay-types');
    if (response.ok && response.data) {
      setPayTypes(response.data);
    } else {
      setError(response.error || 'Failed to fetch pay types');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayTypes();
  }, []);

  const handleRefresh = () => {
    fetchPayTypes();
  };

  const validateForm = (data: CreatePayTypeData): string | null => {
    if (!data.type.trim()) {
      return 'Type is required';
    }
    if (typeof data.amount !== 'number' || data.amount < 0) {
      return 'Amount must be a number >= 0';
    }
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    
    const response = await http<PayType>('/payroll-configuration/pay-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsCreateModalOpen(false);
      setFormData({ type: '', amount: 0 });
      fetchPayTypes();
      setSuccess('Pay type created successfully');
    } else {
      setFormError(response.error || 'Failed to create pay type');
    }
    setSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayType) return;

    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const updateData: UpdatePayTypeData = {};
    if (formData.type !== editingPayType.type) updateData.type = formData.type;
    if (formData.amount !== editingPayType.amount) updateData.amount = formData.amount;

    const response = await http<PayType>(`/payroll-configuration/pay-types/${editingPayType._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      setIsEditModalOpen(false);
      setEditingPayType(null);
      setFormData({ type: '', amount: 0 });
      fetchPayTypes();
      setSuccess('Pay type updated successfully');
    } else {
      setFormError(response.error || 'Failed to update pay type');
    }
    setSubmitting(false);
  };

  const openCreateModal = () => {
    setFormData({ type: '', amount: 0 });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (payType: PayType) => {
    setFormData({ type: payType.type, amount: payType.amount });
    setFormError(null);
    setEditingPayType(payType);
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingPayType(null);
    setFormData({ type: '', amount: 0 });
    setFormError(null);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-yellow-600';
      case 'APPROVED': return 'bg-green-600';
      case 'REJECTED': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  // Role-based permission checks
  const canCreate = () => {
    return user?.role === 'Payroll Specialist';
  };

  const canEdit = (payType: PayType) => {
    const isDraftStatus = payType.status?.toUpperCase() === 'DRAFT' || payType.status?.toLowerCase() === 'draft';
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

  const handleApprove = async (payTypeId: string) => {
    const response = await http(`/configurations/payType/${payTypeId}/approve`, {
      method: 'POST',
    });

    if (response.ok) {
      fetchPayTypes();
      setSuccess('Pay type approved successfully');
    } else {
      setError(response.error || 'Failed to approve pay type');
    }
  };

  const handleReject = async (payTypeId: string) => {
    const response = await http(`/configurations/payType/${payTypeId}/reject`, {
      method: 'POST',
    });

    if (response.ok) {
      fetchPayTypes();
      setSuccess('Pay type rejected successfully');
    } else {
      setError(response.error || 'Failed to reject pay type');
    }
  };

  const handleDelete = async (payTypeId: string) => {
    const response = await http(`/configurations/payType/${payTypeId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchPayTypes();
      setSuccess('Pay type deleted successfully');
      setDeleteConfirm(null);
    } else {
      setError(response.error || 'Failed to delete pay type');
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (payTypeId: string) => {
    setDeleteConfirm(payTypeId);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Check if user has permission to view this page
  if (!canView()) {
    return (
      <DashboardLayout title="Access Denied" description="You don't have permission to view this page">
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-red-400">You don't have permission to view pay type configurations.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Payroll Config — Pay Types" 
      description="Manage pay types and compensation structures"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Pay Types</h1>
            <p className="text-gray-400">Configure different types of payment structures (hourly, monthly, contract-based)</p>
            <p className="text-sm text-yellow-400 mt-1">
              Role: {user?.role} | {canCreate() ? 'Can create/edit' : 'View only'}
              {canApproveReject() && ' | Can approve/reject'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
            {canCreate() && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Create Pay Type
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : payTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No pay types found
                  </td>
                </tr>
              ) : (
                payTypes.map((payType) => (
                  <tr key={payType._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{payType.type}</td>
                    <td className="px-6 py-4 text-white">${payType.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBadgeColor(payType.status)}`}>
                        {payType.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {canEdit(payType) && (
                          <button
                            onClick={() => openEditModal(payType)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        
                        {canApproveReject() && (payType.status?.toUpperCase() === 'DRAFT' || payType.status?.toLowerCase() === 'draft') && (
                          <>
                            <button
                              onClick={() => handleApprove(payType._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(payType._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {canDelete() && payType.status !== 'APPROVED' && (
                          <>
                            {deleteConfirm === payType._id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(payType._id)}
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
                                onClick={() => confirmDelete(payType._id)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        
                        {!canEdit(payType) && !canApproveReject() && !canDelete() && (
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

      {/* Create Modal */}
      {isCreateModalOpen && canCreate() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Create Pay Type</h3>
            
            {formError && (
              <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4">
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type *
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly Salary - Full Time"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingPayType && canEdit(editingPayType) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Edit Pay Type</h3>
            
            {formError && (
              <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4">
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type *
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly Salary - Full Time"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}