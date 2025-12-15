'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Users,
  AlertCircle,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  FileText,
  Lock
} from 'lucide-react';
interface PayrollRun {
  _id: string;
  runId: string;
  payrollPeriod: string;
  status: string;
  entity: string;
  employees: number;
  exceptions: number;
  totalnetpay: number;
  payrollSpecialistId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PayrollReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.roles)
    ? user?.roles
    : user?.role
    ? [user.role]
    : [];
  const hasRole = (...allowed: string[]) =>
    userRoles.some((r) => allowed.map((a) => a.toLowerCase()).includes(String(r || '').toLowerCase()));

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [financeRuns, setFinanceRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createData, setCreateData] = useState({
    payrollPeriod: '',
    entity: '',
    autoGenerate: false,
  });
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  // Filters / search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState('');
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [financeStatusFilter, setFinanceStatusFilter] = useState<string>('all');

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/review', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll runs');
      }

      const data = await response.json();
      setPayrollRuns(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching payroll runs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinanceRuns = async () => {
    try {
      setFinanceLoading(true);
      setFinanceError(null);
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/finance/pending', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending finance approvals');
      }

      const data = await response.json();
      setFinanceRuns(data);
    } catch (err: any) {
      setFinanceError(err.message || 'An error occurred while fetching pending finance approvals');
    } finally {
      setFinanceLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRuns();
    if (hasRole('finance staff', 'system admin')) {
      fetchFinanceRuns();
    }
  }, []);

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

  const handleApproveRun = async () => {
    if (!selectedRun) return;

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowApproveModal(false);
      setSelectedRun(null);
      await fetchPayrollRuns();
    } catch (err: any) {
      console.error('Approve payroll error:', err);
      setActionError(err.message || 'An error occurred while approving the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRun = async () => {
    if (!selectedRun || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reject payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowRejectModal(false);
      setSelectedRun(null);
      setRejectionReason('');
      await fetchPayrollRuns();
    } catch (err: any) {
      console.error('Reject payroll error:', err);
      setActionError(err.message || 'An error occurred while rejecting the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinanceApproveRun = async () => {
    if (!selectedRun) return;

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/finance/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowApproveModal(false);
      setSelectedRun(null);
      await fetchFinanceRuns();
    } catch (err: any) {
      console.error('Finance approve payroll error:', err);
      setActionError(err.message || 'An error occurred while approving the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinanceRejectRun = async () => {
    if (!selectedRun || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await authenticatedFetch('http://localhost:3000/payroll-execution/finance/reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payrollRunId: selectedRun._id,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reject payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setShowRejectModal(false);
      setSelectedRun(null);
      setRejectionReason('');
      await fetchFinanceRuns();
    } catch (err: any) {
      console.error('Finance reject payroll error:', err);
      setActionError(err.message || 'An error occurred while rejecting the payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (runId: string) => {
    router.push(`/payroll/execution/review/${runId}`);
  };

  const handlePreview = (runId: string) => {
    router.push(`/payroll/execution/preview/${runId}`);
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Entity is always required
    if (!createData.entity) {
      setCreateError('Please enter an entity');
      return;
    }
    
    // Payroll period is only required for manual creation (not auto-generate)
    if (!createData.autoGenerate && !createData.payrollPeriod) {
      setCreateError('Please select a payroll period');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      
      // Refresh the list to get the latest payroll runs before checking for duplicates
      const refreshResponse = await authenticatedFetch('http://localhost:3000/payroll-execution/review', {
        method: 'GET',
      });
      
      if (refreshResponse.ok) {
        const freshData = await refreshResponse.json();
        setPayrollRuns(freshData);
        
        // Now check if a payroll run already exists for this month and entity using fresh data
        const targetDate = createData.autoGenerate && !createData.payrollPeriod 
          ? new Date() 
          : new Date(createData.payrollPeriod);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        
        const existingRun = freshData.find((run: PayrollRun) => {
          const runDate = new Date(run.payrollPeriod);
          return run.entity.toLowerCase() === createData.entity.toLowerCase() &&
                 runDate.getMonth() === targetMonth &&
                 runDate.getFullYear() === targetYear;
        });

        if (existingRun) {
          setCreateError(`A payroll run already exists for ${createData.entity} in ${targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Only one payroll run per month is allowed.`);
          setCreateLoading(false);
          return;
        }
      }
      
      // Use auto-generate endpoint if autoGenerate is true, otherwise use initiate
      const endpoint = createData.autoGenerate 
        ? 'http://localhost:3000/payroll-execution/auto-generate'
        : 'http://localhost:3000/payroll-execution/initiate';
      
      // Build request body - only include payrollPeriod if provided
      const requestBody: any = {
        entity: createData.entity,
      };
      if (createData.payrollPeriod) {
        requestBody.payrollPeriod = createData.payrollPeriod;
      }
      
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create payroll run';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          // If it's a validation error with multiple messages
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Success - close modal and refresh list
      setShowCreateModal(false);
      setCreateData({ payrollPeriod: '', entity: '', autoGenerate: false });
      await fetchPayrollRuns();
    } catch (err: any) {
      console.error('Create payroll error:', err);
      setCreateError(err.message || 'An error occurred while creating the payroll run');
    } finally {
      setCreateLoading(false);
    }
  };

  // Derived filtered lists
  const filteredPayrollRuns = payrollRuns.filter((run) => {
    const q = searchQuery.trim().toLowerCase();
    const entityQ = entityFilter.trim().toLowerCase();
    if (statusFilter !== 'all' && (run.status || '').toLowerCase() !== statusFilter) return false;
    if (q) {
      if (!(`${run.runId}`.toLowerCase().includes(q) || `${run.entity}`.toLowerCase().includes(q))) return false;
    }
    if (entityQ && !(`${run.entity}`.toLowerCase().includes(entityQ))) return false;
    return true;
  });

  const filteredFinanceRuns = financeRuns.filter((run) => {
    const q = financeSearchQuery.trim().toLowerCase();
    if (financeStatusFilter !== 'all' && (run.status || '').toLowerCase() !== financeStatusFilter) return false;
    if (q) {
      if (!(`${run.runId}`.toLowerCase().includes(q) || `${run.entity}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  return (
    <DashboardLayout 
      title="Payroll Review" 
      description="Review and manage draft payroll runs"
    >
      <div className="space-y-6">
        {/* Draft Payroll Runs Section - only for Payroll Specialists and Managers */}
        {!hasRole('finance staff') && (
          <>
        {/* Header Actions */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Draft Payroll Runs</h2>
            <p className="text-sm text-gray-400 mt-1">
              Review and approve payroll runs before submission
            </p>

            {/* Filters */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search run ID or entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded text-sm text-white w-60"
              />
              <input
                type="text"
                placeholder="Filter by entity"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded text-sm text-white w-48"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded text-sm text-white"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="under review">Under Review</option>
                <option value="pending finance approval">Pending Finance Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="locked">Locked</option>
              </select>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setEntityFilter(''); fetchPayrollRuns(); }}
                className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded text-sm"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
              {hasRole('payroll specialist', 'system admin') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus size={18} />
                  Create Run
                </button>
              )}
              {hasRole('payroll specialist', 'system admin') && (
                <button
                  onClick={() => router.push('/payroll/execution/escalate')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                  title="Escalate an irregularity"
                >
                  <AlertCircle size={18} />
                  Escalate
                </button>
              )}
              {hasRole('payroll manager', 'system admin') && (
                <button
                  onClick={() => router.push('/payroll/execution/manager-approval')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  title="Lock/Unlock approved payroll runs"
                >
                  <Lock size={18} />
                  Manage Payroll
                </button>
              )}
              {hasRole('finance staff', 'system admin') && (
                <button
                  onClick={() => router.push('/payroll/execution/finance-approval')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <DollarSign size={18} />
                  Finance Approvals
                </button>
              )}
            <button
              onClick={() => {
                fetchPayrollRuns();
                if (hasRole('finance staff', 'system admin')) {
                  fetchFinanceRuns();
                }
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="text-gray-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && payrollRuns.length === 0 && (
          <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
            <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Draft Payroll Runs</h3>
            <p className="text-gray-400">
              There are currently no draft payroll runs awaiting review.
            </p>
          </div>
        )}

        {/* Payroll Runs Table */}
        {!loading && !error && payrollRuns.length > 0 && (
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Run ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Exceptions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Total Net Pay
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredPayrollRuns.length > 0 ? filteredPayrollRuns.map((run) => (
                    <tr 
                      key={run._id} 
                      className="hover:bg-[#333333] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">
                          {run.runId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar size={16} />
                          {formatDate(run.payrollPeriod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{run.entity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Users size={16} />
                          {run.employees}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {run.exceptions > 0 ? (
                            <>
                              <AlertCircle size={16} className="text-yellow-500" />
                              <span className="text-sm text-yellow-500 font-medium">
                                {run.exceptions}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <DollarSign size={16} />
                          {formatCurrency(run.totalnetpay)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {(() => {
                            if (!run.payrollSpecialistId || typeof run.payrollSpecialistId !== 'object') {
                              return 'N/A';
                            }
                            const name = `${run.payrollSpecialistId.firstName || ''} ${run.payrollSpecialistId.lastName || ''}`.trim();
                            return name || run.payrollSpecialistId.employeeNumber || 'N/A';
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(run._id)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleViewDetails(run._id)}
                            className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            title="Details"
                          >
                            <FileText size={18} />
                          </button>
                          {run.status.toLowerCase() === 'draft' && hasRole('payroll specialist', 'system admin') && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRun(run);
                                  setShowApproveModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRun(run);
                                  setShowRejectModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-400">No payroll runs match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && !error && payrollRuns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Runs</div>
              <div className="text-2xl font-bold text-white">{payrollRuns.length}</div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-white">
                {payrollRuns.reduce((sum, run) => sum + run.employees, 0)}
              </div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Exceptions</div>
              <div className="text-2xl font-bold text-yellow-500">
                {payrollRuns.reduce((sum, run) => sum + run.exceptions, 0)}
              </div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Net Pay</div>
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(payrollRuns.reduce((sum, run) => sum + run.totalnetpay, 0))}
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Finance Approval Runs Section - only for Finance Staff */}
        {hasRole('finance staff', 'system admin') && (
          <>
            <div className="mt-12 pt-8 border-t border-gray-700">
                <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pending Finance Approvals</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Payroll runs awaiting financial review and approval
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search run ID or entity..."
                    value={financeSearchQuery}
                    onChange={(e) => setFinanceSearchQuery(e.target.value)}
                    className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded text-sm text-white w-60"
                  />
                  <select
                    value={financeStatusFilter}
                    onChange={(e) => setFinanceStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded text-sm text-white"
                  >
                    <option value="all">All statuses</option>
                    <option value="under review">Under Review</option>
                    <option value="pending finance approval">Pending Finance Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => { setFinanceSearchQuery(''); setFinanceStatusFilter('all'); fetchFinanceRuns(); }}
                    className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded text-sm"
                  >
                    Clear
                  </button>
                </div>
                <button
                  onClick={fetchFinanceRuns}
                  disabled={financeLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={18} className={financeLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* Finance Error Message */}
              {financeError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {financeError}
                </div>
              )}

              {/* Finance Loading State */}
              {financeLoading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={32} className="text-gray-400 animate-spin" />
                </div>
              )}

              {/* Finance Empty State */}
              {!financeLoading && !financeError && financeRuns.length === 0 && (
                <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
                  <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
                  <p className="text-gray-400">
                    There are no payroll runs awaiting finance approval at this time.
                  </p>
                </div>
              )}

              {/* Finance Payroll Runs Table */}
              {!financeLoading && !financeError && financeRuns.length > 0 && (
                <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#1a1a1a] border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Run ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Entity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Employees
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Exceptions
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Net Pay
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                              <tbody className="divide-y divide-gray-700">
                                {filteredFinanceRuns.length > 0 ? filteredFinanceRuns.map((run) => (
                          <tr key={run._id} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-white">{run.runId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{formatDate(run.payrollPeriod)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{run.entity}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                run.status.toLowerCase() === 'pending finance approval'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : run.status.toLowerCase() === 'under review'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-400">{run.employees}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-400">{run.exceptions}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-green-400">
                                {formatCurrency(run.totalnetpay)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handlePreview(run._id)}
                                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                  title="Preview"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleViewDetails(run._id)}
                                  className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                  title="Details"
                                >
                                  <FileText size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRun(run);
                                    setActionError(null);
                                    setShowApproveModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRun(run);
                                    setActionError(null);
                                    setRejectionReason('');
                                    setShowRejectModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No finance runs match your filters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Finance Summary Stats */}
              {!financeLoading && !financeError && financeRuns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-[#2a2a2a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Pending Runs</div>
                    <div className="text-2xl font-bold text-white">{financeRuns.length}</div>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Employees</div>
                    <div className="text-2xl font-bold text-white">
                      {financeRuns.reduce((sum, run) => sum + run.employees, 0)}
                    </div>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Exceptions</div>
                    <div className="text-2xl font-bold text-yellow-500">
                      {financeRuns.reduce((sum, run) => sum + run.exceptions, 0)}
                    </div>
                  </div>
                  <div className="bg-[#2a2a2a] rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Net Pay</div>
                    <div className="text-2xl font-bold text-green-500">
                      {formatCurrency(financeRuns.reduce((sum, run) => sum + run.totalnetpay, 0))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Run Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Create Payroll Run</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setCreateData({ payrollPeriod: '', entity: '', autoGenerate: false });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {createError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateRun} className="space-y-4">
                <div>
                  <label htmlFor="payrollPeriod" className="block text-sm font-medium text-gray-300 mb-2">
                    Payroll Period {!createData.autoGenerate && '*'}
                  </label>
                  <input
                    type="date"
                    id="payrollPeriod"
                    value={createData.payrollPeriod}
                    onChange={(e) => setCreateData({ ...createData, payrollPeriod: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required={!createData.autoGenerate}
                    disabled={createData.autoGenerate}
                    placeholder={createData.autoGenerate ? 'Will use current month' : ''}
                  />
                  {createData.autoGenerate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-generate will use the current month's end date
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="entity" className="block text-sm font-medium text-gray-300 mb-2">
                    Entity *
                  </label>
                  <input
                    type="text"
                    id="entity"
                    value={createData.entity}
                    onChange={(e) => setCreateData({ ...createData, entity: e.target.value })}
                    placeholder="Enter entity name"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <input
                    type="checkbox"
                    id="autoGenerate"
                    checked={createData.autoGenerate}
                    onChange={(e) => setCreateData({ ...createData, autoGenerate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-[#2a2a2a] border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="autoGenerate" className="text-sm font-medium text-white cursor-pointer">
                      Auto-generate payroll
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Automatically calculate payroll for all eligible employees
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                      setCreateData({ payrollPeriod: '', entity: '', autoGenerate: false });
                    }}
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createLoading}
                  >
                    {createLoading 
                      ? (createData.autoGenerate ? 'Generating...' : 'Creating...') 
                      : (createData.autoGenerate ? 'Generate Run' : 'Create Run')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveModal && selectedRun && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Approve Payroll Run</h3>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRun(null);
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-300 mb-2">Run ID:</p>
                  <p className="text-base font-medium text-white">{selectedRun.runId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300 mb-2">Entity:</p>
                  <p className="text-base font-medium text-white">{selectedRun.entity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300 mb-2">Period:</p>
                  <p className="text-base font-medium text-white">{formatDate(selectedRun.payrollPeriod)}</p>
                </div>
                <p className="text-sm text-gray-400 pt-2 border-t border-gray-700">
                  Are you sure you want to approve this payroll run?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRun(null);
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isFinanceRun = financeRuns.some(r => r._id === selectedRun._id);
                    if (isFinanceRun) {
                      handleFinanceApproveRun();
                    } else {
                      handleApproveRun();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectModal && selectedRun && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Reject Payroll Run</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRun(null);
                    setRejectionReason('');
                    setActionError(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {actionError && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-300 mb-2">Run ID:</p>
                  <p className="text-base font-medium text-white">{selectedRun.runId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300 mb-2">Entity:</p>
                  <p className="text-base font-medium text-white">{selectedRun.entity}</p>
                </div>
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRun(null);
                    setRejectionReason('');
                    setActionError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isFinanceRun = financeRuns.some(r => r._id === selectedRun._id);
                    if (isFinanceRun) {
                      handleFinanceRejectRun();
                    } else {
                      handleRejectRun();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
