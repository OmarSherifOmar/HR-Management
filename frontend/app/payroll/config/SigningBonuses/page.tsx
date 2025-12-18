'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth, authenticatedFetch } from '../../../context/AuthContext';

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

interface SigningBonus {
  _id?: string;
  positionName: string;
  amount: number | '';
  status?: string;
}

export default function SigningBonusesPage() {
  const { user, isLoading } = useAuth();
  const [bonuses, setBonuses] = useState<SigningBonus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<SigningBonus>({
    positionName: '',
    amount: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(
        `${backendBaseUrl}/payroll-configuration/signing-bonuses`,
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load signing bonuses');
      }

      const data = await res.json();
      setBonuses(data);
    } catch (err: any) {
      setError(err.message || 'Error loading signing bonuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ positionName: '', amount: 0 });
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
        ? `${backendBaseUrl}/payroll-configuration/signing-bonuses/${editingId}`
        : `${backendBaseUrl}/payroll-configuration/signing-bonuses`;

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionName: form.positionName,
          amount: Number(form.amount),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save signing bonus');
      }

      await fetchBonuses();
      resetForm();
      setSuccess(
        editingId ? 'Signing bonus updated successfully' : 'Signing bonus created successfully',
      );
    } catch (err: any) {
      setError(err.message || 'Error saving signing bonus');
    }
  };

  const handleEdit = (bonus: SigningBonus) => {
    setForm({
      _id: bonus._id,
      positionName: bonus.positionName,
      amount: bonus.amount,
      status: bonus.status,
    });
    setEditingId(bonus._id || null);
    setIsModalOpen(true);
  };
const handleApprove = async (id: string) => {
    if (!confirm('Approve this Bounus?')) return;
    const res = await http(`/payroll-configuration/signing-bonuses/${id}/approve`, { method: 'POST' });
    if (res.ok) fetchBonuses();
    else alert(res.error || 'Failed to approve');
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this bonus?')) return;
    const res = await http(`/payroll-configuration/signing-bonuses/${id}/reject`, { method: 'POST' });
    if (res.ok) fetchBonuses();
    else alert(res.error || 'Failed to reject');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Signing Bonus? This action cannot be undone.')) return;
    const res = await http(`/payroll-configuration/signing-bonuses/${id}`, { method: 'DELETE' });
    if (res.ok) fetchBonuses();
    else alert(res.error || 'Failed to delete');
  };
  const canView = () => {
      const allowedRoles = [
        'Payroll Manager',
        'Payroll Specialist'
      ];
      return allowedRoles.includes(user?.role || '');
    };
  
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
      title="Signing Bonuses"
      description="Manage signing bonuses for different positions."
    >
      <div className="space-y-4">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Existing Signing Bonuses</h2>
            {!isLoading && user && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
              >
                + New Bonus
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-300 text-sm">Loading...</p>
          ) : bonuses.length === 0 ? (
            <p className="text-gray-400 text-sm">No signing bonuses found yet. Use "+ New" to create one.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bonuses.map((bonus) => (
                <div
                  key={bonus._id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg transition-colors ${
                    editingId === bonus._id
                      ? 'bg-[#0f172a] ring-1 ring-blue-500'
                      : 'bg-[#1a1a1a] hover:bg-[#333333]'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-base font-medium text-white">{bonus.positionName}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Amount: {bonus.amount}
                    </p>
                  </div>
                  {bonus.status && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white self-start">
                      {bonus.status}
                    </span>
                  )}
                <div className="flex flex-col gap-2 self-start ml-3">

                      {/* Edit */}
                      <button
                        type="button"
                        disabled={!isDraft(bonus.status)}
                        onClick={() => handleEdit(bonus)}
                        className={`text-xs px-2 py-1 rounded text-white ${
                          isDraft(bonus.status)
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        Edit
                      </button>

                      {/* Approve */}
                      {isDraft(bonus.status) && (
                        <button
                          type="button"
                          onClick={() => handleApprove(bonus._id!)}
                          className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white"
                        >
                          Approve
                        </button>
                      )}

                      {/* Reject */}
                      {isDraft(bonus.status) && (
                        <button
                          type="button"
                          onClick={() => handleReject(bonus._id!)}
                          className="text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white"
                        >
                          Reject
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(bonus._id!)}
                        className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                      >
                        Delete
                      </button>

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
          <div className="w-full max-w-lg rounded-xl bg-[#111827] border border-gray-700 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Signing Bonus' : 'Create Signing Bonus'}
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
                You must be logged in to manage signing bonuses.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Position Name</label>
                  <input
                    type="text"
                    required
                    value={form.positionName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, positionName: e.target.value }))
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
