'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '../../../context/AuthContext';
import { Loader, RefreshCw } from 'lucide-react';

type LeaveType = { _id: string; code?: string; name: string };
type Policy = {
  _id: string;
  leaveTypeId?: string;
  carryForwardAllowed?: boolean;
  maxCarryForward?: number | null;
  expiryAfterMonths?: number | null;
};

export default function CarryForwardPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, policiesRes] = await Promise.all([
        authenticatedFetch('http://localhost:3000/leaves/types'),
        authenticatedFetch('http://localhost:3000/leaves/configuration/policies'),
      ]);

      if (!typesRes.ok) throw new Error('Failed to load leave types');
      if (!policiesRes.ok) throw new Error('Failed to load policies');

      const typesJson = await typesRes.json();
      const policiesJson = await policiesRes.json();

      setLeaveTypes(typesJson || []);
      setPolicies(policiesJson || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const runCarryForward = async (leaveTypeId?: string) => {
    setRunning(true);
    setError(null);
    try {
      const url = 'http://localhost:3000/leaves/carryforward/run';
      const res = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveTypeId ? { leaveTypeId } : {}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Carry-forward run failed');
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run carry-forward');
    } finally {
      setRunning(false);
    }
  };

  const policyFor = (typeId: string) => policies.find((p) => p.leaveTypeId === typeId) || null;

  return (
    <DashboardLayout title="Carry Forward Processing" description="Configure and run automatic carry-forward">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Carry-Forward Rules</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runCarryForward()}
              disabled={running}
              title="Run carry-forward for all leave types now"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {running ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Run All
            </button>
            <button
              onClick={load}
              title="Refresh"
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300"
            >
              ⟳
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
            <p className="text-gray-400">Loading carry-forward settings...</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {error && <div className="mb-4 text-red-400">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveTypes.map((t) => {
                const p = policyFor(t._id);
                return (
                  <div key={t._id} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium">{t.name}</h3>
                        <p className="text-xs text-gray-400">{t.code}</p>
                      </div>
                      <div className="text-sm text-gray-300">
                        {p?.carryForwardAllowed ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">Max Carry Forward: {p?.maxCarryForward ?? '—'}</p>
                    <p className="text-sm text-gray-400 mb-3">Expiry (months): {p?.expiryAfterMonths ?? '—'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => runCarryForward(t._id)}
                        disabled={running}
                        title={`Run carry-forward for ${t.name}`}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Run
                      </button>
                      <button
                        onClick={() => window.open(`/dashboard/admin/carry-forward/history?type=${t._id}`, '_self')}
                        title={`View carry-forward history for ${t.name}`}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
