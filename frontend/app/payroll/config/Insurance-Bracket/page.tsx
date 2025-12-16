"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Trash2, Edit, Check, X } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function http<T = any>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
    });

    const status = response.status;
    const ok = response.ok;

    let data: T | undefined;
    let error: string | undefined;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await response.json();
        if (ok) data = json;
        else error = json.message || json.error || `HTTP ${status}`;
      } catch (parseError) {
        error = `Failed to parse response: ${parseError}`;
      }
    } else {
      try {
        const text = await response.text();
        if (ok) data = text as unknown as T;
        else error = text || `HTTP ${status}`;
      } catch (textError) {
        error = `Failed to read response: ${textError}`;
      }
    }

    if (!ok && !error) error = `Request failed with status ${status}`;

    return { ok, status, data, error };
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

interface InsuranceBracket {
  _id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateInsuranceBracketData {
  name: string;
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
}

interface UpdateInsuranceBracketData {
  name?: string;
  minSalary?: number;
  maxSalary?: number;
  employeeRate?: number;
  employerRate?: number;
}

export default function InsuranceBracketsPage() {
  const [brackets, setBrackets] = useState<InsuranceBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBracket, setEditingBracket] = useState<InsuranceBracket | null>(null);

  const [formData, setFormData] = useState<CreateInsuranceBracketData>({ name: '', minSalary: 0, maxSalary: 0, employeeRate: 0, employerRate: 0 });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBrackets = async () => {
    setLoading(true);
    setError(null);
    const res = await http<InsuranceBracket[]>('/payroll-configuration/insurance-brackets');
    if (res.ok && res.data) setBrackets(res.data);
    else setError(res.error || 'Failed to fetch insurance brackets');
    setLoading(false);
  };

  useEffect(() => {
    fetchBrackets();
  }, []);

  const handleRefresh = () => fetchBrackets();

