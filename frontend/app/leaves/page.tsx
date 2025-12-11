'use client';

import { useAuth, authenticatedFetch } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays
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
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await authenticatedFetch('http://localhost:3000/leave-requests/my-history');
      
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

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  return (
    <>
      <DashboardLayout
        title="My Leave Requests"
        description="View and manage your leave requests"
      >
        {/* Action Bar */}
          <div className="mb-6 flex items-center justify-between">
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
              href="/dashboard/leaves/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={18} />
              New Request
            </Link>
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
              <Link
                href="/dashboard/leaves/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={18} />
                Create Your First Request
              </Link>
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
                            {request.leaveTypeId.name}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    onClick={() => {
                      // Add cancel logic here
                      alert('Cancel functionality to be implemented');
                    }}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
