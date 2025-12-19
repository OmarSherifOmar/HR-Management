'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ChangeRequest {
  _id: string;
  requestDescription: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
}

export default function HRChangeRequestReview() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const fetchChangeRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${URL}/employees/change-requests`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        setError('Access Denied: You do not have permission to view change requests. This feature requires HR Admin or HR Manager role.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch change requests');
      }
    } catch (err) {
      setError('Error fetching change requests');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRequest = async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`${URL}/employees/change-requests/${id}/review`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });

      if (response.status === 403) {
        setError('Access Denied: You do not have permission to review change requests. This action requires HR Admin or HR Manager role.');
        return;
      }

      if (response.ok) {
        setSuccess(`Change request ${approve ? 'approved' : 'rejected'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        setReviewingId(null);
        fetchChangeRequests();
      } else {
        setError('Failed to review change request');
      }
    } catch (err) {
      setError('Error reviewing change request');
      console.error(err);
    }
  };

  const filteredRequests = requests.filter(
    (req) => filterStatus === 'ALL' || req.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-900/20 border-green-700 text-green-200';
      case 'REJECTED':
        return 'bg-red-900/20 border-red-700 text-red-200';
      case 'PENDING':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-200';
      default:
        return 'bg-gray-700 border-gray-600 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="text-green-500 mt-0.5" />
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Change Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading change requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {filterStatus === 'ALL' ? 'No change requests found' : `No ${filterStatus.toLowerCase()} requests found`}
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className={`p-4 border rounded-lg ${getStatusColor(req.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(req.status)}
                    <p className="font-medium text-sm">{req.requestDescription}</p>
                  </div>
                  <p className="text-xs opacity-75">{req.reason}</p>
                </div>
                <span className="text-xs font-semibold uppercase whitespace-nowrap ml-4">
                  {req.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs opacity-60">
                <div>
                  Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                </div>
                {req.processedAt && (
                  <div>
                    Processed: {new Date(req.processedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'PENDING' && reviewingId !== req._id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewingId(req._id)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Review
                  </button>
                </div>
              )}

              {/* Review Buttons */}
              {reviewingId === req._id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewRequest(req._id, true)}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewRequest(req._id, false)}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => setReviewingId(null)}
                    className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
