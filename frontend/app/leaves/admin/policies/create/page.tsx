'use client';

import { useAuth } from '../../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Shield } from 'lucide-react';

type LeaveType = {
  _id: string;
  name: string;
  code: string;
};

type AccrualMethod = 'monthly' | 'yearly' | 'per-term';
type RoundingRule = 'none' | 'round' | 'round_up' | 'round_down';

export default function CreatePolicyPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [accrualMethod, setAccrualMethod] = useState<AccrualMethod>('monthly');
  const [monthlyRate, setMonthlyRate] = useState<number | ''>('');
  const [yearlyRate, setYearlyRate] = useState<number | ''>('');
  const [carryForwardAllowed, setCarryForwardAllowed] = useState(false);
  const [maxCarryForward, setMaxCarryForward] = useState<number | ''>('');
  const [expiryAfterMonths, setExpiryAfterMonths] = useState<number | ''>('');
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('none');
  const [minNoticeDays, setMinNoticeDays] = useState<number | ''>('');
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState<number | ''>('');

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
      fetchLeaveTypes();
      if (editId) {
        fetchExistingPolicy();
      }
    }
  }, [isLoading, isLoggedIn, user, router, editId]);

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/types', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data);
      }
    } catch (err) {
      console.error('Failed to fetch leave types:', err);
    }
  };

  const fetchExistingPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/leaves/configuration/policies/${editId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }

      const data = await response.json();
      
      setLeaveTypeId(typeof data.leaveTypeId === 'string' ? data.leaveTypeId : data.leaveTypeId?._id || '');
      setAccrualMethod(data.accrualMethod || 'monthly');
      setMonthlyRate(data.monthlyRate ?? '');
      setYearlyRate(data.yearlyRate ?? '');
      setCarryForwardAllowed(data.carryForwardAllowed ?? false);
      setMaxCarryForward(data.maxCarryForward ?? '');
      setExpiryAfterMonths(data.expiryAfterMonths ?? '');
      setRoundingRule(data.roundingRule || 'none');
      setMinNoticeDays(data.minNoticeDays ?? '');
      setMaxConsecutiveDays(data.maxConsecutiveDays ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        leaveTypeId,
        accrualMethod,
        // Only send the rate field relevant to the accrual method
        monthlyRate: accrualMethod === 'monthly' && monthlyRate !== '' ? Number(monthlyRate) : undefined,
        yearlyRate: (accrualMethod === 'yearly' || accrualMethod === 'per-term') && yearlyRate !== '' ? Number(yearlyRate) : undefined,
        carryForwardAllowed,
        maxCarryForward: maxCarryForward !== '' ? Number(maxCarryForward) : undefined,
        expiryAfterMonths: expiryAfterMonths !== '' ? Number(expiryAfterMonths) : undefined,
        roundingRule,
        minNoticeDays: minNoticeDays !== '' ? Number(minNoticeDays) : undefined,
        maxConsecutiveDays: maxConsecutiveDays !== '' ? Number(maxConsecutiveDays) : undefined,
      };

      const url = editId 
        ? `http://localhost:3000/leaves/configuration/policies/${editId}`
        : 'http://localhost:3000/leaves/configuration/policies';
      
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save policy');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/leaves/admin/policies');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (editId && loading && !error)) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="text-blue-500" size={28} />
              {editId ? 'Edit' : 'Create'} Leave Policy
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Configure leave entitlement rules and accrual settings
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400">
            Policy saved successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Leave Type *
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
              disabled={!!editId}
            >
              <option value="">Select a leave type</option>
              {leaveTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>

          {/* Accrual Configuration */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Accrual Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Accrual Method
                </label>
                <select
                  value={accrualMethod}
                  onChange={(e) => setAccrualMethod(e.target.value as AccrualMethod)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="per-term">Per Term</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rounding Rule
                </label>
                <select
                  value={roundingRule}
                  onChange={(e) => setRoundingRule(e.target.value as RoundingRule)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="none">None</option>
                  <option value="round">Round</option>
                  <option value="round_up">Round Up</option>
                  <option value="round_down">Round Down</option>
                </select>
              </div>
            </div>

            {/* Rate Field - Conditional based on Accrual Method */}
            <div className="mt-4">
              {accrualMethod === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Accrual Rate (days per month) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 1.75 (21 days per year ÷ 12 months)"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days accrued per month of service
                  </p>
                </div>
              )}

              {accrualMethod === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Yearly Entitlement (total days per year) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yearlyRate}
                    onChange={(e) => setYearlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 21 (full year entitlement)"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total days granted at the start of each leave year
                  </p>
                </div>
              )}

              {accrualMethod === 'per-term' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Yearly Entitlement (total days per year) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yearlyRate}
                    onChange={(e) => setYearlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 21"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total yearly entitlement (divided by number of terms)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Carry Forward Rules */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Carry Forward Rules</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-4">
              <span className="text-sm text-gray-300">Allow Carry Forward</span>
              <button
                type="button"
                onClick={() => setCarryForwardAllowed(!carryForwardAllowed)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  carryForwardAllowed ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    carryForwardAllowed ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {carryForwardAllowed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Carry Forward (days)
                  </label>
                  <input
                    type="number"
                    value={maxCarryForward}
                    onChange={(e) => setMaxCarryForward(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry After (months)
                  </label>
                  <input
                    type="number"
                    value={expiryAfterMonths}
                    onChange={(e) => setExpiryAfterMonths(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="12"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Leave Request Rules */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Leave Request Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Notice (days)
                </label>
                <input
                  type="number"
                  value={minNoticeDays}
                  onChange={(e) => setMinNoticeDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Days in advance employee must request</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Consecutive Days
                </label>
                <input
                  type="number"
                  value={maxConsecutiveDays}
                  onChange={(e) => setMaxConsecutiveDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Unlimited"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum days in a single request</p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? 'Saving...' : editId ? 'Update' : 'Create'} Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
