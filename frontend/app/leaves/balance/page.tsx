'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useEffect, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  accrued: number;
  taken: number;
  remaining: number;
  pending: number;
  carryForward: number;
  yearlyEntitlement: number;
}

export default function MyBalancePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/leaves/entitlements/my-balance', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Failed to fetch balance (${response.status})`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Map API response and calculate accrued-based available balance
      const mappedBalances = result.data.balances.map((balance: any) => {
        // Ensure all numeric fields have default values
        const accrued = Number(balance.accrued) || 0;
        const carryForward = Number(balance.carryForward) || 0;
        const taken = Number(balance.taken) || 0;
        const pending = Number(balance.pending) || 0;
        const yearlyEntitlement = Number(balance.yearlyEntitlement) || 0;
        
        const accruedBalance = accrued + carryForward;
        const availableBalance = accruedBalance - taken - pending;
        
        return {
          leaveTypeId: balance.leaveTypeId,
          leaveTypeName: balance.leaveTypeName,
          leaveTypeCode: balance.leaveTypeCode,
          accrued,
          taken,
          pending,
          carryForward,
          yearlyEntitlement,
          remaining: Math.max(0, availableBalance)
        };
      });
      
      setBalances(mappedBalances);
      
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load leave balance');
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Leave Balance"
      description="View your current leave balances, accrued days, and available entitlements"
    >
      {loading ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-gray-400">Loading balance...</div>
        </div>
      ) : balances.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Calendar className="mx-auto text-gray-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Leave Entitlements</h3>
          <p className="text-gray-400">
            You don't have any leave entitlements configured yet. Please contact HR.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {balances.map((balance, index) => (
            <div
              key={balance.leaveTypeId || `balance-${index}`}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{balance.leaveTypeName}</h2>
                  <p className="text-gray-400 text-sm">Code: {balance.leaveTypeCode}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-500">{balance.remaining}</div>
                  <div className="text-sm text-gray-400">Days Available</div>
                </div>
              </div>

              {/* Balance Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Yearly Entitlement */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-purple-400" />
                    <span className="text-xs text-gray-400 uppercase">Yearly Entitlement</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{balance.yearlyEntitlement}</div>
                  <div className="text-xs text-gray-500 mt-1">Total days per year</div>
                </div>

                {/* Accrued */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-xs text-gray-400 uppercase">Accrued</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{balance.accrued}</div>
                  <div className="text-xs text-gray-500 mt-1">Days earned so far</div>
                </div>

                {/* Carry Over */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-400" />
                    <span className="text-xs text-gray-400 uppercase">Carry Forward</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{balance.carryForward}</div>
                  <div className="text-xs text-gray-500 mt-1">From previous year</div>
                </div>

                {/* Taken */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-red-400" />
                    <span className="text-xs text-gray-400 uppercase">Taken</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{balance.taken}</div>
                  <div className="text-xs text-gray-500 mt-1">Days used</div>
                </div>

                {/* Pending */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-yellow-400" />
                    <span className="text-xs text-gray-400 uppercase">Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{balance.pending}</div>
                  <div className="text-xs text-gray-500 mt-1">Awaiting approval</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Usage Progress (Based on Accrued Balance)</span>
                  <span className="text-gray-400">
                    {balance.taken + balance.pending} / {balance.accrued + balance.carryForward} days
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full flex">
                    {/* Taken portion */}
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${((balance.taken / (balance.accrued + balance.carryForward)) * 100).toFixed(1)}%`,
                      }}
                    />
                    {/* Pending portion */}
                    <div
                      className="bg-yellow-500"
                      style={{
                        width: `${((balance.pending / (balance.accrued + balance.carryForward)) * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-gray-400">Taken ({balance.taken})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span className="text-gray-400">Pending ({balance.pending})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-gray-400">Available ({balance.remaining})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3 mt-6">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-500 font-semibold">Error Loading Balance</h3>
            <p className="text-gray-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
