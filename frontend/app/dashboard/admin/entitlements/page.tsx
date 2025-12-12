'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calculator, PlayCircle, Calendar, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

type ProcessResult = {
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
};

export default function AdminEntitlementsPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }
  }, [isLoading, isLoggedIn, user, router]);

  const processMonthlyAccrual = async () => {
    if (!confirm('Are you sure you want to process monthly accrual for all employees?')) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      const response = await fetch('http://localhost:3000/leaves/entitlements/process/monthly-accrual', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to process monthly accrual');
      }

      const data = await response.json();
      setResult({
        success: true,
        message: 'Monthly accrual processed successfully',
        processed: data.processed || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process monthly accrual');
    } finally {
      setProcessing(false);
    }
  };

  const processYearEndCarryForward = async () => {
    if (!confirm('Are you sure you want to process year-end carry-forward for all employees?')) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      const response = await fetch('http://localhost:3000/leaves/entitlements/process/year-end-carry-forward', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to process year-end carry-forward');
      }

      const data = await response.json();
      setResult({
        success: true,
        message: 'Year-end carry-forward processed successfully',
        processed: data.processed || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process year-end carry-forward');
    } finally {
      setProcessing(false);
    }
  };

  const processExpiredCarryForward = async () => {
    if (!confirm('Are you sure you want to process expired carry-forward balances?')) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      const response = await fetch('http://localhost:3000/leaves/entitlements/process/expired-carry-forward', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to process expired carry-forward');
      }

      const data = await response.json();
      setResult({
        success: true,
        message: 'Expired carry-forward processed successfully',
        processed: data.processed || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process expired carry-forward');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
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
    <DashboardLayout 
      title="Entitlement Calculations & Scheduling" 
      description="Update entitlement calculations and process scheduled operations"
    >
      <div className="max-w-5xl mx-auto">

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {result && result.success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.processed !== undefined && (
                <p className="text-sm mt-1">Processed: {result.processed} records</p>
              )}
            </div>
          </div>
        )}

        {/* Processing Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Accrual */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <Calendar className="text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Monthly Accrual Processing
                </h3>
                <p className="text-sm text-gray-400">
                  Process monthly leave accrual for all eligible employees
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Calculates accrual based on policy rates
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Applies pro-rating for new employees
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Updates employee leave balances
              </div>
            </div>

            <button
              onClick={processMonthlyAccrual}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={18} />
              {processing ? 'Processing...' : 'Process Monthly Accrual'}
            </button>
          </div>

          {/* Year-End Carry Forward */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Year-End Carry Forward
                </h3>
                <p className="text-sm text-gray-400">
                  Process year-end carry-forward balances based on policies
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Applies maximum carry-over limits
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Sets expiration dates for carried-over days
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Resets annual entitlements
              </div>
            </div>

            <button
              onClick={processYearEndCarryForward}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={18} />
              {processing ? 'Processing...' : 'Process Year-End Carry Forward'}
            </button>
          </div>

          {/* Expired Carry Forward */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-yellow-900/30 rounded-lg">
                <AlertCircle className="text-yellow-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Expired Carry Forward Cleanup
                </h3>
                <p className="text-sm text-gray-400">
                  Remove expired carry-forward balances from employee records
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Identifies expired carry-over periods
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Deducts expired days from balance
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Creates audit trail
              </div>
            </div>

            <button
              onClick={processExpiredCarryForward}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={18} />
              {processing ? 'Processing...' : 'Process Expired Carry Forward'}
            </button>
          </div>

          {/* Information Card */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <Users className="text-purple-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Automated Scheduling
                </h3>
                <p className="text-sm text-gray-400">
                  These operations can be scheduled to run automatically
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-white font-medium mb-1">Monthly Accrual</p>
                <p className="text-xs text-gray-400">
                  Recommended: 1st of each month at 2:00 AM
                </p>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-white font-medium mb-1">Year-End Carry Forward</p>
                <p className="text-xs text-gray-400">
                  Recommended: Last day of leave year at 11:00 PM
                </p>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-white font-medium mb-1">Expired Cleanup</p>
                <p className="text-xs text-gray-400">
                  Recommended: Weekly on Sunday at 3:00 AM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-6 p-4 bg-orange-900/20 border border-orange-600 rounded-lg">
          <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            Important Notes
          </h3>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li>Always test these operations in a non-production environment first</li>
            <li>These operations affect all employees and cannot be easily reversed</li>
            <li>Monthly accrual respects waiting periods and employment start dates</li>
            <li>Year-end carry forward follows policy-specific carry-over rules</li>
            <li>Expired carry forward cleanup only affects balances past their expiration date</li>
            <li>All operations create audit logs for compliance and tracking</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
