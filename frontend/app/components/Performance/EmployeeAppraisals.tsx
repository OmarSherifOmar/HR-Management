import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileText, MessageSquare, Send, AlertTriangle, Archive } from 'lucide-react';
import { ArchiveConfirmModal } from './ArchiveConfirmModal';

interface Appraisal {
  _id: string;
  cycleId: string;
  templateId: string;
  assignmentId: string;
  employeeProfileId: string;
  managerProfileId: string;
  ratings: Array<{
    key: string;
    title: string;
    ratingValue: number;
    ratingLabel?: string;
    comments?: string;
  }>;
  totalScore?: number;
  overallRatingLabel?: string;
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
  status: string;
  managerSubmittedAt?: string;
  hrPublishedAt?: string;
  employeeViewedAt?: string;
  employeeAcknowledgedAt?: string;
  employeeAcknowledgementComment?: string;
  cycleName?: string;
  cycleStartDate?: string;
  cycleEndDate?: string;
}

interface EmployeeAppraisalsProps {
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function EmployeeAppraisals({ employeeId, onNotify }: EmployeeAppraisalsProps) {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [comment, setComment] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeData, setDisputeData] = useState({
    reason: '',
    details: '',
  });
  const [filingDispute, setFilingDispute] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingRecordId, setArchivingRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/performance/assignments/my-appraisals', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch appraisals');
      }

      const data = await response.json();
      setAppraisals(data || []);
      console.log('[EmployeeAppraisals] Fetched appraisals:', data);
    } catch (error: any) {
      console.error('[EmployeeAppraisals] Error:', error);
      onNotify?.(error.message || 'Error fetching appraisals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeClick = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setComment(appraisal.employeeAcknowledgementComment || '');
    setShowAcknowledgeModal(true);
  };

  const handleSubmitAcknowledgement = async () => {
    if (!selectedAppraisal) return;

    try {
      setAcknowledging(true);
      const response = await fetch('http://localhost:3000/api/performance/assignments/acknowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recordId: selectedAppraisal._id,
          comment: comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to acknowledge appraisal');
      }

      const result = await response.json();
      onNotify?.('Appraisal acknowledged successfully!', 'success');
      setShowAcknowledgeModal(false);
      setComment('');
      fetchAppraisals();
    } catch (error: any) {
      onNotify?.(error.message || 'Error acknowledging appraisal', 'error');
      console.error('[EmployeeAppraisals] Error acknowledging:', error);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleFileDispute = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setDisputeData({ reason: '', details: '' });
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!selectedAppraisal) return;
    if (!disputeData.reason.trim()) {
      onNotify?.('Please provide a reason for the dispute', 'error');
      return;
    }

    try {
      setFilingDispute(true);
      const response = await fetch('http://localhost:3000/api/performance/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appraisalRecordId: selectedAppraisal._id,
          reason: disputeData.reason,
          details: disputeData.details,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to file dispute');
      }

      const result = await response.json();
      onNotify?.('Dispute filed successfully! Your case has been submitted for review.', 'success');
      setShowDisputeModal(false);
      setDisputeData({ reason: '', details: '' });
      fetchAppraisals();
    } catch (error: any) {
      onNotify?.(error.message || 'Error filing dispute', 'error');
      console.error('[EmployeeAppraisals] Error filing dispute:', error);
    } finally {
      setFilingDispute(false);
    }
  };

  const handleArchiveRecord = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setArchivingRecordId(appraisal._id);
    setShowArchiveModal(true);
  };

  const confirmArchiveRecord = async () => {
    if (!archivingRecordId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/performance/assignments/records/${archivingRecordId}/archive`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to archive record');
      }

      onNotify?.('Appraisal record archived successfully', 'success');
      setShowArchiveModal(false);
      setArchivingRecordId(null);
      fetchAppraisals();
    } catch (error: any) {
      onNotify?.(error.message || 'Error archiving record', 'error');
      console.error('[EmployeeAppraisals] Error archiving record:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-300';
      case 'MANAGER_SUBMITTED':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'HR_PUBLISHED':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HR_PUBLISHED':
        return <CheckCircle size={16} className="text-blue-400" />;
      case 'MANAGER_SUBMITTED':
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading appraisals...</div>;
  }

  if (appraisals.length === 0) {
    return <div className="text-center text-gray-400">No appraisals found</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Appraisals</h2>

      <div className="space-y-4">
        {appraisals.map((appraisal) => (
          <div key={appraisal._id} className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(appraisal.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {appraisal.cycleName || 'Appraisal'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {appraisal.cycleStartDate && appraisal.cycleEndDate && (
                        <>
                          {new Date(appraisal.cycleStartDate).toLocaleDateString()} -{' '}
                          {new Date(appraisal.cycleEndDate).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-3 flex items-center gap-3">
                  <span className={`rounded px-3 py-1 text-xs font-medium ${getStatusColor(appraisal.status)}`}>
                    {appraisal.status}
                  </span>
                  {appraisal.totalScore !== undefined && (
                    <span className="rounded bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-300">
                      Score: {appraisal.totalScore}% - {appraisal.overallRatingLabel}
                    </span>
                  )}
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  {appraisal.managerSummary && (
                    <div>
                      <p className="font-medium text-gray-400">Manager Summary</p>
                      <p>{appraisal.managerSummary}</p>
                    </div>
                  )}
                  {appraisal.strengths && (
                    <div>
                      <p className="font-medium text-gray-400">Strengths</p>
                      <p>{appraisal.strengths}</p>
                    </div>
                  )}
                  {appraisal.improvementAreas && (
                    <div>
                      <p className="font-medium text-gray-400">Areas for Improvement</p>
                      <p>{appraisal.improvementAreas}</p>
                    </div>
                  )}
                </div>

                {/* Ratings */}
                {appraisal.ratings && appraisal.ratings.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-300 mb-2">Ratings</p>
                    <div className="space-y-2">
                      {appraisal.ratings.map((rating) => (
                        <div key={rating.key} className="flex items-center justify-between rounded bg-gray-900/30 p-2 text-sm">
                          <span className="text-gray-300">{rating.title}</span>
                          <span className="font-medium text-blue-300">
                            {rating.ratingValue} {rating.ratingLabel && `(${rating.ratingLabel})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acknowledgement Status */}
                {appraisal.status === 'HR_PUBLISHED' && (
                  <div className="mt-4 rounded bg-blue-900/20 border border-blue-700 p-3">
                    {appraisal.employeeAcknowledgedAt ? (
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-green-300 mb-2">
                          <CheckCircle size={14} />
                          Acknowledged on {new Date(appraisal.employeeAcknowledgedAt).toLocaleDateString()}
                        </p>
                        {appraisal.employeeAcknowledgementComment && (
                          <div className="mt-2 rounded bg-gray-800/50 p-2">
                            <p className="text-xs font-medium text-gray-400">Your Comment:</p>
                            <p className="text-sm text-gray-300">{appraisal.employeeAcknowledgementComment}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleFileDispute(appraisal)}
                          className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 w-full justify-center mt-3"
                        >
                          <AlertTriangle size={16} />
                          File a Dispute
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => handleAcknowledgeClick(appraisal)}
                          className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 w-full justify-center"
                        >
                          <Send size={16} />
                          Acknowledge Appraisal
                        </button>
                        <button
                          onClick={() => handleFileDispute(appraisal)}
                          className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 w-full justify-center"
                        >
                          <AlertTriangle size={16} />
                          File a Dispute
                        </button>
                        <button
                          onClick={() => handleArchiveRecord(appraisal)}
                          className="flex items-center gap-2 rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 w-full justify-center"
                        >
                          <Archive size={16} />
                          Archive Record
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Published Date */}
                {appraisal.hrPublishedAt && (
                  <p className="mt-3 text-xs text-gray-500">
                    Published: {new Date(appraisal.hrPublishedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && selectedAppraisal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Acknowledge Appraisal</h3>

            <div className="mb-4 rounded bg-gray-700/30 p-3">
              <p className="text-sm text-gray-300">
                <strong>Cycle:</strong> {selectedAppraisal.cycleName}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                <strong>Score:</strong> {selectedAppraisal.totalScore}% -{' '}
                {selectedAppraisal.overallRatingLabel}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageSquare size={14} className="inline mr-2" />
                Your Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments about this appraisal..."
                className="w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAcknowledgeModal(false)}
                className="flex-1 rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAcknowledgement}
                disabled={acknowledging}
                className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedAppraisal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">File a Dispute</h3>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Appraisal
                </label>
                <p className="text-sm text-gray-400">
                  Cycle: {selectedAppraisal.cycleName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Dispute *
                </label>
                <textarea
                  value={disputeData.reason}
                  onChange={(e) =>
                    setDisputeData({ ...disputeData, reason: e.target.value })
                  }
                  placeholder="Explain why you are disputing this appraisal..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={disputeData.details}
                  onChange={(e) =>
                    setDisputeData({ ...disputeData, details: e.target.value })
                  }
                  placeholder="Provide any additional information to support your dispute..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  disabled={filingDispute}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition disabled:opacity-50 cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={filingDispute}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {filingDispute ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Filing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Submit Dispute
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirm Modal */}
      <ArchiveConfirmModal
        isOpen={showArchiveModal && !!archivingRecordId}
        title="Archive Appraisal Record"
        message={`Are you sure you want to archive this appraisal? This action will permanently archive the record and cannot be undone.`}
        isLoading={!!archivingRecordId}
        onConfirm={confirmArchiveRecord}
        onCancel={() => {
          setShowArchiveModal(false);
          setArchivingRecordId(null);
        }}
      />
    </div>
  );
}
