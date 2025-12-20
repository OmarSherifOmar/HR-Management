'use client';

import { useAuth, authenticatedFetch } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  X
} from 'lucide-react';

type LeaveRequest = {
  _id: string;
  employeeId: string;
  leaveTypeId: {
    name: string;
    code: string;
  };
  dates: {
    from: string;
    to: string;
  };
  durationDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  justification?: string;
  createdAt: string;
};

export default function LeaveRequestsPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-newest' | 'date-oldest' | 'leave-type' | 'status'>('date-newest');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (isLoggedIn) {
      fetchLeaveRequests();
    }
  }, [isLoading, isLoggedIn, router]);

  const cancelLeaveRequest = async (requestId: string) => {
    try {
      setCancellingRequest(true);
      setCancelError('');
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      const response = await authenticatedFetch(`${URL}/leave-requests/${requestId}/cancel`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh the leave requests list
        await fetchLeaveRequests();
        setSelectedRequest(null);
      } else {
        const result = await response.json();
        setCancelError(result.message || 'Failed to cancel leave request');
      }
    } catch (err: any) {
      setCancelError(err.message || 'An error occurred while cancelling the request');
      console.error('Error cancelling leave request:', err);
    } finally {
      setCancellingRequest(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoadingRequests(true);
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(`${URL}/leave-requests/my-history`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Leave requests data:', result.data);
        setLeaveRequests(result.data || []);
      } else if (response.status !== 401) {
        // 401 is already handled by authenticatedFetch
        console.error('Failed to fetch leave requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'pending':
        return <AlertCircle size={20} className="text-yellow-500" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-600 text-white',
      rejected: 'bg-red-600 text-white',
      pending: 'bg-yellow-600 text-white',
      cancelled: 'bg-gray-600 text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-600 text-white';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Extract unique leave types for filtering
  const uniqueLeaveTypes = Array.from(
    new Map(leaveRequests.map(req => [req.leaveTypeId.code, req.leaveTypeId])).values()
  );

  const filteredRequests = leaveRequests.filter(request => {
    // Status filter
    if (filter !== 'all' && request.status !== filter) return false;

    // Leave type filter
    if (leaveTypeFilter !== 'all' && request.leaveTypeId.code !== leaveTypeFilter) return false;

    // Date range filter - filter by leave period dates
    if (dateFrom) {
      const requestStartDate = new Date(request.dates.from);
      const filterFromDate = new Date(dateFrom);
      if (requestStartDate < filterFromDate) return false;
    }

    if (dateTo) {
      const requestEndDate = new Date(request.dates.to);
      const filterToDate = new Date(dateTo);
      if (requestEndDate > filterToDate) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-newest':
        return new Date(b.dates.from).getTime() - new Date(a.dates.from).getTime();
      case 'date-oldest':
        return new Date(a.dates.from).getTime() - new Date(b.dates.from).getTime();
      case 'leave-type':
        return a.leaveTypeId.name.localeCompare(b.leaveTypeId.name);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <DashboardLayout
        title="My Leave Requests"
        description="View and manage your leave requests"
      >
        {/* Action Bar */}
          <div className="mb-6 space-y-4">
            {/* Filter Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  Rejected
                </button>
              </div>

              <Link
                href="/leaves/new-request"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={18} />
                New Request
              </Link>
            </div>

            {/* Date Range Filter */}
            <div className="bg-[#2a2a2a] rounded-lg p-4 flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Leave Period From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Leave Period To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Leave Type
                </label>
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="all">All Types</option>
                  {uniqueLeaveTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
                  <option value="leave-type">Leave Type</option>
                  <option value="status">Status</option>
                </select>
              </div>
              {(dateFrom || dateTo || leaveTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setLeaveTypeFilter('all');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Leave Requests List */}
          {loadingRequests ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
              <div className="text-gray-400">Loading requests...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
              <CalendarDays size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Leave Requests</h3>
              <p className="text-gray-400 mb-4">
                {filter === 'all'
                  ? "You haven't submitted any leave requests yet."
                  : `You don't have any ${filter} leave requests.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{getStatusIcon(request.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {request.leaveTypeId?.name || 'Leave Request'}
                          </h3>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(
                              request.status
                            )}`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Start Date</p>
                            <p className="text-sm text-white font-medium">
                              {formatDate(request.dates.from)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">End Date</p>
                            <p className="text-sm text-white font-medium">
                              {formatDate(request.dates.to)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Duration</p>
                            <p className="text-sm text-white font-medium">
                              {request.durationDays} {request.durationDays === 1 ? 'day' : 'days'}
                            </p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-400 mb-1">Reason</p>
                          <p className="text-sm text-gray-300">{request.justification || 'N/A'}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Submitted on {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedRequest(request)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </DashboardLayout>

      {/* Details Modal */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div 
            className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Leave Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedRequest.status)}
                <span className={`text-sm px-4 py-1.5 rounded-full font-medium ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>

              {/* Leave Type */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Leave Type</p>
                <p className="text-lg text-white font-semibold">{selectedRequest.leaveTypeId.name}</p>
                <p className="text-sm text-gray-400">{selectedRequest.leaveTypeId.code}</p>
              </div>

              {/* Dates and Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Start Date</p>
                  <p className="text-base text-white font-medium">{formatDate(selectedRequest.dates.from)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">End Date</p>
                  <p className="text-base text-white font-medium">{formatDate(selectedRequest.dates.to)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-base text-white font-medium">
                    {selectedRequest.durationDays} {selectedRequest.durationDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              {/* Justification */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Justification</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {selectedRequest.justification || 'No justification provided'}
                </p>
              </div>

              {/* Submission Date */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Submitted On</p>
                <p className="text-sm text-white">{formatDate(selectedRequest.createdAt)}</p>
              </div>

              {/* Cancel Error Alert */}
              {cancelError && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-red-500 font-semibold">Error</h3>
                    <p className="text-gray-300 text-sm mt-1">{cancelError}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setCancelError('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                  disabled={cancellingRequest}
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => router.push(`/leaves/edit/${selectedRequest._id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      disabled={cancellingRequest}
                    >
                      <FileText size={18} />
                      Edit Request
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this leave request? This action cannot be undone.')) {
                          cancelLeaveRequest(selectedRequest._id);
                        }
                      }}
                      disabled={cancellingRequest}
                    >
                      {cancellingRequest ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle size={18} />
                          Cancel Request
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
