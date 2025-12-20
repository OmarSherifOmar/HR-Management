'use client';

import { useState, useEffect } from 'react';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';

import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader,
  Filter,
} from 'lucide-react';

interface ChangeRequest {
  _id: string;
  employeeProfileId: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    workEmail: string;
  };
  requestDescription: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
}

const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function HRChangeRequestReview() {
  const { canListChangeRequests, canReviewChangeRequests } = useCanAccess();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    if (canListChangeRequests()) {
      fetchChangeRequests();
    }
  }, []);

  useEffect(() => {
    const filtered = requests.filter((req) => {
      if (filterStatus === 'ALL') return true;
      return req.status === filterStatus;
    });
    setFilteredRequests(filtered);
  }, [requests, filterStatus]);

  const fetchChangeRequests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${URL}/employees/change-requests`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch change requests');
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, approve: boolean) => {
    try {
      const response = await fetch(
        `${URL}/employees/change-requests/${id}/review`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            approve,
            notes: reviewReason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to review change request');
      }

      setRequests((prev) =>
        prev.map((req) =>
          req._id === id
            ? {
                ...req,
                status: approve ? 'APPROVED' : 'REJECTED',
                processedAt: new Date().toISOString(),
              }
            : req
        )
      );

      setReviewingId(null);
      setReviewReason('');
    } catch (err) {
      error || setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'REJECTED':
        return <XCircle size={20} className="text-red-400" />;
      case 'PENDING':
        return <Clock size={20} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-900/20 border-green-700';
      case 'REJECTED':
        return 'bg-red-900/20 border-red-700';
      case 'PENDING':
        return 'bg-yellow-900/20 border-yellow-700';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <RoleBasedAccess requiredAccess={canListChangeRequests}>
      <div className="space-y-6">
        {/* Filter */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-blue-400 animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-6 text-center bg-[#2a2a2a] rounded-lg border border-gray-700">
              <p className="text-gray-400">No change requests found</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req._id}
                className={`p-6 rounded-lg border ${getStatusColor(req.status)} bg-[#2a2a2a]`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">
                      {req.employeeProfileId.firstName}{' '}
                      {req.employeeProfileId.lastName}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>
                        <strong>Employee #:</strong>{' '}
                        {req.employeeProfileId.employeeNumber}
                      </p>
                      <p>
                        <strong>Email:</strong> {req.employeeProfileId.workEmail}
                      </p>
                      <p className="mt-2">{req.requestDescription}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(req.status)}
                    <span className="text-sm font-semibold uppercase">
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4 p-3 bg-[#1a1a1a] rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Reason:</p>
                  <p className="text-gray-200 text-sm">{req.reason}</p>
                </div>

                {/* Dates */}
                <div className="flex gap-4 text-xs text-gray-400 mb-4">
                  <p>
                    Submitted:{' '}
                    {new Date(req.submittedAt).toLocaleDateString()}
                  </p>
                  {req.processedAt && (
                    <p>
                      Processed:{' '}
                      {new Date(req.processedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Review Section */}
                {canReviewChangeRequests() && req.status === 'PENDING' && (
                  <div className="pt-4 border-t border-gray-600">
                    {reviewingId === req._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={reviewReason}
                          onChange={(e) => setReviewReason(e.target.value)}
                          placeholder="Add notes (optional)"
                          rows={2}
                          className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleReview(req._id, true)
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleReview(req._id, false)
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          <button
                            onClick={() => setReviewingId(null)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(req._id)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Review Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </RoleBasedAccess>
  );
}
