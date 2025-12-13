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
  MessageSquare,
  Shield,
  Download
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
  originalName: string;
  fileType: string;
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

export default function HRPendingReviewsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'override' | null>(null);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
  const [rejectedRequests, setRejectedRequests] = useState<LeaveRequest[]>([]);
  const [showRejectedTab, setShowRejectedTab] = useState(false);
  
  // Bulk action states
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkComments, setBulkComments] = useState('');

  useEffect(() => {
    fetchPendingRequests();
    fetchRejectedRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authenticatedFetch('http://localhost:3000/leave-requests/hr/pending-reviews');
      
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

  const fetchRejectedRequests = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:3000/leave-requests/hr/rejected-requests');
      
      if (response.ok) {
        const result = await response.json();
        setRejectedRequests(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching rejected requests:', err);
    }
  };

  const handleApprove = async (requestId: string, requestComments?: string) => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:3000/leave-requests/${requestId}/hr/finalize`,
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
        `http://localhost:3000/leave-requests/${requestId}/hr/reject`,
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

  const handleOverride = async (requestId: string, requestComments?: string) => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:3000/leave-requests/${requestId}/hr/override`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'approve',
            comments: requestComments || '',
            allowNegativeBalance: allowNegativeBalance
          }),
        }
      );

      if (response.ok) {
        // Refresh both lists
        await fetchPendingRequests();
        await fetchRejectedRequests();
        setSelectedRequest(null);
        setComments('');
        setAllowNegativeBalance(false);
        setShowCommentsModal(false);
        setPendingAction(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to override request');
      }
    } catch (err) {
      setError('An error occurred while overriding the request');
      console.error('Error overriding request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (action: 'approve' | 'reject' | 'override', request: LeaveRequest) => {
    setPendingAction(action);
    setSelectedRequest(request);
    setShowCommentsModal(true);
    setComments('');
  };

  const confirmAction = () => {
    if (!selectedRequest || !pendingAction) return;

    if (pendingAction === 'approve') {
      handleApprove(selectedRequest._id, comments);
    } else if (pendingAction === 'reject') {
      handleReject(selectedRequest._id, comments);
    } else if (pendingAction === 'override') {
      handleOverride(selectedRequest._id, comments);
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const currentList = showRejectedTab ? rejectedRequests : leaveRequests;
    if (selectedRequests.size === currentList.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(currentList.map(req => req._id)));
    }
  };

  const handleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const openBulkModal = (action: 'approve' | 'reject') => {
    setBulkAction(action);
    setShowBulkModal(true);
    setBulkComments('');
  };

  const handleBulkApprove = async () => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        'http://localhost:3000/leave-requests/hr/bulk-finalize',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            requestIds: Array.from(selectedRequests),
            comments: bulkComments 
          }),
        }
      );

      if (response.ok) {
        await fetchPendingRequests();
        setSelectedRequests(new Set());
        setShowBulkModal(false);
        setBulkComments('');
        setBulkAction(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to approve requests');
      }
    } catch (err) {
      setError('An error occurred while approving requests');
      console.error('Error bulk approving:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        'http://localhost:3000/leave-requests/hr/bulk-reject',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            requestIds: Array.from(selectedRequests),
            comments: bulkComments 
          }),
        }
      );

      if (response.ok) {
        await fetchPendingRequests();
        setSelectedRequests(new Set());
        setShowBulkModal(false);
        setBulkComments('');
        setBulkAction(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to reject requests');
      }
    } catch (err) {
      setError('An error occurred while rejecting requests');
      console.error('Error bulk rejecting:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmBulkAction = () => {
    if (bulkAction === 'approve') {
      handleBulkApprove();
    } else if (bulkAction === 'reject') {
      handleBulkReject();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getManagerApprovalStatus = (request: LeaveRequest) => {
    const managerStep = request.approvalFlow.find(step => step.role === 'direct_manager');
    if (!managerStep) return null;
    
    return {
      status: managerStep.status,
      date: managerStep.decidedAt ? formatDate(managerStep.decidedAt) : null
    };
  };

  return (
    <DashboardLayout
      title="HR Leave Reviews"
      description="Review and finalize leave requests approved by managers"
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

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setShowRejectedTab(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !showRejectedTab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Pending Reviews ({leaveRequests.length})
          </button>
          <button
            onClick={() => {
              setShowRejectedTab(true);
              if (rejectedRequests.length === 0) {
                fetchRejectedRequests();
              }
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              showRejectedTab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Rejected Requests ({rejectedRequests.length})
          </button>
        </div>

        {/* Stats Summary */}
        {!showRejectedTab && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending HR Reviews</p>
                  <p className="text-3xl font-bold text-white mt-2">{leaveRequests.length}</p>
                </div>
                <div className="bg-blue-900/30 rounded-full p-3">
                  <Shield className="text-blue-400" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {!showRejectedTab && leaveRequests.length > 0 && (
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRequests.size === leaveRequests.length && leaveRequests.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-gray-300 text-sm font-medium">
                    Select All ({selectedRequests.size} selected)
                  </span>
                </label>
              </div>
              
              {selectedRequests.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openBulkModal('approve')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle size={18} />
                    <span>Finalize Selected ({selectedRequests.size})</span>
                  </button>
                  <button
                    onClick={() => openBulkModal('reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <XCircle size={18} />
                    <span>Reject Selected ({selectedRequests.size})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave Requests List */}
        {loading ? (
          <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
            <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
            <p className="text-gray-400">Loading {showRejectedTab ? 'rejected' : 'pending'} requests...</p>
          </div>
        ) : (showRejectedTab ? rejectedRequests : leaveRequests).length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
            <CheckCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">
              {showRejectedTab ? 'No Rejected Requests' : 'No Pending HR Reviews'}
            </h3>
            <p className="text-gray-400">
              {showRejectedTab 
                ? 'There are no rejected requests to display.' 
                : 'All leave requests have been processed.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(showRejectedTab ? rejectedRequests : leaveRequests).map((request) => {
              const managerApproval = getManagerApprovalStatus(request);
              const isSelected = selectedRequests.has(request._id);
              
              return (
                <div key={request._id} className={`bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-colors ${isSelected && !showRejectedTab ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox for bulk selection - only show for pending reviews */}
                    {!showRejectedTab && (
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRequest(request._id)}
                          className="w-5 h-5 rounded border-gray-600 bg-[#1a1a1a] text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>
                    )}
                    
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

                      {/* Manager Approval Badge */}
                      {managerApproval && managerApproval.status === 'approved' && (
                        <div className="mb-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/30 text-green-400 rounded-lg text-sm">
                            <CheckCircle size={16} />
                            <span>Manager Approved</span>
                            {managerApproval.date && (
                              <span className="text-green-400/70">• {managerApproval.date}</span>
                            )}
                          </div>
                        </div>
                      )}

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
                          <p className="text-xs text-gray-400 mb-2">Attachment</p>
                          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="text-blue-400" size={20} />
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {request.attachmentId.originalName}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {request.attachmentId.fileType?.toUpperCase()} • {(request.attachmentId.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <a
                              href={`http://localhost:3000/attachments/${request.attachmentId._id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              <Download size={16} />
                              Download
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Submitted Date */}
                      <p className="text-xs text-gray-500">
                        Submitted on {formatDate(request.createdAt)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {showRejectedTab ? (
                        <button
                          onClick={() => openActionModal('override', request)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Shield size={18} />
                          Override & Approve
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openActionModal('approve', request)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={18} />
                            Finalize & Approve
                          </button>
                          <button
                            onClick={() => openActionModal('reject', request)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle size={18} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {pendingAction === 'approve' 
                ? 'Finalize & Approve' 
                : pendingAction === 'override'
                ? 'Override & Approve'
                : 'Reject'} Leave Request
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                {pendingAction === 'approve' 
                  ? `Are you sure you want to finalize and approve this leave request for ${selectedRequest.employeeId.firstName} ${selectedRequest.employeeId.lastName}? This will deduct days from their balance.`
                  : pendingAction === 'override'
                  ? `Are you sure you want to override and approve this rejected leave request for ${selectedRequest.employeeId.firstName} ${selectedRequest.employeeId.lastName}? This will restore the request and deduct days from their balance.`
                  : `Are you sure you want to reject this leave request for ${selectedRequest.employeeId.firstName} ${selectedRequest.employeeId.lastName}?`
                }
              </p>
              
              {pendingAction === 'override' && (
                <div className="mt-4 mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowNegativeBalance}
                      onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span>Allow negative balance</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Check this to approve even if employee doesn't have enough leave balance
                  </p>
                </div>
              )}
              
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
                  setAllowNegativeBalance(false);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading || (pendingAction === 'reject' && !comments.trim())}
                className={`flex-1 px-4 py-2 ${
                  pendingAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : pendingAction === 'override'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? (
                  <Loader className="animate-spin mx-auto" size={20} />
                ) : (
                  `Confirm ${
                    pendingAction === 'approve' 
                      ? 'Approval' 
                      : pendingAction === 'override'
                      ? 'Override'
                      : 'Rejection'
                  }`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {bulkAction === 'approve' ? 'Bulk Finalize & Approve' : 'Bulk Reject'} Leave Requests
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                {bulkAction === 'approve' 
                  ? `Are you sure you want to finalize and approve ${selectedRequests.size} leave request(s)? This will deduct days from the employees' balances.`
                  : `Are you sure you want to reject ${selectedRequests.size} leave request(s)?`
                }
              </p>
              
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare size={16} />
                  Comments {bulkAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={bulkComments}
                  onChange={(e) => setBulkComments(e.target.value)}
                  placeholder={bulkAction === 'reject' ? 'Please provide a reason for rejection' : 'Add optional comments (will be applied to all selected requests)'}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkAction(null);
                  setBulkComments('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                disabled={actionLoading || (bulkAction === 'reject' && !bulkComments.trim())}
                className={`flex-1 px-4 py-2 ${
                  bulkAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? (
                  <Loader className="animate-spin mx-auto" size={20} />
                ) : (
                  `Confirm ${bulkAction === 'approve' ? 'Approval' : 'Rejection'} (${selectedRequests.size})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
