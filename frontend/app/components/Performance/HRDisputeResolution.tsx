import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';

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

interface HRDisputeResolutionProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function HRDisputeResolution({
  onNotify,
}: HRDisputeResolutionProps) {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionData, setResolutionData] = useState<{
    [key: string]: {
      decision: 'DENY' | 'APPROVE_CHANGE' | '';
      resolutionSummary: string;
      newTotalScore?: number;
      newOverallRatingLabel?: string;
    };
  }>({});

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:3000/api/performance/disputes/manager/me',
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
      console.error('[HRDisputeResolution] Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string) => {
    const data = resolutionData[disputeId];
    if (!data || !data.decision || !data.resolutionSummary.trim()) {
      onNotify?.(
        'Please select a decision and provide a resolution summary',
        'error'
      );
      return;
    }

    try {
      setResolvingId(disputeId);
      const response = await fetch(
        `http://localhost:3000/api/performance/disputes/${disputeId}/resolve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            decision: data.decision,
            resolutionSummary: data.resolutionSummary,
            newTotalScore: data.newTotalScore,
            newOverallRatingLabel: data.newOverallRatingLabel,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to resolve dispute');
      }

      onNotify?.(
        `Dispute resolved: ${data.decision === 'DENY' ? 'Denied' : 'Approved'}`,
        'success'
      );
      setExpandedId(null);
      setResolutionData({});
      fetchDisputes();
    } catch (error: any) {
      onNotify?.(error.message || 'Error resolving dispute', 'error');
      console.error('[HRDisputeResolution] Error resolving dispute:', error);
    } finally {
      setResolvingId(null);
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

  const openDisputes = disputes.filter((d) => d.status === 'OPEN');
  const resolvedDisputes = disputes.filter((d) => d.status !== 'OPEN');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading disputes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open Disputes Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Open Disputes ({openDisputes.length})
        </h3>

        {openDisputes.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-8 text-center">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-3" />
            <p className="text-gray-400">All disputes resolved!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openDisputes.map((dispute) => (
              <div
                key={dispute._id}
                className="rounded-lg border border-gray-700 bg-gray-800/30"
              >
                {/* Dispute Header - Clickable */}
                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === dispute._id ? null : dispute._id
                    )
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h4 className="font-semibold text-white">
                        {dispute.employeeName} - {dispute.cycleName}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Filed: {new Date(dispute.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {expandedId === dispute._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedId === dispute._id && (
                  <div className="border-t border-gray-700 p-4 space-y-4">
                    {/* Reason and Details */}
                    <div className="space-y-3 rounded bg-gray-900/40 p-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Reason
                        </p>
                        <p className="text-sm text-gray-200 mt-1">
                          {dispute.reason}
                        </p>
                      </div>

                      {dispute.details && (
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Details
                          </p>
                          <p className="text-sm text-gray-200 mt-1">
                            {dispute.details}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Appraisal Info */}
                    {dispute.appraisalRecord && (
                      <div className="rounded bg-blue-900/20 border border-blue-700 p-3">
                        <p className="text-sm font-medium text-blue-300 mb-2">
                          Original Appraisal
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200">
                            {dispute.appraisalRecord.totalScore}% -{' '}
                            {dispute.appraisalRecord.overallRatingLabel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolution Form */}
                    <div className="space-y-3 pt-3 border-t border-gray-700">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Decision *
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              setResolutionData({
                                ...resolutionData,
                                [dispute._id]: {
                                  ...resolutionData[dispute._id],
                                  decision: 'DENY',
                                },
                              })
                            }
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                              resolutionData[dispute._id]?.decision === 'DENY'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Deny Dispute
                          </button>
                          <button
                            onClick={() =>
                              setResolutionData({
                                ...resolutionData,
                                [dispute._id]: {
                                  ...resolutionData[dispute._id],
                                  decision: 'APPROVE_CHANGE',
                                },
                              })
                            }
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                              resolutionData[dispute._id]?.decision ===
                              'APPROVE_CHANGE'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Approve & Adjust
                          </button>
                        </div>
                      </div>

                      {resolutionData[dispute._id]?.decision ===
                        'APPROVE_CHANGE' && (
                        <div className="space-y-3 rounded bg-green-900/20 border border-green-700 p-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              New Total Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                resolutionData[dispute._id]
                                  ?.newTotalScore || ''
                              }
                              onChange={(e) =>
                                setResolutionData({
                                  ...resolutionData,
                                  [dispute._id]: {
                                    ...resolutionData[dispute._id],
                                    newTotalScore: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  },
                                })
                              }
                              placeholder={
                                dispute.appraisalRecord?.totalScore.toString()
                              }
                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              New Overall Rating Label
                            </label>
                            <input
                              type="text"
                              value={
                                resolutionData[dispute._id]
                                  ?.newOverallRatingLabel || ''
                              }
                              onChange={(e) =>
                                setResolutionData({
                                  ...resolutionData,
                                  [dispute._id]: {
                                    ...resolutionData[dispute._id],
                                    newOverallRatingLabel: e.target.value,
                                  },
                                })
                              }
                              placeholder={
                                dispute.appraisalRecord
                                  ?.overallRatingLabel
                              }
                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Resolution Summary *
                        </label>
                        <textarea
                          value={
                            resolutionData[dispute._id]?.resolutionSummary || ''
                          }
                          onChange={(e) =>
                            setResolutionData({
                              ...resolutionData,
                              [dispute._id]: {
                                ...resolutionData[dispute._id],
                                resolutionSummary: e.target.value,
                              },
                            })
                          }
                          placeholder="Explain the decision and rationale..."
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                          rows={3}
                        />
                      </div>

                      <button
                        onClick={() => handleResolve(dispute._id)}
                        disabled={resolvingId === dispute._id}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 cursor-disabled flex items-center justify-center gap-2 font-medium"
                      >
                        {resolvingId === dispute._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Resolving...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Resolution
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Disputes Section */}
      {resolvedDisputes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Resolved Disputes ({resolvedDisputes.length})
          </h3>

          <div className="space-y-3">
            {resolvedDisputes.map((dispute) => (
              <div
                key={dispute._id}
                className={`rounded-lg border p-4 ${
                  dispute.decision === 'DENY'
                    ? 'border-red-700 bg-red-900/20'
                    : 'border-green-700 bg-green-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {dispute.decision === 'DENY' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <div>
                      <h4 className="font-semibold text-white">
                        {dispute.employeeName} - {dispute.cycleName}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {dispute.decision === 'DENY'
                          ? 'Dispute Denied'
                          : 'Dispute Approved'}
                        {' • '}
                        {new Date(dispute.resolvedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-200">
                  <p className="font-medium mb-1">Reason:</p>
                  <p className="text-gray-300 mb-3">{dispute.reason}</p>

                  {dispute.resolutionSummary && (
                    <>
                      <p className="font-medium mb-1">Resolution:</p>
                      <p className="text-gray-300">{dispute.resolutionSummary}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
