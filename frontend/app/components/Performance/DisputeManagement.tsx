'use client';

import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import StatusBadge from './Shared/StatusBadge';

interface Dispute {
  id: string;
  employeeId: string;
  cycleId: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  reason: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface DisputeManagementProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function DisputeManagement({ userRole, employeeId, onNotify }: DisputeManagementProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [formData, setFormData] = useState({
    cycleId: '',
    reason: '',
  });
  const [resolutionData, setResolutionData] = useState({
    resolution: '',
  });

  const isEmployee = userRole === 'department employee';
  const isHRManager = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');
  const canCreateDispute = ['department employee', 'HR Manager', 'HR Admin', 'HR Employee', 'System Admin'].includes(
    userRole || ''
  );

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3000/api/performance/disputes';

      // Employees can view their own disputes
      if (isEmployee) {
        url = 'http://localhost:3000/api/performance/disputes/employee/me';
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access denied to disputes', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch disputes');
      const data = await response.json();
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
    try {
      const url = 'http://localhost:3000/api/performance/disputes/employee/me';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to create disputes', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to create dispute');

      onNotify?.('Dispute created successfully', 'success');
      setShowForm(false);
      setFormData({ cycleId: '', reason: '' });
      fetchDisputes();
    } catch (error) {
      onNotify?.('Error creating dispute', 'error');
      console.error(error);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      const response = await fetch(`http://localhost:3000/api/performance/disputes/${selectedDispute.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(resolutionData),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to resolve disputes', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to resolve dispute');

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
      case 'RESOLVED':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'REJECTED':
        return <Trash2 size={16} className="text-red-400" />;
      default:
        return <AlertCircle size={16} className="text-yellow-400" />;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading disputes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Dispute Management</h2>
        {isEmployee && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            File Dispute
          </button>
        )}
      </div>

      {showForm && isEmployee && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Cycle ID</label>
            <input
              type="text"
              value={formData.cycleId}
              onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
              required
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Appraisal cycle ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Reason for Dispute (Within 7 Days)</label>
            <p className="mt-1 text-xs text-gray-400">Explain your concern about the appraisal rating</p>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={4}
              className="mt-2 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed reasoning for your dispute..."
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
            <p className="text-sm text-gray-400">{isHRManager ? 'No disputes to resolve' : 'No disputes filed'}</p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/30 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dispute.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {isHRManager ? `Employee: ${dispute.employeeId}` : 'Your Dispute'}
                      </h3>
                      <p className="text-xs text-gray-400">Cycle: {dispute.cycleId}</p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={dispute.status} />
              </div>

              <div className="rounded bg-gray-700/20 p-3">
                <p className="text-xs font-medium text-gray-400">Reason for Dispute:</p>
                <p className="mt-2 text-sm text-gray-300">{dispute.reason}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                {dispute.resolvedAt && <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>}
              </div>

              {dispute.resolution && (
                <div className="rounded bg-blue-500/10 border border-blue-500/30 p-3">
                  <p className="text-xs font-medium text-blue-300">HR Resolution:</p>
                  <p className="mt-2 text-sm text-blue-100">{dispute.resolution}</p>
                </div>
              )}

              {isHRManager && dispute.status === 'PENDING' && (
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
