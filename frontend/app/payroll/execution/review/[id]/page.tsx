'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../../context/AuthContext';
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Calculator } from 'lucide-react';

interface PayrollRunDetail {
  _id: string;
  runId: string;
  payrollPeriod: string;
  status: string;
  entity: string;
  employees: number;
  exceptions: number;
  totalnetpay: number;
  payrollSpecialistId?: any;
  payrollManagerId?: any;
  financeStaffId?: any;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  rejectionReason?: string;
  unlockReason?: string;
}

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [data, setData] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatingPayroll, setCalculatingPayroll] = useState(false);
  const [calculateError, setCalculateError] = useState<string | null>(null);

  const userRoles = Array.isArray(user?.roles)
    ? user?.roles
    : user?.role
    ? [user.role]
    : [];
  
  const hasRole = (...allowed: string[]) =>
    userRoles.some((r) => allowed.map((a) => a.toLowerCase()).includes(String(r || '').toLowerCase()));

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`http://localhost:3000/payroll-execution/review/${id}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payroll run details');
        }

        const detailData = await response.json();
        setData(detailData);
      } catch (err: any) {
        console.error('Detail fetch error:', err);
        setError(err.message || 'An error occurred while fetching details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'draft':
        return 'bg-gray-600 text-white';
      case 'under review':
        return 'bg-blue-600 text-white';
      case 'pending finance approval':
        return 'bg-yellow-600 text-white';
      case 'approved':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'locked':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      setCalculatingPayroll(true);
      setCalculateError(null);

      const response = await authenticatedFetch(`http://localhost:3000/payroll-execution/calculate/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to calculate payroll';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Refresh the data after successful calculation
      const updatedResponse = await authenticatedFetch(`http://localhost:3000/payroll-execution/review/${id}`, {
        method: 'GET',
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setData(updatedData);
      }
    } catch (err: any) {
      console.error('Calculate payroll error:', err);
      setCalculateError(err.message || 'An error occurred while calculating payroll');
    } finally {
      setCalculatingPayroll(false);
    }
  };

  return (
    <DashboardLayout title="Payroll Run Details" description="View detailed information about this payroll run">
      <div className="min-h-screen bg-[#0d0d0d] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Payroll Run Details</h1>
              <p className="text-gray-400 mt-1">View detailed information about this payroll run</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading payroll details...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Details Content */}
          {data && !loading && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${getStatusColor(data.status)}`}>
                  {data.status}
                </span>
                {data.status === 'approved' && <CheckCircle className="text-green-400" size={24} />}
                {data.status === 'rejected' && <XCircle className="text-red-400" size={24} />}
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Run ID</p>
                  <p className="text-xl font-semibold">{data.runId}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Entity</p>
                  <p className="text-xl font-semibold">{data.entity}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Payroll Period</p>
                  <p className="text-xl font-semibold">{formatDate(data.payrollPeriod)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Total Net Pay</p>
                  <p className="text-xl font-semibold text-green-400">{formatCurrency(data.totalnetpay)}</p>
                </div>
              </div>

              {/* Employee & Exception Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Employees</p>
                  <p className="text-3xl font-bold">{data.employees}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Exceptions</p>
                  <p className={`text-3xl font-bold ${data.exceptions > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.exceptions}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Payroll Specialist</p>
                  <p className="text-lg font-semibold">
                    {(() => {
                      if (!data.payrollSpecialistId || typeof data.payrollSpecialistId !== 'object') {
                        return 'Unassigned';
                      }
                      const name = `${data.payrollSpecialistId.firstName || ''} ${data.payrollSpecialistId.lastName || ''}`.trim();
                      return name || 'Unassigned';
                    })()}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Created At</p>
                  <p className="text-lg font-semibold">{formatDate(data.createdAt)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Updated At</p>
                  <p className="text-lg font-semibold">{formatDate(data.updatedAt)}</p>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {data.status === 'rejected' && data.rejectionReason && (
                <div className="bg-red-900 bg-opacity-10 border border-red-800 rounded-lg p-6">
                  <p className="text-red-300 font-semibold mb-2">Rejection Reason</p>
                  <p className="text-gray-300">{data.rejectionReason}</p>
                </div>
              )}

              {/* Notes (if any) */}
              {data.notes && (
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Notes</p>
                  <p className="text-gray-300">{data.notes}</p>
                </div>
              )}

              {/* Lock / Unlock Details */}
              {data.unlockReason && (
                <div className="bg-purple-900 bg-opacity-10 border border-purple-800 rounded-lg p-6">
                  <p className="text-purple-200 font-semibold mb-2">Lock / Unlock Notes</p>
                  <p className="text-gray-200 whitespace-pre-wrap">{data.unlockReason}</p>
                  <div className="text-sm text-gray-400 mt-3 flex flex-wrap gap-4">
                    <span>
                      Status: <span className="text-white font-semibold">{data.status}</span>
                    </span>
                    {data.payrollManagerId && typeof data.payrollManagerId === 'object' && (
                      <span>
                        Manager: <span className="text-white font-semibold">{`${data.payrollManagerId.firstName || ''} ${data.payrollManagerId.lastName || ''}`.trim() || 'N/A'}</span>
                      </span>
                    )}
                    <span>Last updated: <span className="text-white font-semibold">{formatDate(data.updatedAt)}</span></span>
                  </div>
                </div>
              )}

              {/* Calculate Error */}
              {calculateError && (
                <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-start gap-4">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold">Calculate Error</p>
                    <p className="text-sm mt-1">{calculateError}</p>
                  </div>
                </div>
              )}

              {/* Calculate Button */}
              {data.status?.toLowerCase() === 'draft' && data.employees === 0 && hasRole('payroll specialist', 'system admin') && (
                <div className="flex gap-3">
                  <button
                    onClick={handleCalculatePayroll}
                    disabled={calculatingPayroll}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Calculator size={20} />
                    {calculatingPayroll ? 'Calculating...' : 'Calculate Payroll'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
