'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { fetchLeaveTypes, fetchPolicies, runAccrual } from '../api/adminApi';
import { Loader, RefreshCw, List } from 'lucide-react';

type LeaveType = {
  _id: string;
  code?: string;
  name: string;
};

type Policy = {
  _id: string;
  leaveTypeId?: string;
  accrualFrequency?: 'monthly' | 'quarterly' | 'yearly' | null;
  accrualRate?: number | null; // days per period or yearly amount depending on policy
  prorate?: boolean;
  maxCap?: number | null;
};

export default function AdminAccrualsPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesJson, policiesJson] = await Promise.all([fetchLeaveTypes(), fetchPolicies()]);
      setLeaveTypes(typesJson || []);
      setPolicies(policiesJson || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const runAccrualAction = async (leaveTypeId?: string) => {
    setRunning(true);
    setError(null);
    try {
      await runAccrual(leaveTypeId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run accrual');
    } finally {
      setRunning(false);
    }
  };

  const policyFor = (typeId: string) => policies.find((p) => p.leaveTypeId === typeId) || null;

  return (
    <DashboardLayout title="Automatic Accruals" description="View and run automatic leave accruals">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Accrual Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runAccrualAction()}
              disabled={running}
              title="Run accrual for all leave types now"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {running ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Run All
            </button>
            <button
              onClick={fetchData}
              title="Refresh"
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
            <p className="text-gray-400">Loading accrual settings...</p>
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
                        {p?.accrualFrequency ? p.accrualFrequency : 'Not configured'}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">Rate: {p?.accrualRate ?? '—'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => runAccrual(t._id)}
                        disabled={running}
                        title={`Run accrual for ${t.name}`}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Run
                      </button>
                      <button
                        onClick={() => window.open(`/dashboard/admin/accruals/history?type=${t._id}`, '_self')}
                        title={`View accrual history for ${t.name}`}
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
