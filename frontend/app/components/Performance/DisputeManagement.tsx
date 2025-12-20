'use client';

import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import StatusBadge from './Shared/StatusBadge';

interface Dispute {
  id: string;
  _id?: string;
  employeeId: string;
  employeeName?: string;
  cycleId: string;
  cycleName?: string;
  appraisalId?: string;
  appraisalRecord?: {
    id: string;
    totalScore: number;
    overallRatingLabel: string;
    status: string;
    publishedAt?: string;
  };
  status: 'OPEN' | 'UNDER_REVIEW' | 'ADJUSTED' | 'REJECTED';
  reason: string;
  details?: string;
  resolutionSummary?: string;
  createdAt: string;
  submittedAt?: string;
  resolvedAt?: string;
}

interface DisputeManagementProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function DisputeManagement({ userRole, employeeId, onNotify }: DisputeManagementProps) {
  console.log('[DisputeManagement] Component mounted with - userRole:', userRole, 'employeeId:', employeeId);
  
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [formData, setFormData] = useState({
    appraisalRecordId: '',
    reason: '',
    details: '',
  });
  const [resolutionData, setResolutionData] = useState({
    resolution: '',
  });
  const [myAppraisals, setMyAppraisals] = useState<any[]>([]);

  // Normalize role for checking
  const normalizedRole = (userRole || '').toUpperCase().replace(/\s+/g, '_');
  const isEmployee = normalizedRole === 'DEPARTMENT_EMPLOYEE';
  const isDepartmentHead = normalizedRole === 'DEPARTMENT_HEAD';
  const isHRRole = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN'].includes(normalizedRole);
  // Any authenticated employee can create disputes
  const canCreateDispute = !!employeeId;
  
  console.log('[DisputeManagement] Role info - raw userRole:', userRole, 'normalized:', normalizedRole, 'isEmployee:', isEmployee, 'isHRRole:', isHRRole, 'canCreateDispute:', canCreateDispute);

  useEffect(() => {
    console.log('[DisputeManagement] useEffect - canCreateDispute:', canCreateDispute, 'employeeId:', employeeId);
    fetchDisputes();
    if (canCreateDispute && employeeId) {
      fetchMyAppraisals();
    }
  }, []);

  const fetchMyAppraisals = async () => {
    try {
      console.log('[fetchMyAppraisals] Fetching appraisals for employeeId:', employeeId);
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      // Use my-appraisals endpoint which uses session
      const response = await fetch(
        `${URL}/api/performance/appraisals/my-appraisals`,
        { credentials: 'include' }
      );
      
      console.log('[fetchMyAppraisals] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[fetchMyAppraisals] Raw data:', data);
        
        // Filter to only show published appraisals that can be disputed
        const publishedAppraisals = (Array.isArray(data) ? data : [])
          .filter((a: any) => a.status === 'HR_PUBLISHED');
        setMyAppraisals(publishedAppraisals);
        console.log('[fetchMyAppraisals] Published appraisals:', publishedAppraisals.length);
      } else {
        console.error('[fetchMyAppraisals] Error response:', response.status);
      }
    } catch (error) {
      console.error('Error fetching appraisals:', error);
    }
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      let url: string;

