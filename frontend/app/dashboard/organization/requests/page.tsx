'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, Loader, ArrowLeft, Plus, Trash2, Send, Check, X, Calendar, FileText, AlertCircle 
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  deleteChangeRequest,
  ChangeRequest,
} from '@/app/lib/api/organizationService';

export default function ChangeRequestsPage() {
  const router = useRouter();

  // Admin requests state
  const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAdminRequests();
  }, []);

  const loadAdminRequests = async () => {
    try {
      setAdminLoading(true);
      setAdminError(null);
      const data = await getChangeRequests();
      setAllRequests(Array.isArray(data) ? data : []);
      setIsAdmin(true);
    } catch (err) {
      // If it fails, user is probably not authorized - that's okay
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  const refreshAdminRequests = async () => {
    await loadAdminRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-900/30 text-gray-300 border border-gray-700';
      case 'SUBMITTED':
        return 'bg-blue-900/30 text-blue-400 border border-blue-700';
      case 'UNDER_REVIEW':
        return 'bg-purple-900/30 text-purple-400 border border-purple-700';
      case 'APPROVED':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'REJECTED':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      case 'IMPLEMENTED':
        return 'bg-green-900/50 text-green-300 border border-green-600';
      default:
        return 'bg-gray-900/30 text-gray-400 border border-gray-700';
    }
  };

  // ===================== ADMIN ACTIONS =====================
  const handleAdminApprove = async (id: string) => {
    const comments = prompt('Add approval comments (optional):');
    if (comments === null) return;
    try {
      setAdminActionLoading(`approve-${id}`);
      await approveChangeRequest(id, comments);
      alert('Request approved successfully!');
      await refreshAdminRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleAdminReject = async (id: string) => {
    const comments = prompt('Add rejection reason:');
    if (!comments) {
      alert('Rejection reason is required');
      return;
    }
    try {
      setAdminActionLoading(`reject-${id}`);
      await rejectChangeRequest(id, comments);
      alert('Request rejected successfully!');
      await refreshAdminRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      setAdminActionLoading(`delete-${id}`);
      await deleteChangeRequest(id);
      alert('Request deleted successfully!');
      await refreshAdminRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete request');
    } finally {
      setAdminActionLoading(null);
    }
  };

  return (
    <DashboardLayout
      title="Change Requests"
      description="Manage organization structure change requests"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={() => router.push('/dashboard/organization/requests/create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Create Request
          </button>
        </div>

        {/* ===================== ADMIN APPROVAL CARD ===================== */}
        {isAdmin && (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">All Change Requests (Admin)</h2>
                <p className="text-sm text-gray-400 mt-1">Review, approve, reject and manage all requests</p>
              </div>
              <button
                onClick={refreshAdminRequests}
                disabled={adminLoading}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Loader size={20} className={adminLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {adminError && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="mt-1 flex-shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            {adminLoading ? (
              <div className="flex justify-center py-12">
                <Loader size={40} className="animate-spin text-blue-500" />
              </div>
            ) : allRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Reason</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Created</th>
                      <th className="text-center py-3 px-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.map((request) => (
                      <tr
                        key={request._id}
                        className="border-b border-gray-700 hover:bg-[#222222] transition-colors"
                      >
                        <td className="py-3 px-4 text-white font-medium">{request.requestType}</td>
                        <td className="py-3 px-4 text-gray-300 max-w-xs truncate">{request.reason || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(request.status || 'DRAFT')}`}>
                            {request.status || 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/dashboard/organization/requests/${request._id}`)}
                              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              title="View details"
                            >
                              <Eye size={14} className="text-white" />
                            </button>

                            {(request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW') && (
                              <>
                                <button
                                  onClick={() => handleAdminApprove(request._id || '')}
                                  disabled={adminActionLoading === `approve-${request._id}`}
                                  className="p-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                                  title="Approve"
                                >
                                  {adminActionLoading === `approve-${request._id}` ? (
                                    <Loader size={14} className="text-white animate-spin" />
                                  ) : (
                                    <Check size={14} className="text-white" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleAdminReject(request._id || '')}
                                  disabled={adminActionLoading === `reject-${request._id}`}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded transition-colors"
                                  title="Reject"
                                >
                                  {adminActionLoading === `reject-${request._id}` ? (
                                    <Loader size={14} className="text-white animate-spin" />
                                  ) : (
                                    <X size={14} className="text-white" />
                                  )}
                                </button>
                              </>
                            )}

                            {(request.status === 'DRAFT' || request.status === 'REJECTED') && (
                              <button
                                onClick={() => handleAdminDelete(request._id || '')}
                                disabled={adminActionLoading === `delete-${request._id}`}
                                className="p-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded transition-colors"
                                title="Delete"
                              >
                                {adminActionLoading === `delete-${request._id}` ? (
                                  <Loader size={14} className="text-white animate-spin" />
                                ) : (
                                  <Trash2 size={14} className="text-white" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-dashed border-gray-700 rounded-lg p-8 text-center">
                <FileText size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No requests in the system yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
