'use client';

import DashboardLayout from '../../../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '../../../../context/AuthContext';
import { Loader } from 'lucide-react';

type AccrualRecord = {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string } | string;
  leaveTypeId: { _id: string; name?: string; code?: string } | string;
  amount: number;
  date: string;
  note?: string;
};

export default function AccrualHistoryPage() {
  const [records, setRecords] = useState<AccrualRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch('http://localhost:3000/leaves/accruals/history');
      if (!res.ok) throw new Error('Failed to fetch accrual history');
      const json = await res.json();
      setRecords(json || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Accrual History" description="Recent automatic accrual transactions">
      <div className="space-y-6">
        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={36} />
            <p className="text-gray-400">Loading accrual history...</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {error && <div className="mb-4 text-red-400">{error}</div>}
            {records.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No accrual records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Employee</th>
                      <th className="px-4 py-2">Leave Type</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id} className="border-t border-gray-800">
                        <td className="px-4 py-2">{new Date(r.date).toLocaleString()}</td>
                        <td className="px-4 py-2">{typeof r.employeeId === 'string' ? r.employeeId : `${r.employeeId.firstName} ${r.employeeId.lastName}`}</td>
                        <td className="px-4 py-2">{typeof r.leaveTypeId === 'string' ? r.leaveTypeId : r.leaveTypeId.name}</td>
                        <td className="px-4 py-2">{r.amount}</td>
                        <td className="px-4 py-2">{r.note || '—'}</td>
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
