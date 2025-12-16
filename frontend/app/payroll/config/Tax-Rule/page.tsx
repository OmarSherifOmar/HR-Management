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

interface TaxRule {
  _id: string;
  name: string;
  description?: string;
  rate: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTaxRuleData {
  name: string;
  description?: string;
  rate: number;
}

interface UpdateTaxRuleData {
  name?: string;
  description?: string;
  rate?: number;
}

export default function TaxRulesPage() {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);

  const [formData, setFormData] = useState<CreateTaxRuleData>({ name: '', description: '', rate: 0 });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxRules = async () => {
    setLoading(true);
    setError(null);
    const res = await http<TaxRule[]>('/payroll-configuration/tax-rules');
    if (res.ok && res.data) setTaxRules(res.data);
    else setError(res.error || 'Failed to fetch tax rules');
    setLoading(false);
  };

  useEffect(() => {
    fetchTaxRules();
  }, []);

  const handleRefresh = () => fetchTaxRules();

  const validate = (data: CreateTaxRuleData) => {
    if (!data.name.trim()) return 'Name is required';
    if (typeof data.rate !== 'number' || Number.isNaN(data.rate) || data.rate < 0) return 'Rate must be a number >= 0';
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
    const res = await http<TaxRule>('/payroll-configuration/tax-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', rate: 0 });
      fetchTaxRules();
    } else setFormError(res.error || 'Failed to create tax rule');
    setSubmitting(false);
  };

  const openEdit = (rule: TaxRule) => {
    setEditingRule(rule);
    setFormData({ name: rule.name, description: rule.description || '', rate: rule.rate });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    const v = validate(formData);
    if (v) {
      setFormError(v);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const updateData: UpdateTaxRuleData = {};
    if (formData.name !== editingRule.name) updateData.name = formData.name;
    if (formData.description !== (editingRule.description || '')) updateData.description = formData.description;
    if (formData.rate !== editingRule.rate) updateData.rate = formData.rate;

    const res = await http<TaxRule>(`/payroll-configuration/tax-rules/${editingRule._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (res.ok) {
      setIsEditOpen(false);
      setEditingRule(null);
      setFormData({ name: '', description: '', rate: 0 });
      fetchTaxRules();
    } else setFormError(res.error || 'Failed to update tax rule');
    setSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this tax rule?')) return;
    const res = await http(`/payroll-configuration/tax-rules/${id}/approve`, { method: 'POST' });
    if (res.ok) fetchTaxRules();
    else alert(res.error || 'Failed to approve');
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this tax rule?')) return;
    const res = await http(`/payroll-configuration/tax-rules/${id}/reject`, { method: 'POST' });
    if (res.ok) fetchTaxRules();
    else alert(res.error || 'Failed to reject');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tax rule? This action cannot be undone.')) return;
    const res = await http(`/payroll-configuration/tax-rules/${id}`, { method: 'DELETE' });
    if (res.ok) fetchTaxRules();
    else alert(res.error || 'Failed to delete');
  };

  return (
    <DashboardLayout title="Payroll Config — Tax Rules" description="Manage tax rules and rates used in payroll calculations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Tax Rules</h1>
            <p className="text-gray-400">Define tax rules, rates and descriptions used across payroll calculations</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Refresh</button>
            <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">+ Create Tax Rule</button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : taxRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No tax rules found</td>
                </tr>
              ) : (
                taxRules.map((r) => (
                  <tr key={r._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{r.name}</td>
                    <td className="px-6 py-4 text-white">{r.rate}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                        r.status === 'APPROVED' ? 'bg-green-600' : r.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}>
                        {r.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {isDraft(r.status) ? (
                        <button onClick={() => openEdit(r)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2">
                          <Edit size={14} /> Edit
                        </button>
                      ) : (
                        <button disabled title="Only draft rules can be edited" className="px-3 py-1 bg-gray-600 text-gray-400 text-sm rounded">Edit</button>
                      )}

                      {r.status !== 'APPROVED' && (
                        <button onClick={() => handleApprove(r._id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-2">
                          <Check size={14} /> Approve
                        </button>
                      )}

                      {r.status !== 'REJECTED' && (
                        <button onClick={() => handleReject(r._id)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded flex items-center gap-2">
                          <X size={14} /> Reject
                        </button>
                      )}

                      <button onClick={() => handleDelete(r._id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center gap-2">
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
              <h3 className="text-xl font-bold text-white mb-4">Create Tax Rule</h3>
              {formError && <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4"><p className="text-red-300 text-sm">{formError}</p></div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rate (%) *</label>
                  <input type="number" value={formData.rate} onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" rows={3} />
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
        {isEditOpen && editingRule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Edit Tax Rule</h3>
              {formError && <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4"><p className="text-red-300 text-sm">{formError}</p></div>}
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rate (%) *</label>
                  <input type="number" value={formData.rate} onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white" rows={3} />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setIsEditOpen(false); setEditingRule(null); }} className="px-4 py-2 text-gray-300 hover:text-white" disabled={submitting}>Cancel</button>
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
