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

interface PayGrade {
  _id: string;
  grade: string;
  baseSalary: number;
  grossSalary: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatePayGradeData {
  grade: string;
  baseSalary: number;
  grossSalary: number;
}

interface UpdatePayGradeData {
  grade?: string;
  baseSalary?: number;
  grossSalary?: number;
}

export default function PayGradesPage() {
  const { user } = useAuth();
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayGrade, setEditingPayGrade] = useState<PayGrade | null>(null);
  const [formData, setFormData] = useState<CreatePayGradeData>({ grade: '', baseSalary: 0, grossSalary: 0 });
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

  // Role-based permission checks
  const canCreate = () => {
    return user?.role === 'Payroll Specialist';
  };

  const canEdit = (payGrade: PayGrade) => {
    const isDraftStatus = payGrade.status?.toUpperCase() === 'DRAFT' || payGrade.status?.toLowerCase() === 'draft';
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

  const fetchPayGrades = async () => {
    setLoading(true);
    setError(null);
    const response = await http<PayGrade[]>('/payroll-configuration/pay-grades');
    if (response.ok && response.data) {
      setPayGrades(response.data);
    } else {
      setError(response.error || 'Failed to fetch pay grades');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayGrades();
  }, []);

  const handleRefresh = () => {
    fetchPayGrades();
  };

  const validateForm = (data: CreatePayGradeData): string | null => {
    if (!data.grade.trim()) {
      return 'Grade is required';
    }
    if (typeof data.baseSalary !== 'number' || data.baseSalary < 6000) {
      return 'Base salary must be at least 6000';
    }
    if (typeof data.grossSalary !== 'number' || data.grossSalary < 6000) {
      return 'Gross salary must be at least 6000';
    }
    if (data.grossSalary < data.baseSalary) {
      return 'Gross salary must be >= base salary';
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
    
    const response = await http<PayGrade>('/payroll-configuration/pay-grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsCreateModalOpen(false);
      setFormData({ grade: '', baseSalary: 0, grossSalary: 0 });
      fetchPayGrades();
      setSuccess('Pay grade created successfully');
    } else {
      setFormError(response.error || 'Failed to create pay grade');
    }
    setSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayGrade) return;

    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const updateData: UpdatePayGradeData = {};
    if (formData.grade !== editingPayGrade.grade) updateData.grade = formData.grade;
    if (formData.baseSalary !== editingPayGrade.baseSalary) updateData.baseSalary = formData.baseSalary;
    if (formData.grossSalary !== editingPayGrade.grossSalary) updateData.grossSalary = formData.grossSalary;

    const response = await http<PayGrade>(`/payroll-configuration/pay-grades/${editingPayGrade._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      setIsEditModalOpen(false);
      setEditingPayGrade(null);
      setFormData({ grade: '', baseSalary: 0, grossSalary: 0 });
      fetchPayGrades();
      setSuccess('Pay grade updated successfully');
    } else {
      setFormError(response.error || 'Failed to update pay grade');
    }
    setSubmitting(false);
  };

  const handleApprove = async (payGradeId: string) => {
    const response = await http(`/payroll-configuration/pay-grades/${payGradeId}/approve`, {
      method: 'POST',
    });

    if (response.ok) {
      fetchPayGrades();
      setSuccess('Pay grade approved successfully');
    } else {
      setError(response.error || 'Failed to approve pay grade');
    }
  };

  const handleReject = async (payGradeId: string) => {
    const response = await http(`/payroll-configuration/pay-grades/${payGradeId}/reject`, {
      method: 'POST',
    });

    if (response.ok) {
      fetchPayGrades();
      setSuccess('Pay grade rejected successfully');
    } else {
      setError(response.error || 'Failed to reject pay grade');
    }
  };

  const handleDelete = async (payGradeId: string) => {
    const response = await http(`/payroll-configuration/pay-grades/${payGradeId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchPayGrades();
      setSuccess('Pay grade deleted successfully');
      setDeleteConfirm(null);
    } else {
      setError(response.error || 'Failed to delete pay grade');
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (payGradeId: string) => {
    setDeleteConfirm(payGradeId);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const openCreateModal = () => {
    setFormData({ grade: '', baseSalary: 0, grossSalary: 0 });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (payGrade: PayGrade) => {
    setFormData({ 
      grade: payGrade.grade, 
      baseSalary: payGrade.baseSalary, 
      grossSalary: payGrade.grossSalary 
    });
    setFormError(null);
    setEditingPayGrade(payGrade);
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingPayGrade(null);
    setFormData({ grade: '', baseSalary: 0, grossSalary: 0 });
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

  // Check if user has permission to view this page
  if (!canView()) {
    return (
      <DashboardLayout title="Access Denied" description="You don't have permission to view this page">
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-red-400">You don't have permission to view pay grade configurations.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Payroll Config — Pay Grades" 
      description="Manage pay grades with salary bands and compensation levels"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Pay Grades</h1>
            <p className="text-gray-400">Configure pay grades with base and gross salary information</p>
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
                + Create Pay Grade
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Base Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gross Salary</th>
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
              ) : payGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No pay grades found
                  </td>
                </tr>
              ) : (
                payGrades.map((payGrade) => (
                  <tr key={payGrade._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{payGrade.grade}</td>
                    <td className="px-6 py-4 text-white">${payGrade.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-white">${payGrade.grossSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBadgeColor(payGrade.status)}`}>
                        {payGrade.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {canEdit(payGrade) && (
                          <button
                            onClick={() => openEditModal(payGrade)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        
                        {canApproveReject() && (payGrade.status?.toUpperCase() === 'DRAFT' || payGrade.status?.toLowerCase() === 'draft') && (
                          <>
                            <button
                              onClick={() => handleApprove(payGrade._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(payGrade._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {canDelete() && payGrade.status !== 'APPROVED' && (
                          <>
                            {deleteConfirm === payGrade._id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(payGrade._id)}
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
                                onClick={() => confirmDelete(payGrade._id)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        
                        {!canEdit(payGrade) && !canApproveReject() && !canDelete() && (
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
            <h3 className="text-xl font-bold text-white mb-4">Create Pay Grade</h3>
            
            {formError && (
              <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4">
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grade *
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Junior Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="6000"
                  step="0.01"
                  placeholder="6000.00"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Minimum base salary: 6000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gross Salary *
                </label>
                <input
                  type="number"
                  value={formData.grossSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, grossSalary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="6000"
                  step="0.01"
                  placeholder="6000.00"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Minimum gross salary: 6000, must be ≥ base salary</p>
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
      {isEditModalOpen && editingPayGrade && canEdit(editingPayGrade) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Edit Pay Grade</h3>
            
            {formError && (
              <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4">
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grade *
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Junior Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="6000"
                  step="0.01"
                  placeholder="6000.00"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Minimum base salary: 6000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gross Salary *
                </label>
                <input
                  type="number"
                  value={formData.grossSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, grossSalary: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                  min="6000"
                  step="0.01"
                  placeholder="6000.00"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Minimum gross salary: 6000, must be ≥ base salary</p>
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