'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { CalendarDays, FileText, CheckCircle, XCircle, ChevronDown, Filter } from 'lucide-react';

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
  // Filters & sort
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

  // Derived lists for filter options
  const leaveTypes = Array.from(new Set(history.map(h => h.leaveTypeId?.name).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(history.map(h => h.status).filter(Boolean))) as string[];

  const applyFiltersAndSort = () => {
    let items = [...history];

    if (filterType !== 'all') {
      items = items.filter(i => (i.leaveTypeId?.name || '').toLowerCase() === filterType.toLowerCase());
    }

    if (filterStatus !== 'all') {
      items = items.filter(i => (i.status || '').toLowerCase() === filterStatus.toLowerCase());
    }

    if (filterDept.trim()) {
      items = items.filter(i => {
        // best-effort: support request.employee?.department or request.employeeDepartment or employeeId.department
        const dept = (i as any).employee?.department || (i as any).employeeDepartment || (i.employeeId && (i as any).employeeId.department);
        return typeof dept === 'string' && dept.toLowerCase().includes(filterDept.toLowerCase());
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      items = items.filter(i => new Date(i.dates.from) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // include full day
      to.setHours(23,59,59,999);
      items = items.filter(i => new Date(i.dates.to) <= to);
    }

    items.sort((a,b) => {
      if (sortBy === 'date') {
        const da = new Date(a.dates.from).getTime();
        const db = new Date(b.dates.from).getTime();
        return sortOrder === 'asc' ? da - db : db - da;
      }
      return sortOrder === 'asc' ? a.durationDays - b.durationDays : b.durationDays - a.durationDays;
    });

    return items;
  };

  const filteredHistory = applyFiltersAndSort();

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
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Vacation History by Date</h3>
                <p className="text-gray-400 text-sm">Shows past leave requests grouped by year with status and duration.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Filter size={16} />
                <span className="text-xs text-gray-400">Filters</span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <select
                aria-label="Filter by leave type"
                title="Filter by leave type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white"
              >
                <option value="all">All Leave Types</option>
                {leaveTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                title="Filter by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white"
              >
                <option value="all">All Statuses</option>
                {['pending','approved','rejected','cancelled', ...statuses].filter((s,i,a)=>a.indexOf(s)===i).map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>

              <input
                aria-label="Start date"
                title="Start date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white"
                placeholder="From"
              />

              <input
                aria-label="End date"
                title="End date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white"
                placeholder="To"
              />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <input
                aria-label="Filter by department"
                title="Filter by department"
                type="text"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white w-60"
                placeholder="Department (optional)"
              />

              <div className="flex items-center gap-2">
                <select
                  aria-label="Sort by"
                  title="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date'|'duration')}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="duration">Sort by Duration</option>
                </select>
                <button
                  onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 text-sm text-white flex items-center gap-2"
                  title="Toggle sort order"
                >
                  <span>{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
                  <ChevronDown size={14} className={`${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
                </button>
              </div>

              <button
                onClick={() => { setFilterType('all'); setFilterStatus('all'); setDateFrom(''); setDateTo(''); setFilterDept(''); setSortBy('date'); setSortOrder('desc'); }}
                className="ml-auto text-sm text-gray-400 hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-6 text-center">
              <CalendarDays size={48} className="mx-auto text-gray-500 mb-4" />
              <div className="text-gray-400">No vacation history found.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupByYear(filteredHistory).map(([year, items]) => (
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
