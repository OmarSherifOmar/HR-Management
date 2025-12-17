'use client';

import DashboardLayout from '../../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { fetchSuspensions as apiFetchSuspensions, createSuspension as apiCreateSuspension, updateSuspension as apiUpdateSuspension } from '../../api/adminApi';
import { Loader } from 'lucide-react';

type Suspension = {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string } | string;
  startDate: string;
  endDate?: string | null;
  reason?: string;
  paused?: boolean;
  createdAt?: string;
};

export default function AccrualSuspensionsPage() {
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadSuspensions();
  }, []);

  const loadSuspensions = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiFetchSuspensions();
      setSuspensions(json || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate) return setError('Employee and start date are required');
    setSubmitting(true);
    setError(null);
    try {
      await apiCreateSuspension({ employeeId, startDate, endDate: endDate || null, reason });

      // reset form and reload
      setEmployeeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadSuspensions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create suspension');
    } finally {
      setSubmitting(false);
    }
  };
  const handleTogglePause = async (id: string, paused: boolean) => {
    try {
      await apiUpdateSuspension(id, { paused: !paused });
      await loadSuspensions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suspension');
    }
  };

  return (
    <DashboardLayout title="Accrual Suspensions" description="Manage accrual suspensions and adjustments">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Create Suspension</h3>
              <p className="text-sm text-gray-400">Pause or suspend accruals for an employee for a date range.</p>
            </div>
            <div className="text-sm text-gray-400">Admin • Accruals</div>
          </div>

          <div className="px-6 py-5">
            {error && <div className="mb-4 text-red-400">{error}</div>}
            <form onSubmit={handleCreateSuspension} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="text-xs text-gray-300 mb-1 block">Employee ID</label>
                <input
                  placeholder="e.g. 63a1f4... or employee number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  title="Employee ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">You can paste employee id or use a lookup (future).</div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-300 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Start date"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-300 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="End date (optional)"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs text-gray-300 mb-1 block">Reason</label>
                <input
                  placeholder="Optional: reason or notes"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  title="Reason"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-12 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  title={submitting ? 'Submitting...' : 'Create suspension'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader className="animate-spin" size={16} />
                  ) : null}
                  <span>{submitting ? 'Saving...' : 'Create Suspension'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Active Suspensions</h3>
              <p className="text-sm text-gray-400">Current suspension records and quick actions.</p>
            </div>
            <div className="text-sm text-gray-400">{loading ? 'Updating…' : `${suspensions.length} records`}</div>
          </div>

          <div className="px-6 py-4">
            {loading ? (
              <div className="p-8 text-center">
                <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
                <p className="text-gray-400">Loading suspensions...</p>
              </div>
            ) : suspensions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No suspensions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs text-gray-400">
                      <th className="px-4 py-2">Employee</th>
                      <th className="px-4 py-2">Period</th>
                      <th className="px-4 py-2">Reason</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {suspensions.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-850">
                        <td className="px-4 py-3 text-sm text-white">
                          {typeof s.employeeId === 'string' ? s.employeeId : `${s.employeeId.firstName} ${s.employeeId.lastName}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(s.startDate).toLocaleDateString()} {s.endDate ? `— ${new Date(s.endDate).toLocaleDateString()}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.reason || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${s.paused ? 'bg-blue-600 text-white' : 'bg-green-700 text-white'}`}>
                            {s.paused ? 'Paused' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePause(s._id, !!s.paused)}
                              title={s.paused ? 'Resume accrual' : 'Pause accrual'}
                              className={`px-3 py-1 rounded-md text-sm text-white ${s.paused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                            >
                              {s.paused ? 'Resume' : 'Pause'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
