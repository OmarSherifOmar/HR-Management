'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Play, Square, Edit, Archive } from 'lucide-react';
import { ArchiveConfirmModal } from './ArchiveConfirmModal';

interface Template {
  _id?: string;
  id?: string;
  name: string;
  templateType: string;
}

interface Cycle {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  templateId: string;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  cycleType?: string;
  startDate: string;
  endDate: string;
  managerDueDate?: string;
  employeeAcknowledgementDueDate?: string;
  createdBy: string;
  createdAt: string;
}

interface PerformanceCyclesProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function PerformanceCycles({ userRole, employeeId, onNotify }: PerformanceCyclesProps) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingCycleId, setArchivingCycleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cycleType: 'ANNUAL',
    startDate: '',
    endDate: '',
    managerDueDate: '',
    employeeAcknowledgementDueDate: '',
    selectedTemplateId: '', // Changed to single selected template
  });

  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');
  const canCreateCycle = ['HR Manager', 'HR Admin', 'HR Employee', 'System Admin'].includes(userRole || '');
  const canActivate = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  useEffect(() => {
    fetchCycles();
    fetchTemplates();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/api/performance/cycles`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access denied to cycles', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch cycles');
      const data = await response.json();
      setCycles(data);
    } catch (error) {
      onNotify?.('Error loading cycles', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/api/performance/templates`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        console.warn('Access denied to templates');
        setTemplates([]);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      
      // Map backend response to Template interface
      const mappedTemplates = (Array.isArray(data) ? data : []).map((t: any) => ({
        _id: t._id || t.id,
        id: t._id || t.id,
        name: t.name,
        templateType: t.templateType,
      }));
      
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        onNotify?.('Cycle name is required', 'error');
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        onNotify?.('Start and end dates are required', 'error');
        return;
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        onNotify?.('End date must be after start date', 'error');
        return;
      }

      // Build payload
      const payload: any = {
        name: formData.name.trim(),
        endDate: formData.endDate,
      };

      // Only include these in create, not update
      if (!editingId) {
        payload.cycleType = formData.cycleType;
        payload.startDate = formData.startDate;
      }

      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.managerDueDate) {
        payload.managerDueDate = formData.managerDueDate;
      }
      if (formData.employeeAcknowledgementDueDate) {
        payload.employeeAcknowledgementDueDate = formData.employeeAcknowledgementDueDate;
      }
      
      // Only add template assignments for new cycles
      if (!editingId && formData.selectedTemplateId?.trim()) {
        payload.templateAssignments = [{
          templateId: formData.selectedTemplateId.trim(),
          departmentIds: [],
        }];
      }

      console.log('Cycle payload being sent:', JSON.stringify(payload, null, 2));

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${URL}/api/performance/cycles/${editingId}`
        : `${URL}/api/performance/cycles`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        onNotify?.(`You do not have permission to ${editingId ? 'update' : 'create'} cycles`, 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cycle error:', { status: response.status, error: errorData });
        throw new Error(errorData.message || errorData.error || `Failed to ${editingId ? 'update' : 'create'} cycle (${response.status})`);
      }

      const result = await response.json();
      console.log(`Cycle ${editingId ? 'updated' : 'created'} successfully:`, result);

      onNotify?.(`Cycle ${editingId ? 'updated' : 'created'} successfully`, 'success');
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        cycleType: 'ANNUAL',
        startDate: '',
        endDate: '',
        managerDueDate: '',
        employeeAcknowledgementDueDate: '',
        selectedTemplateId: '',
      });
      fetchCycles();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Error ${editingId ? 'updating' : 'creating'} cycle`;
      onNotify?.(message, 'error');
      console.error('Full error:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/api/performance/cycles/${id}/activate`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to activate cycles', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to activate cycle');

      onNotify?.('Cycle activated successfully', 'success');
      fetchCycles();
    } catch (error) {
      onNotify?.('Error activating cycle', 'error');
      console.error(error);
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Close this cycle? This cannot be undone.')) return;

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/api/performance/cycles/${id}/close`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to close cycles', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to close cycle');

      onNotify?.('Cycle closed successfully', 'success');
      fetchCycles();
    } catch (error) {
      onNotify?.('Error closing cycle', 'error');
      console.error(error);
    }
  };

  const handleArchiveCycle = (cycleId: string) => {
    setArchivingCycleId(cycleId);
    setShowArchiveModal(true);
  };

  const confirmArchiveCycle = async () => {
    if (!archivingCycleId) return;

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/api/performance/assignments/cycles/${archivingCycleId}/archive-all`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to archive cycle');
      }

      const data = await response.json();
      onNotify?.(
        `Cycle archived successfully! Archived ${data.archivedAssignments} assignments and ${data.archivedRecords} records.`,
        'success'
      );
      setShowArchiveModal(false);
      setArchivingCycleId(null);
      fetchCycles();
    } catch (error: any) {
      onNotify?.(error.message || 'Error archiving cycle', 'error');
      console.error('[PerformanceCycles] Error archiving cycle:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
      case 'PLANNED':
        return 'bg-gray-500/20 text-gray-300';
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-300';
      case 'CLOSED':
        return 'bg-red-500/20 text-red-300';
      case 'ARCHIVED':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading cycles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Appraisal Cycles</h2>
        {canCreateCycle && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                name: '',
                description: '',
                cycleType: 'ANNUAL',
                startDate: '',
                endDate: '',
                managerDueDate: '',
                employeeAcknowledgementDueDate: '',
                selectedTemplateId: '',
              });
            }}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Cycle
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && canCreateCycle && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Cycle Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q1 2025 Performance Review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the cycle purpose..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Cycle Type</label>
            <select
              value={formData.cycleType}
              onChange={(e) => setFormData({ ...formData, cycleType: e.target.value })}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ANNUAL">Annual</option>
              <option value="SEMI_ANNUAL">Semi-Annual</option>
              <option value="PROBATIONARY">Probationary</option>
              <option value="PROJECT">Project</option>
              <option value="AD_HOC">Ad-Hoc</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Manager Due Date</label>
              <input
                type="date"
                value={formData.managerDueDate}
                onChange={(e) => setFormData({ ...formData, managerDueDate: e.target.value })}
                className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Employee Acknowledgement Due Date</label>
              <input
                type="date"
                value={formData.employeeAcknowledgementDueDate}
                onChange={(e) => setFormData({ ...formData, employeeAcknowledgementDueDate: e.target.value })}
                className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Appraisal Template (Optional)</label>
            <select
              value={formData.selectedTemplateId}
              onChange={(e) => setFormData({ ...formData, selectedTemplateId: e.target.value })}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingTemplates}
            >
              <option value="">-- Select a template --</option>
              {loadingTemplates ? (
                <option disabled>Loading templates...</option>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <option key={template._id || template.id} value={template._id || template.id || ''}>
                    {template.name}
                  </option>
                ))
              ) : (
                <option disabled>No templates available</option>
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500">Templates will be assigned to this cycle for performance evaluation</p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {editingId ? 'Update Cycle' : 'Create Cycle'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Cycles List */}
      <div className="space-y-3">
        {cycles.length === 0 ? (
          <p className="text-center text-gray-500">No cycles available</p>
        ) : (
          cycles.map((cycle) => (
            <div
              key={cycle.id || cycle._id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{cycle.name}</h3>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(cycle.status)}`}>
                    {cycle.status}
                  </span>
                </div>
                {cycle.description && (
                  <p className="mt-1 text-sm text-gray-400">{cycle.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(cycle.startDate).toLocaleDateString()} to {new Date(cycle.endDate).toLocaleDateString()}
                </p>
                {cycle.cycleType && (
                  <p className="text-xs text-gray-500">Type: {cycle.cycleType}</p>
                )}
              </div>

              {canActivate && (
                <div className="ml-4 flex gap-2">
                  {cycle.status === 'PLANNED' && (
                    <>
                      <button
                        onClick={() => {
                          const cycleId = cycle.id || cycle._id || '';
                          setEditingId(cycleId);
                          setFormData({
                            name: cycle.name || '',
                            description: cycle.description || '',
                            cycleType: cycle.cycleType || 'ANNUAL',
                            startDate: cycle.startDate?.split('T')[0] || '',
                            endDate: cycle.endDate?.split('T')[0] || '',
                            managerDueDate: cycle.managerDueDate?.split('T')[0] || '',
                            employeeAcknowledgementDueDate: cycle.employeeAcknowledgementDueDate?.split('T')[0] || '',
                            selectedTemplateId: cycle.templateId || '',
                          });
                          setShowForm(true);
                        }}
                        className="flex items-center gap-1 rounded bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-600/30"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleActivate(cycle.id || cycle._id || '')}
                        className="flex items-center gap-1 rounded bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-600/30"
                      >
                        <Play size={14} />
                        Activate
                      </button>
                    </>
                  )}
                  {cycle.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleClose(cycle.id || cycle._id || '')}
                      className="flex items-center gap-1 rounded bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-600/30"
                    >
                      <Square size={14} />
                      Close
                    </button>
                  )}
                  {(cycle.status === 'CLOSED' || cycle.status === 'PLANNED') && (
                    <button
                      onClick={() => handleArchiveCycle(cycle.id || cycle._id || '')}
                      className="flex items-center gap-1 rounded bg-orange-600/20 px-3 py-2 text-xs font-medium text-orange-400 hover:bg-orange-600/30"
                    >
                      <Archive size={14} />
                      Archive All
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Archive Confirm Modal */}
      <ArchiveConfirmModal
        isOpen={showArchiveModal && !!archivingCycleId}
        title="Archive Entire Cycle"
        message={`Are you sure you want to archive this cycle and ALL its assignments and appraisal records? This action will archive everything related to this cycle and cannot be undone.`}
        isLoading={false}
        onConfirm={confirmArchiveCycle}
        onCancel={() => {
          setShowArchiveModal(false);
          setArchivingCycleId(null);
        }}
      />
    </div>
  );
}
