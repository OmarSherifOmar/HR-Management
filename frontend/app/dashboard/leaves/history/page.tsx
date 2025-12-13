'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { CalendarDays, FileText, CheckCircle, XCircle } from 'lucide-react';

type LeaveRequest = {
  _id: string;
  leaveTypeId: { name: string; code?: string };
  dates: { from: string; to: string };
  durationDays: number;
  status: string;
  createdAt: string;
};

type Balance = {
  leaveType: { id: string; name: string };
  accrued: number;
  taken: number;
  remaining: number;
  carryOver: number;
  encashment?: number;
  yearlyEntitlement?: number;
};

export default function LeavesHistoryDashboard() {
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch leave requests history (employee)
      const historyRes = await fetch('http://localhost:3000/leave-requests/my-history', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      let historyData: any = [];
      if (historyRes.ok) {
        const json = await historyRes.json().catch(() => null);
        historyData = json?.data || json || [];
      }

      // Fetch balances / entitlements
      const balanceRes = await fetch('http://localhost:3000/leaves/entitlements/my-balance', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      let balanceData: any = [];
      if (balanceRes.ok) {
        const json = await balanceRes.json().catch(() => null);
        balanceData = json?.balances || json?.data?.balances || json || [];
      }

      setHistory(Array.isArray(historyData) ? historyData : []);
      setBalances(Array.isArray(balanceData) ? balanceData : []);
      setError('');
    } catch (err: any) {
      console.error('Error loading leaves history/balance:', err);
      setError(err.message || 'Failed to load leave information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const groupByYear = (arr: LeaveRequest[]) => {
    const map: Record<string, LeaveRequest[]> = {};
    arr.forEach((r) => {
      const year = new Date(r.dates.from).getFullYear?.() || 'Unknown';
      (map[year] = map[year] || []).push(r);
    });
    return Object.entries(map).sort((a, b) => Number(b[0]) - Number(a[0]));
  };

  if (loading) {
    return (
      <DashboardLayout title="Leave History" description="Your past requests and balance overview">
        <div className="p-6">Loading leave history...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leave History" description="Your past requests and balance overview">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left: Balance summary */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Balance Summary</h3>
          {balances.length === 0 ? (
            <div className="text-gray-400">No balance information available.</div>
          ) : (
            <div className="space-y-4">
              {balances.map((b) => (
                <div key={b.leaveType.id} className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold">{b.leaveType.name}</div>
                      <div className="text-xs text-gray-400">Remaining: {b.remaining}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Accrued</div>
                      <div className="text-green-400 font-bold">{b.accrued}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-3">
                    <div>
                      <div className="text-xs">Taken</div>
                      <div className="text-white font-medium">{b.taken}</div>
                    </div>
                    <div>
                      <div className="text-xs">Carryover</div>
                      <div className="text-white font-medium">{b.carryOver ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-xs">Encashment</div>
                      <div className="text-white font-medium">{b.encashment ?? '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle & Right: History */}
        <div className="lg:col-span-2">
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Vacation History by Date</h3>
            <p className="text-gray-400 text-sm">Shows past leave requests grouped by year with status and duration.</p>
          </div>

          {history.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-6 text-center">
              <CalendarDays size={48} className="mx-auto text-gray-500 mb-4" />
              <div className="text-gray-400">No vacation history found.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupByYear(history).map(([year, items]) => (
                <div key={year} className="bg-[#2a2a2a] rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">{year}</h4>
                  <div className="grid gap-4">
                    {items.map((r) => (
                      <div key={r._id} className="bg-[#1a1a1a] p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-sm text-gray-400">{r.leaveTypeId?.name || 'Leave'}</div>
                            <div className="text-xs text-gray-400">{formatDate(r.dates.from)} — {formatDate(r.dates.to)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">{r.durationDays} {r.durationDays === 1 ? 'day' : 'days'}</div>
                          <div className="text-xs text-gray-400 mt-1">{r.status}</div>
                        </div>
                      </div>
                    ))}
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
