'use client';

import DashboardLayout from '../../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '../../../../context/AuthContext';
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
    fetchSuspensions();
  }, []);

  const fetchSuspensions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch('http://localhost:3000/leaves/accruals/suspensions');
      if (!res.ok) throw new Error('Failed to load suspensions');
      const json = await res.json();
      setSuspensions(json || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate) return setError('Employee and start date are required');
    setSubmitting(true);
    setError(null);
    try {
      const res = await authenticatedFetch('http://localhost:3000/leaves/accruals/suspensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, startDate, endDate: endDate || null, reason }),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message || 'Failed to create suspension');
      }

      // reset form and reload
      setEmployeeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      await fetchSuspensions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create suspension');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePause = async (id: string, paused: boolean) => {
    try {
      const res = await authenticatedFetch(`http://localhost:3000/leaves/accruals/suspensions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !paused }),
      });
      if (!res.ok) throw new Error('Failed to update suspension');
      await fetchSuspensions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suspension');
    }
  };

  return (
    <DashboardLayout title="Accrual Suspensions" description="Manage accrual suspensions and adjustments">
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Create Suspension / Pause Accrual</h3>
          {error && <div className="mb-3 text-red-400">{error}</div>}
          <form onSubmit={createSuspension} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              title="Employee ID"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              required
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start date"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              required
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End date (optional)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <input
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              title="Reason"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button
                type="submit"
                disabled={submitting}
                title={submitting ? 'Submitting...' : 'Create suspension'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Active Suspensions</h3>
          {loading ? (
            <div className="p-6 text-center">
              <Loader className="animate-spin mx-auto text-blue-500 mb-2" size={28} />
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : suspensions.length === 0 ? (
            <div className="p-6 text-gray-400">No suspensions found.</div>
          ) : (
            <div className="space-y-3">
              {suspensions.map((s) => (
                <div key={s._id} className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{typeof s.employeeId === 'string' ? s.employeeId : `${s.employeeId.firstName} ${s.employeeId.lastName}`}</div>
                    <div className="text-xs text-gray-400">{s.startDate} {s.endDate ? `— ${s.endDate}` : ''}</div>
                    {s.reason && <div className="text-xs text-gray-300 mt-1">{s.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePause(s._id, !!s.paused)}
                      title={s.paused ? 'Resume accrual' : 'Pause accrual'}
                      className={`px-3 py-2 rounded-lg text-white ${s.paused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
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
