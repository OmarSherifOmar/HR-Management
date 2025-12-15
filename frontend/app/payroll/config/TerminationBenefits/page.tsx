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

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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

  return (
    <DashboardLayout
      title="Termination Benefits"
      description="Manage termination and resignation benefits."
    >
      <div className="space-y-4">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Existing Benefits</h2>
            {!isLoading && user && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
              >
                + New Benefit
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-300 text-sm">Loading...</p>
          ) : benefits.length === 0 ? (
            <p className="text-gray-400 text-sm">No termination benefits found yet. Use "+ New" to create one.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {benefits.map((benefit) => (
                <div
                  key={benefit._id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg transition-colors ${
                    editingId === benefit._id
                      ? 'bg-[#0f172a] ring-1 ring-blue-500'
                      : 'bg-[#1a1a1a] hover:bg-[#333333]'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-base font-medium text-white">{benefit.name}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Amount: {benefit.amount}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {benefit.terms}
                    </p>
                  </div>
                  {benefit.status && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white self-start">
                      {benefit.status}
                    </span>
                  )}
                  <div className="flex flex-col gap-2 self-start ml-3">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => handleEdit(benefit)}
                    >
                      Edit
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

      {/* Modal for create/edit */}
      {isModalOpen && (
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
