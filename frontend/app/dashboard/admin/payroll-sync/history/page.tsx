'use client';

import DashboardLayout from '../../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { fetchPayrollHistory } from '../../../api/adminApi';
import { Loader } from 'lucide-react';

type SyncRecord = {
  _id: string;
  employeeId?: { _id: string; firstName: string; lastName: string } | string;
  type: string;
  status: string;
  details?: string;
  createdAt: string;
};

export default function PayrollSyncHistoryPage() {
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchPayrollHistory();
      setRecords(json || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Payroll Sync History" description="Recent payroll sync events">
      <div className="space-y-6">
        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
            <p className="text-gray-400">Loading sync history...</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {error && <div className="mb-4 text-red-400">{error}</div>}
            {records.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No payroll sync records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Employee</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id} className="border-t border-gray-800">
                        <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">{r.type}</td>
                        <td className="px-4 py-2">{r.employeeId && typeof r.employeeId !== 'string' ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : (r.employeeId || '—')}</td>
                        <td className="px-4 py-2">{r.status}</td>
                        <td className="px-4 py-2">{r.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
