'use client';

import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, AlertCircle, Send, FileText } from 'lucide-react';
import StatusBadge from './Shared/StatusBadge';

interface Appraisal {
  id: string;
  recordId: string;
  employeeId: string;
  managerId: string;
  cycleId: string;
  status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED';
  ratings: Record<string, number>;
  comments: string;
  developmentNotes?: string;
  acknowledgedAt?: string;
  publishedAt?: string;
}

interface AppraisalFormProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

const RATING_CRITERIA = [
  'Technical Skills',
  'Communication',
  'Leadership',
  'Reliability',
  'Team Collaboration',
  'Productivity',
  'Initiative',
  'Adaptability',
];

const RATING_SCALE = [
  { value: 1, label: 'Below Average', color: 'text-red-400' },
  { value: 2, label: 'Needs Improvement', color: 'text-yellow-400' },
  { value: 3, label: 'Meets Expectations', color: 'text-blue-400' },
  { value: 4, label: 'Exceeds Expectations', color: 'text-green-400' },
  { value: 5, label: 'Outstanding', color: 'text-purple-400' },
];

export default function AppraisalForm({ userRole, employeeId, onNotify }: AppraisalFormProps) {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ratings: {} as Record<string, number>,
    comments: '',
    developmentNotes: '',
  });
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'view'>('list');

  const isManager = userRole === 'department head';
  const isEmployee = userRole === 'department employee';
  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/performance/appraisals/my-appraisals', {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access denied to appraisals', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch appraisals');
      const data = await response.json();
      setAppraisals(Array.isArray(data) ? data : []);
    } catch (error) {
      onNotify?.('Error loading appraisals', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppraisal) return;

    try {
      const url = `http://localhost:3000/api/performance/appraisals/${selectedAppraisal.recordId}/employee/me/submit`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to submit appraisals', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to submit appraisal');

      onNotify?.('Appraisal submitted successfully', 'success');
      setViewMode('list');
      setSelectedAppraisal(null);
      setFormData({ ratings: {}, comments: '', developmentNotes: '' });
      fetchAppraisals();
    } catch (error) {
      onNotify?.('Error submitting appraisal', 'error');
      console.error(error);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/performance/appraisals/${id}/employee/me/acknowledge`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to acknowledge appraisals', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to acknowledge appraisal');

      onNotify?.('Appraisal acknowledged successfully', 'success');
      setViewMode('list');
      fetchAppraisals();
    } catch (error) {
      onNotify?.('Error acknowledging appraisal', 'error');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading appraisals...</div>;
  }

  const handleCloseForm = () => {
    setViewMode('list');
    setSelectedAppraisal(null);
    setFormData({ ratings: {}, comments: '', developmentNotes: '' });
  };

  const averageRating = selectedAppraisal && Object.keys(selectedAppraisal.ratings).length > 0
    ? Math.round((Object.values(selectedAppraisal.ratings).reduce((a: number, b: number) => a + b, 0) / Object.keys(selectedAppraisal.ratings).length) * 10) / 10
    : 0;

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">My Appraisals</h2>

        <div className="space-y-3">
          {appraisals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-600 py-12">
              <FileText className="mb-3 h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">No appraisals assigned to you</p>
            </div>
          ) : (
            appraisals.map((appraisal) => (
              <div
                key={appraisal.id}
                className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/30 p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {isManager ? `Employee: ${appraisal.employeeId}` : `Manager: ${appraisal.managerId}`}
                      </h3>
                      <StatusBadge status={appraisal.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Cycle: {appraisal.cycleId}</p>
                  </div>
                </div>

                {appraisal.comments && (
                  <div className="rounded bg-gray-700/30 p-3">
                    <p className="text-xs font-medium text-gray-300">Feedback:</p>
                    <p className="mt-1 text-xs text-gray-400">{appraisal.comments}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedAppraisal(appraisal);
                      setViewMode('view');
                    }}
                    className="flex items-center gap-1 rounded bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-600/30"
                  >
                    <Eye size={14} />
                    View Details
                  </button>

                  {isManager && appraisal.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedAppraisal(appraisal);
                        setFormData({
                          ratings: {},
                          comments: '',
                          developmentNotes: '',
                        });
                        setViewMode('form');
                      }}
                      className="flex items-center gap-1 rounded bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-600/30"
                    >
                      <Send size={14} />
                      Complete Rating
                    </button>
                  )}

                  {isEmployee && appraisal.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleAcknowledge(appraisal.id)}
                      className="flex items-center gap-1 rounded bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-600/30"
                    >
                      <CheckCircle size={14} />
                      Acknowledge Receipt
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && selectedAppraisal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Appraisal Details</h2>
          <button
            onClick={handleCloseForm}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded bg-gray-700/20 p-3">
              <p className="text-xs text-gray-400">Employee</p>
              <p className="mt-1 text-sm font-semibold text-white">{selectedAppraisal.employeeId}</p>
            </div>
            <div className="rounded bg-gray-700/20 p-3">
              <p className="text-xs text-gray-400">Manager</p>
              <p className="mt-1 text-sm font-semibold text-white">{selectedAppraisal.managerId}</p>
            </div>
            <div className="rounded bg-gray-700/20 p-3">
              <p className="text-xs text-gray-400">Status</p>
              <div className="mt-1">
                <StatusBadge status={selectedAppraisal.status} />
              </div>
            </div>
            <div className="rounded bg-gray-700/20 p-3">
              <p className="text-xs text-gray-400">Average Rating</p>
              <p className="mt-1 text-sm font-semibold text-blue-400">{averageRating} / 5</p>
            </div>
          </div>

          {Object.keys(selectedAppraisal.ratings).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Ratings by Criteria</h3>
              {Object.entries(selectedAppraisal.ratings).map(([criterion, rating]) => {
                const ratingInfo = RATING_SCALE.find((r) => r.value === rating);
                return (
                  <div key={criterion} className="flex items-center justify-between rounded bg-gray-700/20 p-3">
                    <span className="text-sm text-gray-300">{criterion}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-600 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-green-500"
                          style={{ width: `${(rating / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${ratingInfo?.color}`}>{rating}/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedAppraisal.comments && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Manager Comments</h3>
              <div className="rounded bg-gray-700/20 p-3">
                <p className="text-sm text-gray-300">{selectedAppraisal.comments}</p>
              </div>
            </div>
          )}

          {selectedAppraisal.developmentNotes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Development Notes</h3>
              <div className="rounded bg-yellow-500/10 border border-yellow-500/30 p-3">
                <p className="text-sm text-yellow-300">{selectedAppraisal.developmentNotes}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleCloseForm}
            className="w-full rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'form' && selectedAppraisal && isManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Submit Appraisal for {selectedAppraisal.employeeId}
          </h2>
          <button
            onClick={handleCloseForm}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/30 p-6">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Performance Ratings</h3>
            <div className="space-y-4">
              {RATING_CRITERIA.map((criterion) => (
                <div key={criterion} className="rounded bg-gray-700/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">{criterion}</label>
                    <span className="text-xs text-gray-400">
                      {formData.ratings[criterion] ? `${formData.ratings[criterion]}/5` : 'Not rated'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {RATING_SCALE.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            ratings: { ...formData.ratings, [criterion]: option.value },
                          })
                        }
                        className={`h-8 w-8 rounded border-2 text-xs font-bold transition-all ${
                          formData.ratings[criterion] === option.value
                            ? `border-${option.color.split('-')[1]}-500 bg-${option.color.split('-')[1]}-500/20 text-${option.color.split('-')[1]}-400`
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                        title={option.label}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {formData.ratings[criterion] ? RATING_SCALE.find((r) => r.value === formData.ratings[criterion])?.label : 'Select a rating'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Manager Comments</label>
            <p className="mt-1 text-xs text-gray-400">Provide examples and detailed feedback</p>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              required
              rows={4}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide contextual feedback with specific examples..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Development Recommendations</label>
            <p className="mt-1 text-xs text-gray-400">Suggest areas for growth and development</p>
            <textarea
              value={formData.developmentNotes}
              onChange={(e) => setFormData({ ...formData, developmentNotes: e.target.value })}
              rows={3}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Suggest next steps and development areas..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCloseForm}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 flex items-center gap-2"
            >
              <Send size={16} />
              Submit Appraisal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;

}