      console.log('[fetchDisputes] userRole:', userRole, 'normalizedRole:', normalizedRole, 'isHRRole:', isHRRole, 'isDepartmentHead:', isDepartmentHead);

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (isHRRole) {
        // HR can see all disputes
        url = `${URL}/api/performance/disputes`;
        console.log('[fetchDisputes] HR role - fetching all disputes');
      } else if (isDepartmentHead && employeeId) {
        // Managers see disputes from their team
        url = `${URL}/api/performance/disputes/manager/${employeeId}`;
        console.log('[fetchDisputes] Department Head - fetching team disputes');
      } else if (employeeId) {
        // Employees see their own disputes
        url = `${URL}/api/performance/disputes/employee/me`;
        console.log('[fetchDisputes] Employee - fetching own disputes');
      } else {
        setDisputes([]);
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('[fetchDisputes] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('Access denied to disputes', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch disputes');
      const data = await response.json();
      console.log('[fetchDisputes] Got disputes:', data?.length || 0);
      setDisputes(Array.isArray(data) ? data : []);
    } catch (error) {
      onNotify?.('Error loading disputes', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appraisalRecordId) {
      onNotify?.('Please select an appraisal', 'error');
      return;
    }
    if (!formData.reason.trim()) {
      onNotify?.('Please provide a reason', 'error');
      return;
    }
    try {
      console.log('[handleSubmit] Submitting dispute:', formData);
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const url = `${URL}/api/performance/disputes/employee/${employeeId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appraisalRecordId: formData.appraisalRecordId,
          reason: formData.reason,
          details: formData.details || undefined,
        }),
      });

      console.log('[handleSubmit] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('You do not have permission to create disputes', 'error');
        return;
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleSubmit] Validation error:', errorData);
        onNotify?.(errorData.message || 'Invalid request', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleSubmit] Error:', errorData);
        throw new Error(errorData.message || 'Failed to create dispute');
      }

      onNotify?.('Dispute created successfully', 'success');
      setShowForm(false);
      setFormData({ appraisalRecordId: '', reason: '', details: '' });
      fetchDisputes();
    } catch (error: any) {
      onNotify?.(error.message || 'Error creating dispute', 'error');
      console.error(error);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/api/performance/disputes/${selectedDispute.id}/resolve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          decision: 'APPROVE_CHANGE',
          resolutionSummary: resolutionData.resolution || 'After review, we agree to adjust the ratings',
          newTotalScore: 97,
          newOverallRatingLabel: 'Excellent',
          updatedRatings: {
            technical_skills: 23,
            communication: 24,
            teamwork: 22,
            reliability: 25
          }
        }),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to resolve disputes', 'error');
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to resolve dispute');
      }

      onNotify?.('Dispute resolved successfully', 'success');
      setSelectedDispute(null);
      setResolutionData({ resolution: '' });
      fetchDisputes();
    } catch (error) {
      onNotify?.('Error resolving dispute', 'error');
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ADJUSTED':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'REJECTED':
        return <Trash2 size={16} className="text-red-400" />;
      case 'UNDER_REVIEW':
        return <AlertCircle size={16} className="text-blue-400" />;
      default: // OPEN
        return <AlertCircle size={16} className="text-yellow-400" />;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading disputes...</div>;
  }

  console.log('[DisputeManagement] render - canCreateDispute:', canCreateDispute, 'employeeId:', employeeId, 'disputes:', disputes.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Dispute Management</h2>
        {/* Debug info */}
        <div className="text-xs text-gray-500">
          canCreateDispute: {String(canCreateDispute)}, employeeId: {employeeId || 'MISSING'}
        </div>
        {/* Button - always show for authenticated users */}
        {employeeId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            File Dispute
          </button>
        )}
      </div>

      {showForm && canCreateDispute && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Select Appraisal to Dispute</label>
            <p className="mt-1 text-xs text-gray-400">Choose from your published appraisals (within 7 days of publication)</p>
            {myAppraisals.length > 0 ? (
              <select
                value={formData.appraisalRecordId}
                onChange={(e) => setFormData({ ...formData, appraisalRecordId: e.target.value })}
                required
                className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an appraisal...</option>
                {myAppraisals.map((appraisal) => (
                  <option key={appraisal._id || appraisal.id} value={appraisal._id || appraisal.id}>
                    {appraisal.cycleName || 'Cycle'} - Score: {appraisal.totalScore || 'N/A'} - {appraisal.overallRatingLabel || 'Unrated'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-yellow-400">No published appraisals available to dispute.</p>
                <input
                  type="text"
                  value={formData.appraisalRecordId}
                  onChange={(e) => setFormData({ ...formData, appraisalRecordId: e.target.value })}
                  required
                  className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Appraisal Record ID manually"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Reason for Dispute</label>
            <p className="mt-1 text-xs text-gray-400">Explain your concern about the appraisal rating</p>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={3}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Briefly explain why you are disputing this appraisal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Additional Details (Optional)</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              rows={3}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide any additional context or evidence..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Submit Dispute
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-600 py-12">
            <AlertCircle className="mb-3 h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-400">
              {isHRRole || isDepartmentHead ? 'No disputes to review' : 'No disputes filed'}
            </p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id || dispute._id}
              className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/30 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dispute.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {(isHRRole || isDepartmentHead) ? `Employee: ${dispute.employeeName || dispute.employeeId}` : 'Your Dispute'}
                      </h3>
                      <p className="text-xs text-gray-400">Cycle: {dispute.cycleName || dispute.cycleId}</p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={dispute.status} />
              </div>

              {/* Appraisal Record Info */}
              {dispute.appraisalRecord && (
                <div className="rounded bg-purple-500/10 border border-purple-500/30 p-3">
                  <p className="text-xs font-medium text-purple-300">Disputed Appraisal:</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-300">
                      Score: <span className="font-semibold text-white">{dispute.appraisalRecord.totalScore || 'N/A'}</span>
                    </span>
                    <span className="text-gray-300">
                      Rating: <span className="font-semibold text-white">{dispute.appraisalRecord.overallRatingLabel || 'Unrated'}</span>
                    </span>
                    <span className="text-gray-300">
                      Status: <span className="font-semibold text-white">{dispute.appraisalRecord.status}</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded bg-gray-700/20 p-3">
                <p className="text-xs font-medium text-gray-400">Reason for Dispute:</p>
                <p className="mt-2 text-sm text-gray-300">{dispute.reason}</p>
                {dispute.details && (
                  <>
                    <p className="mt-3 text-xs font-medium text-gray-400">Additional Details:</p>
                    <p className="mt-1 text-sm text-gray-300">{dispute.details}</p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Filed: {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}</span>
                {dispute.resolvedAt && <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>}
              </div>

              {dispute.resolutionSummary && (
                <div className="rounded bg-blue-500/10 border border-blue-500/30 p-3">
                  <p className="text-xs font-medium text-blue-300">HR Resolution:</p>
                  <p className="mt-2 text-sm text-blue-100">{dispute.resolutionSummary}</p>
                </div>
              )}

              {isHRRole && (dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
                <button
                  onClick={() => {
                    setSelectedDispute(dispute);
                    setResolutionData({ resolution: '' });
                  }}
                  className="mt-2 rounded bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-600/30 self-start"
                >
                  Resolve Dispute
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {selectedDispute && (
        <form onSubmit={handleResolve} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Resolve Dispute</h3>
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              className="text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="rounded bg-gray-700/30 p-3">
            <p className="text-xs text-gray-400">Employee: {selectedDispute.employeeId}</p>
            <p className="mt-2 text-sm font-medium text-white">Dispute Reason:</p>
            <p className="mt-1 text-sm text-gray-300">{selectedDispute.reason}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Your Resolution</label>
            <p className="mt-1 text-xs text-gray-400">Document the outcome of dispute review</p>
            <textarea
              value={resolutionData.resolution}
              onChange={(e) => setResolutionData({ resolution: e.target.value })}
              required
              rows={4}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed resolution..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Submit Resolution
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
