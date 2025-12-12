'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Calendar, Clock, TrendingUp, Save, RefreshCw, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

type LeaveYearConfig = {
  leaveYearStartMonth: number;
  leaveYearStartDay: number;
  proRateEntitlement: boolean;
  proRateBasedOn: 'JOIN_DATE' | 'LEAVE_YEAR_START';
  resetBalanceOnYearEnd: boolean;
  allowNegativeBalance: boolean;
  updatedAt: string;
};

type RoundingMethod = 'NO_ROUNDING' | 'ARITHMETIC' | 'ROUND_UP' | 'ROUND_DOWN';

export default function AdminSettingsPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<LeaveYearConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [leaveYearStartMonth, setLeaveYearStartMonth] = useState(1);
  const [leaveYearStartDay, setLeaveYearStartDay] = useState(1);
  const [proRateEntitlement, setProRateEntitlement] = useState(true);
  const [proRateBasedOn, setProRateBasedOn] = useState<'JOIN_DATE' | 'LEAVE_YEAR_START'>('JOIN_DATE');
  const [resetBalanceOnYearEnd, setResetBalanceOnYearEnd] = useState(true);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (isLoggedIn && user?.role === 'HR Admin') {
      fetchConfig();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/leaves/year-config', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      setConfig(data);
      
      // Populate form with fallback defaults
      setLeaveYearStartMonth(data.leaveYearStartMonth ?? 1);
      setLeaveYearStartDay(data.leaveYearStartDay ?? 1);
      setProRateEntitlement(data.proRateEntitlement ?? true);
      setProRateBasedOn(data.proRateBasedOn ?? 'JOIN_DATE');
      setResetBalanceOnYearEnd(data.resetBalanceOnYearEnd ?? true);
      setAllowNegativeBalance(data.allowNegativeBalance ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('http://localhost:3000/leaves/year-config', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveYearStartMonth,
          leaveYearStartDay,
          proRateEntitlement,
          proRateBasedOn,
          resetBalanceOnYearEnd,
          allowNegativeBalance,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const data = await response.json();
      setConfig(data);
      setSuccess('Configuration saved successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default settings?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('http://localhost:3000/leaves/year-config/reset-to-default', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset configuration');
      }

      const data = await response.json();
      setConfig(data);
      
      // Update form
      setLeaveYearStartMonth(data.leaveYearStartMonth);
      setLeaveYearStartDay(data.leaveYearStartDay);
      setProRateEntitlement(data.proRateEntitlement);
      setProRateBasedOn(data.proRateBasedOn);
      setResetBalanceOnYearEnd(data.resetBalanceOnYearEnd);
      setAllowNegativeBalance(data.allowNegativeBalance);

      setSuccess('Configuration reset to defaults!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout 
      title="Leave Configuration Settings" 
      description="Configure accrual rates, carry-over, and rounding settings"
    >
      <div className="max-w-4xl mx-auto">

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-8">
          {/* Leave Year Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-blue-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Leave Year Configuration</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Leave Year Start Month
                </label>
                <select
                  value={leaveYearStartMonth}
                  onChange={(e) => setLeaveYearStartMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Leave Year Start Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={leaveYearStartDay}
                  onChange={(e) => setLeaveYearStartDay(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pro-rate Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Accrual & Pro-rating</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                <div>
                  <label className="text-sm font-medium text-white">Enable Pro-rate Entitlement</label>
                  <p className="text-xs text-gray-400 mt-1">
                    Calculate entitlement based on joining date
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proRateEntitlement}
                    onChange={(e) => setProRateEntitlement(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {proRateEntitlement && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pro-rate Based On
                  </label>
                  <select
                    value={proRateBasedOn}
                    onChange={(e) => setProRateBasedOn(e.target.value as 'JOIN_DATE' | 'LEAVE_YEAR_START')}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="JOIN_DATE">Employee Join Date</option>
                    <option value="LEAVE_YEAR_START">Leave Year Start Date</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Balance Management */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Balance Management</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                <div>
                  <label className="text-sm font-medium text-white">Reset Balance on Year End</label>
                  <p className="text-xs text-gray-400 mt-1">
                    Automatically reset unused leave balance at year end
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetBalanceOnYearEnd}
                    onChange={(e) => setResetBalanceOnYearEnd(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                <div>
                  <label className="text-sm font-medium text-white">Allow Negative Balance</label>
                  <p className="text-xs text-gray-400 mt-1">
                    Employees can take leave even with insufficient balance
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowNegativeBalance}
                    onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-700">
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} />
              Reset to Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Important Notes</h3>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li>Changes to leave year configuration will apply from the next leave year</li>
            <li>Pro-rating calculations are performed automatically based on join date</li>
            <li>Carry-over and expiration rules are configured per policy</li>
            <li>Rounding methods affect balance calculations and must be set per policy</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
