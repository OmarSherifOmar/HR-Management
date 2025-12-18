'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, Send, Plus, Eye, Check, Trash2, FileText } from 'lucide-react';
import {
  getUserChangeRequests,
  submitChangeRequest,
  deleteChangeRequest,
  ChangeRequest,
} from '@/app/lib/api/organizationService';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function MyChangeRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserChangeRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await submitChangeRequest(requestId);
      alert('Request submitted successfully!');
      await loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this draft request?')) return;
    try {
      setActionLoading(requestId);
      await deleteChangeRequest(requestId);
      alert('Request deleted successfully!');
      await loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-900/30 text-gray-400 border border-gray-700';
      case 'SUBMITTED':
        return 'bg-blue-900/30 text-blue-400 border border-blue-700';
      case 'UNDER_REVIEW':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700';
      case 'APPROVED':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'REJECTED':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border border-gray-700';
    }
  };

  return (
    <DashboardLayout title="My Change Requests">
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-3xl font-bold">My Change Requests</h1>
            <button
              onClick={() => router.push('/dashboard/organization/requests/create')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus size={20} />
              Create Request
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-blue-400" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>No requests yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Request #</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Reason</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req._id} className="border-b border-[#2a2a2a] hover:bg-[#151515] transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">{req.requestNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{req.requestType}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-xs">{req.reason || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => router.push(`/dashboard/organization/requests/${req._id}`)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View details"
                            >
                              <Eye size={18} />
                            </button>
                            {req.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => req._id && handleSubmit(req._id)}
                                  disabled={actionLoading === req._id}
                                  className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                  title="Submit request"
                                >
                                  {actionLoading === req._id ? (
                                    <Loader size={18} className="animate-spin" />
                                  ) : (
                                    <Send size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => req._id && handleDelete(req._id)}
                                  disabled={actionLoading === req._id}
                                  className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                  title="Delete request"
                                >
                                  {actionLoading === req._id ? (
                                    <Loader size={18} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={18} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
