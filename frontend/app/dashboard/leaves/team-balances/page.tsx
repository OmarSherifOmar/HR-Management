'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../context/AuthContext';
import { Calendar, Users, AlertCircle } from 'lucide-react';

type TeamBalance = {
  employeeId: string;
  name: string;
  position?: string;
  department?: string;
  accrued: number;
  taken: number;
  remaining: number;
  carryOver?: number;
};

type UpcomingLeave = {
  _id: string;
  employeeId: string;
  employeeName?: string;
  leaveType?: string;
  from: string;
  to: string;
};

export default function TeamBalancesPage() {
  const [balances, setBalances] = useState<TeamBalance[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try common backend endpoints used for team balances/upcoming leaves
      const balancesRes = await authenticatedFetch('http://localhost:3000/leaves/entitlements/team-balances');
      if (balancesRes.ok) {
        const json = await balancesRes.json().catch(() => null);
        setBalances(json?.data || json?.balances || []);
      } else {
        // Try alternate path
        const alt = await authenticatedFetch('http://localhost:3000/leaves/entitlements/team');
        if (alt.ok) {
          const json = await alt.json().catch(() => null);
          setBalances(json?.data || json?.balances || []);
        }
      }

      const upcomingRes = await authenticatedFetch('http://localhost:3000/leave-requests/team-upcoming');
      if (upcomingRes.ok) {
        const j = await upcomingRes.json().catch(() => null);
        setUpcoming(j?.data || j || []);
      }
    } catch (err: any) {
      console.error('Error loading team balances:', err);
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : 'N/A';

  return (
    <DashboardLayout title="Team Balances" description="View your team members' leave balances and upcoming leaves">
      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-gray-400">Loading team balances...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Team Leave Balances</h3>
                <p className="text-gray-400 text-sm mb-4">Overview of accruals, taken and remaining days for team members</p>

                {balances.length === 0 ? (
                  <div className="text-gray-400">No team balances available.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                      <thead>
                        <tr className="text-xs text-gray-400">
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Department</th>
                          <th className="px-3 py-2">Accrued</th>
                          <th className="px-3 py-2">Taken</th>
                          <th className="px-3 py-2">Carry Over</th>
                          <th className="px-3 py-2">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances.map((b) => (
                          <tr key={b.employeeId} className="border-t border-gray-800 hover:bg-[#1a1a1a]">
                            <td className="px-3 py-3 text-white">{b.name}</td>
                            <td className="px-3 py-3 text-gray-400">{b.department || b.position || '—'}</td>
                            <td className="px-3 py-3 text-green-400 font-medium">{b.accrued}</td>
                            <td className="px-3 py-3 text-red-400 font-medium">{b.taken}</td>
                            <td className="px-3 py-3 text-blue-400 font-medium">{b.carryOver ?? 0}</td>
                            <td className="px-3 py-3 text-white font-semibold">{b.remaining}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Upcoming Team Leaves</h3>
                <p className="text-gray-400 text-sm mb-4">Planned leaves for your team</p>

                {upcoming.length === 0 ? (
                  <div className="text-gray-400">No upcoming leaves found.</div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(u => (
                      <div key={u._id} className="bg-[#1a1a1a] p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{u.employeeName || u.employeeId}</div>
                          <div className="text-xs text-gray-400">{u.leaveType || 'Leave'} — {formatDate(u.from)} to {formatDate(u.to)}</div>
                        </div>
                        <div className="text-xs text-gray-400">{formatDate(u.from)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="bg-[#2a2a2a] rounded-lg p-6">
              <h4 className="text-white font-semibold mb-3">Tips</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Use this view to monitor upcoming absences and plan coverage.</li>
                <li>• Export or contact HR for adjustments to carryover and encashment.</li>
                <li>• Contact HR if team members' balances look incorrect.</li>
              </ul>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