  const validate = (data: CreateInsuranceBracketData) => {
    if (!data.name.trim()) return 'Name is required';
    if (typeof data.minSalary !== 'number' || Number.isNaN(data.minSalary) || data.minSalary < 0) return 'Min salary must be a number >= 0';
    if (typeof data.maxSalary !== 'number' || Number.isNaN(data.maxSalary) || data.maxSalary < 0) return 'Max salary must be a number >= 0';
    if (data.maxSalary < data.minSalary) return 'Max salary must be >= Min salary';
    if (typeof data.employeeRate !== 'number' || Number.isNaN(data.employeeRate) || data.employeeRate < 0) return 'Employee rate must be >= 0';
    if (typeof data.employerRate !== 'number' || Number.isNaN(data.employerRate) || data.employerRate < 0) return 'Employer rate must be >= 0';
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(formData);
    if (v) {
      setFormError(v);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const res = await http<InsuranceBracket>('/payroll-configuration/insurance-brackets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsCreateOpen(false);
      setFormData({ name: '', minSalary: 0, maxSalary: 0, employeeRate: 0, employerRate: 0 });
      fetchBrackets();
    } else setFormError(res.error || 'Failed to create insurance bracket');
    setSubmitting(false);
  };

  const openEdit = (b: InsuranceBracket) => {
    setEditingBracket(b);
    setFormData({ name: b.name, minSalary: b.minSalary, maxSalary: b.maxSalary, employeeRate: b.employeeRate, employerRate: b.employerRate });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBracket) return;
    // Validate using the same rules; allow partial updates but keep check for logical errors when fields present
    const v = validate(formData);
    if (v) {
      setFormError(v);
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const updateData: UpdateInsuranceBracketData = {};
    if (formData.name !== editingBracket.name) updateData.name = formData.name;
    if (formData.minSalary !== editingBracket.minSalary) updateData.minSalary = formData.minSalary;
    if (formData.maxSalary !== editingBracket.maxSalary) updateData.maxSalary = formData.maxSalary;
    if (formData.employeeRate !== editingBracket.employeeRate) updateData.employeeRate = formData.employeeRate;
    if (formData.employerRate !== editingBracket.employerRate) updateData.employerRate = formData.employerRate;

    const res = await http<InsuranceBracket>(`/payroll-configuration/insurance-brackets/${editingBracket._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (res.ok) {
      setIsEditOpen(false);
      setEditingBracket(null);
      setFormData({ name: '', minSalary: 0, maxSalary: 0, employeeRate: 0, employerRate: 0 });
      fetchBrackets();
    } else setFormError(res.error || 'Failed to update insurance bracket');
    setSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this insurance bracket?')) return;
    const res = await http(`/payroll-configuration/insurance-brackets/${id}/approve`, { method: 'POST' });
    if (res.ok) fetchBrackets();
    else alert(res.error || 'Failed to approve');
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this insurance bracket?')) return;
    const res = await http(`/payroll-configuration/insurance-brackets/${id}/reject`, { method: 'POST' });
    if (res.ok) fetchBrackets();
    else alert(res.error || 'Failed to reject');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this insurance bracket? This action cannot be undone.')) return;
    const res = await http(`/payroll-configuration/insurance-brackets/${id}`, { method: 'DELETE' });
    if (res.ok) fetchBrackets();
    else alert(res.error || 'Failed to delete');
  };

  return (
    <DashboardLayout title="Payroll Config — Insurance Brackets" description="Manage insurance brackets and contribution rates">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Insurance Brackets</h1>
            <p className="text-gray-400">Define salary ranges and contribution rates for insurance calculations</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Refresh</button>
            <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">+ Create Bracket</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#333333]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salary Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employer %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : brackets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No insurance brackets found</td>
                </tr>
              ) : (
                brackets.map((b) => (
                  <tr key={b._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{b.name}</td>
                    <td className="px-6 py-4 text-white">{b.minSalary.toLocaleString()} - {b.maxSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-white">{b.employeeRate}%</td>
                    <td className="px-6 py-4 text-white">{b.employerRate}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                        b.status === 'APPROVED' ? 'bg-green-600' : b.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}>
                        {b.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={() => openEdit(b)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2">
                        <Edit size={14} /> Edit
                      </button>

                      {b.status !== 'APPROVED' && (
                        <button onClick={() => handleApprove(b._id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-2">
                          <Check size={14} /> Approve
                        </button>
                      )}

                      {b.status !== 'REJECTED' && (
                        <button onClick={() => handleReject(b._id)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded flex items-center gap-2">
                          <X size={14} /> Reject
                        </button>
                      )}

                      <button onClick={() => handleDelete(b._id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Create Insurance Bracket</h3>
              {formError && <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4"><p className="text-red-300 text-sm">{formError}</p></div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Salary *</label>
                    <input type="number" value={formData.minSalary} onChange={(e) => setFormData(prev => ({ ...prev, minSalary: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Salary *</label>
                    <input type="number" value={formData.maxSalary} onChange={(e) => setFormData(prev => ({ ...prev, maxSalary: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employee Rate (%) *</label>
                    <input type="number" value={formData.employeeRate} onChange={(e) => setFormData(prev => ({ ...prev, employeeRate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employer Rate (%) *</label>
                    <input type="number" value={formData.employerRate} onChange={(e) => setFormData(prev => ({ ...prev, employerRate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white" disabled={submitting}>Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{submitting ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditOpen && editingBracket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Edit Insurance Bracket</h3>
              {formError && <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4"><p className="text-red-300 text-sm">{formError}</p></div>}
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Salary *</label>
                    <input type="number" value={formData.minSalary} onChange={(e) => setFormData(prev => ({ ...prev, minSalary: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Salary *</label>
                    <input type="number" value={formData.maxSalary} onChange={(e) => setFormData(prev => ({ ...prev, maxSalary: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employee Rate (%) *</label>
                    <input type="number" value={formData.employeeRate} onChange={(e) => setFormData(prev => ({ ...prev, employeeRate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employer Rate (%) *</label>
                    <input type="number" value={formData.employerRate} onChange={(e) => setFormData(prev => ({ ...prev, employerRate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setIsEditOpen(false); setEditingBracket(null); }} className="px-4 py-2 text-gray-300 hover:text-white" disabled={submitting}>Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{submitting ? 'Updating...' : 'Update'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
