'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../context/AuthContext';
import { useEffect, useState } from 'react';
import {
  Calendar,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader,
  MessageSquare
} from 'lucide-react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface LeaveType {
  _id: string;
  code: string;
  name: string;
}

interface Attachment {
  _id: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface ApprovalStep {
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
}

interface LeaveRequest {
  _id: string;
  employeeId: Employee;
  leaveTypeId: LeaveType;
  dates: {
    from: string;
    to: string;
  };
  durationDays: number;
  status: string;
  justification?: string;
  attachmentId?: Attachment;
  approvalFlow: ApprovalStep[];
  createdAt: string;
}

export default function ManagerPendingReviewsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authenticatedFetch('http://localhost:3000/leave-requests/manager/pending-reviews');
      
      if (response.ok) {
        const result = await response.json();
        setLeaveRequests(result.data || []);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to load pending requests');
      }
    } catch (err) {
      setError('An error occurred while loading pending requests');
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, requestComments?: string) => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:3000/leave-requests/${requestId}/manager/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comments: requestComments || '' }),
        }
      );

      if (response.ok) {
        // Refresh the list
        await fetchPendingRequests();
        setSelectedRequest(null);
        setComments('');
        setShowCommentsModal(false);
        setPendingAction(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to approve request');
      }
    } catch (err) {
      setError('An error occurred while approving the request');
      console.error('Error approving request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string, requestComments?: string) => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:3000/leave-requests/${requestId}/manager/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comments: requestComments || '' }),
        }
      );

      if (response.ok) {
        // Refresh the list
        await fetchPendingRequests();
        setSelectedRequest(null);
        setComments('');
        setShowCommentsModal(false);
        setPendingAction(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to reject request');
      }
    } catch (err) {
      setError('An error occurred while rejecting the request');
      console.error('Error rejecting request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (action: 'approve' | 'reject', request: LeaveRequest) => {
    setPendingAction(action);
    setSelectedRequest(request);
    setShowCommentsModal(true);
    setComments('');
  };

  const confirmAction = () => {
    if (!selectedRequest || !pendingAction) return;

    if (pendingAction === 'approve') {
      handleApprove(selectedRequest._id, comments);
    } else {
      handleReject(selectedRequest._id, comments);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: Clock },
      approved: { bg: 'bg-green-900/30', text: 'text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-900/30', text: 'text-red-400', icon: XCircle },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout
      title="Pending Leave Reviews"
      description="Review and approve leave requests from your team members"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-500 font-semibold">Error</h3>
              <p className="text-gray-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Reviews</p>
                <p className="text-3xl font-bold text-white mt-2">{leaveRequests.length}</p>
              </div>
              <div className="bg-yellow-900/30 rounded-full p-3">
                <Clock className="text-yellow-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests List */}
        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
            <p className="text-gray-400">Loading pending requests...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
            <CheckCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No Pending Reviews</h3>
            <p className="text-gray-400">You have no leave requests awaiting your review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {leaveRequests.map((request) => (
              <div key={request._id} className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Employee Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-900/30 rounded-full p-2">
                        <User className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {request.employeeId.firstName} {request.employeeId.lastName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Employee #{request.employeeId.employeeNumber}
                        </p>
                      </div>
                    </div>

                    {/* Leave Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Leave Type</p>
                        <p className="text-white font-medium">
                          {request.leaveTypeId.name} ({request.leaveTypeId.code})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Start Date</p>
                        <div className="flex items-center gap-2 text-white">
                          <Calendar size={14} />
                          <span>{formatDate(request.dates.from)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">End Date</p>
                        <div className="flex items-center gap-2 text-white">
                          <Calendar size={14} />
                          <span>{formatDate(request.dates.to)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Duration</p>
                        <p className="text-white font-medium">{request.durationDays} days</p>
                      </div>
                    </div>

                    {/* Justification */}
                    {request.justification && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1">Justification</p>
                        <p className="text-gray-300 text-sm bg-[#1a1a1a] rounded-lg p-3">
                          {request.justification}
                        </p>
                      </div>
                    )}

                    {/* Attachment */}
                    {request.attachmentId && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <FileText size={16} />
                          <span>Attachment: {request.attachmentId.filename}</span>
                          <button
                            onClick={() => window.open(`http://localhost:3000/attachments/${request.attachmentId?._id}`, '_blank')}
                            title="Open attachment"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submitted Date */}
                    <p className="text-xs text-gray-500">
                      Submitted on {formatDate(request.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => openActionModal('approve', request)}
                      title="Approve"
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => openActionModal('reject', request)}
                      title="Reject"
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {pendingAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                {pendingAction === 'approve' 
                  ? `Are you sure you want to approve this leave request for ${selectedRequest.employeeId.firstName} ${selectedRequest.employeeId.lastName}?`
                  : `Are you sure you want to reject this leave request for ${selectedRequest.employeeId.firstName} ${selectedRequest.employeeId.lastName}?`
                }
              </p>
              
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare size={16} />
                  Comments {pendingAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={pendingAction === 'reject' ? 'Please provide a reason for rejection' : 'Add optional comments'}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setPendingAction(null);
                  setSelectedRequest(null);
                  setComments('');
                }}
                disabled={actionLoading}
                title="Cancel"
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading || (pendingAction === 'reject' && !comments.trim())}
                title={actionLoading ? 'Processing...' : pendingAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                className={`flex-1 px-4 py-2 ${
                  pendingAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? (
                  <Loader className="animate-spin mx-auto" size={20} />
                ) : (
                  `Confirm ${pendingAction === 'approve' ? 'Approval' : 'Rejection'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
