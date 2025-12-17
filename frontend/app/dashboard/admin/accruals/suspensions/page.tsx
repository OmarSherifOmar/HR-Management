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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Create Suspension</h3>
            <div className="text-sm text-gray-400">Pause accruals for employees</div>
          </div>
          {error && <div className="mb-3 text-red-400">{error}</div>}
          <form onSubmit={handleCreateSuspension} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Employee ID</label>
              <input
                placeholder="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                title="Employee ID"
                className="w-full px-3 py-2 bg-[#171717] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Start date"
                  className="w-full px-3 py-2 bg-[#171717] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="End date (optional)"
                  className="w-full px-3 py-2 bg-[#171717] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason</label>
              <input
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                title="Reason"
                className="w-full px-3 py-2 bg-[#171717] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                title={submitting ? 'Submitting...' : 'Create suspension'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Active Suspensions</h3>
            <div className="text-sm text-gray-400">Manage current pauses</div>
          </div>
          {loading ? (
            <div className="p-6 text-center">
              <Loader className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : suspensions.length === 0 ? (
            <div className="p-6 text-gray-400">No suspensions found.</div>
          ) : (
            <div className="space-y-3">
              {suspensions.map((s) => (
                <div key={s._id} className="p-4 bg-[#151515] rounded-md border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{typeof s.employeeId === 'string' ? s.employeeId : `${s.employeeId.firstName} ${s.employeeId.lastName}`}</div>
                    <div className="text-xs text-gray-400">{s.startDate} {s.endDate ? `— ${s.endDate}` : ''}</div>
                    {s.reason && <div className="text-xs text-gray-300 mt-1">{s.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePause(s._id, !!s.paused)}
                      title={s.paused ? 'Resume accrual' : 'Pause accrual'}
                      className={`px-3 py-2 rounded-md text-white ${s.paused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                    >
                      {s.paused ? 'Resume' : 'Pause'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
