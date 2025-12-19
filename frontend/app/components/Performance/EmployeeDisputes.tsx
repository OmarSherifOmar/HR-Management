import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

interface DisputeRecord {
  _id: string;
  appraisalId: string;
  cycleId: string;
  reason: string;
  details?: string;
  submittedAt: string;
  status: 'OPEN' | 'REJECTED' | 'ADJUSTED';
  decision?: 'DENY' | 'APPROVE_CHANGE';
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedByEmployeeId?: string;
  employeeName?: string;
  cycleName?: string;
  appraisalRecord?: {
    id: string;
    totalScore: number;
    overallRatingLabel: string;
  };
}

interface EmployeeDisputesProps {
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function EmployeeDisputes({
  employeeId,
  onNotify,
}: EmployeeDisputesProps) {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:3000/api/performance/disputes/employee/me',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      onNotify?.(error.message || 'Error fetching disputes', 'error');
      console.error('[EmployeeDisputes] Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-600';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-600';
      case 'ADJUSTED':
        return 'bg-green-500/20 text-green-300 border-green-600';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-5 h-5" />;
      case 'REJECTED':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ADJUSTED':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getDecisionBadgeColor = (decision?: string) => {
    switch (decision) {
      case 'DENY':
        return 'bg-red-900/40 text-red-200';
      case 'APPROVE_CHANGE':
        return 'bg-green-900/40 text-green-200';
      default:
        return 'bg-gray-700/40 text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading disputes...</div>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-8 text-center">
        <AlertTriangle className="mx-auto w-12 h-12 text-gray-500 mb-3" />
        <p className="text-gray-400">No disputes filed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <div
          key={dispute._id}
          className="rounded-lg border border-gray-700 bg-gray-800/30 p-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(dispute.status)}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {dispute.cycleName || 'Dispute'}
                </h3>
                <p className="text-sm text-gray-400">
                  Filed on {new Date(dispute.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-2 ${getStatusColor(
                dispute.status
              )}`}
            >
              {dispute.status}
            </span>
          </div>

          {/* Reason and Details */}
          <div className="mb-4 space-y-3 rounded bg-gray-900/40 p-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Reason
              </p>
              <p className="text-sm text-gray-200 mt-1">{dispute.reason}</p>
            </div>

            {dispute.details && (
              <div className="border-t border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Details
                </p>
                <p className="text-sm text-gray-200 mt-1">{dispute.details}</p>
              </div>
            )}
          </div>

          {/* Appraisal Info */}
          {dispute.appraisalRecord && (
            <div className="mb-4 rounded bg-blue-900/20 border border-blue-700 p-3">
              <p className="text-sm font-medium text-blue-300 mb-2">
                Original Appraisal Score
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">
                  {dispute.appraisalRecord.totalScore}% -{' '}
                  {dispute.appraisalRecord.overallRatingLabel}
                </span>
              </div>
            </div>
          )}

          {/* Resolution (if resolved) */}
          {dispute.status !== 'OPEN' && (
            <div
              className={`rounded p-4 ${
                dispute.decision === 'DENY'
                  ? 'bg-red-900/20 border border-red-700'
                  : 'bg-green-900/20 border border-green-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {dispute.decision === 'DENY' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {dispute.decision === 'DENY' ? 'Dispute Denied' : 'Dispute Approved'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Resolved on {new Date(dispute.resolvedAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {dispute.resolutionSummary && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-2">
                    Resolution Summary
                  </p>
                  <p className="text-sm text-gray-200">
                    {dispute.resolutionSummary}
                  </p>
                </div>
              )}

              {dispute.decision === 'APPROVE_CHANGE' && (
                <div className="mt-3 border-t border-green-700 pt-3">
                  <p className="text-xs font-medium text-green-300 mb-2">
                    ✓ Your appraisal has been updated with the approved changes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Open Status Info */}
          {dispute.status === 'OPEN' && (
            <div className="rounded bg-yellow-900/20 border border-yellow-700 p-3">
              <p className="text-sm text-yellow-200">
                Your dispute is under review by the HR team. You will be notified
                once a decision has been made.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
