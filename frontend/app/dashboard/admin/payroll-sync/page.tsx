'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { fetchPayrollStatus, runPayrollSync } from '../api/adminApi';
import { Loader, RefreshCw } from 'lucide-react';

type SyncStatus = {
  lastSync?: string | null;
  pending?: number;
  running?: boolean;
};

export default function PayrollSyncPage() {
  const [status, setStatus] = useState<SyncStatus>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchPayrollStatus();
      setStatus(json || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const runSync = async (employeeId?: string) => {
    setRunning(true);
    setError(null);
    try {
      await runPayrollSync(employeeId);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run sync');
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardLayout title="Payroll Sync" description="Real-time payroll synchronization operations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Payroll Sync</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runSync()}
              disabled={running}
              title="Run full payroll sync now"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {running ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Run Sync
            </button>
            <button onClick={fetchStatus} title="Refresh status" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300">⟳</button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
            <p className="text-gray-400">Loading sync status...</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {error && <div className="mb-4 text-red-400">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                <div className="text-xs text-gray-400">Last sync</div>
                <div className="text-white">{status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</div>
              </div>
              <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                <div className="text-xs text-gray-400">Pending items</div>
                <div className="text-white">{status.pending ?? 0}</div>
              </div>
              <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                <div className="text-xs text-gray-400">Running</div>
                <div className="text-white">{status.running ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-400">You can trigger a real-time sync for payroll. For per-employee sync, use the API endpoint with the `employeeId` body.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => runSync()} disabled={running} title="Run full payroll sync now" className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Run Full Sync</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
