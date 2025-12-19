'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Lock } from 'lucide-react';

interface Criterion {
  key: string;
  title: string;
  details?: string;
  weight?: number;
  maxScore?: number;
  required: boolean;
}

interface RatingScale {
  type: 'THREE_POINT' | 'FIVE_POINT' | 'TEN_POINT';
  min: number;
  max: number;
  step?: number;
  labels?: string[];
}

interface Template {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  templateType: 'ANNUAL' | 'SEMI_ANNUAL' | 'PROBATIONARY' | 'PROJECT' | 'AD_HOC';
  ratingScale: RatingScale;
  criteria: Criterion[];
  instructions?: string;
  applicableDepartmentIds?: string[];
  applicablePositionIds?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Department {
  _id: string;
  name: string;
  code?: string;
}

interface Position {
  _id: string;
  name: string;
  code: string;
  departmentId: string;
}

interface PerformanceTemplatesProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function PerformanceTemplates({ userRole, employeeId, onNotify }: PerformanceTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  // Criteria as array of objects
  const [criteriaList, setCriteriaList] = useState<Criterion[]>([
    { key: '', title: '', weight: 0, required: true }
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateType: 'ANNUAL' as 'ANNUAL' | 'SEMI_ANNUAL' | 'PROBATIONARY' | 'PROJECT' | 'AD_HOC',
    ratingScale: {
      type: 'FIVE_POINT' as 'THREE_POINT' | 'FIVE_POINT' | 'TEN_POINT',
      min: 1,
      max: 5,
      labels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
    },
    instructions: '',
    applicableDepartmentIds: [] as string[],
    applicablePositionIds: [] as string[],
  });

  // Criteria helper functions
  const addCriterion = () => {
    setCriteriaList([...criteriaList, { key: '', title: '', weight: 0, required: true }]);
  };

  const removeCriterion = (index: number) => {
    if (criteriaList.length > 1) {
      setCriteriaList(criteriaList.filter((_, i) => i !== index));
    }
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
    const updated = [...criteriaList];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-generate key from title if key is empty
    if (field === 'title' && !updated[index].key) {
      updated[index].key = value.toLowerCase().replace(/\s+/g, '_');
    }
    setCriteriaList(updated);
  };

  const isHRManager = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/org/departments', {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to view departments. Please contact your administrator.', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    }
  };

  const fetchPositionsByDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setPositions([]);
      return;
    }

    try {
      const url = `http://localhost:3000/api/org/positions?departmentId=${departmentId}`;
      console.log('Fetching positions from:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to view positions. Please contact your administrator.', 'error');
        setPositions([]);
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Position fetch error:', response.status, errorData);
        setPositions([]);
        return;
      }

      const data = await response.json();
      console.log('Positions fetched:', data);
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositions([]);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/performance/templates', {
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to view performance templates. Please contact your administrator.', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      
      // Map backend response to frontend interface
      const mappedTemplates = (Array.isArray(data) ? data : []).map((t: any) => ({
        _id: t._id || t.id,
        id: t._id || t.id, // Support both _id and id
        name: t.name,
        description: t.description || '',
        templateType: t.templateType,
        ratingScale: t.ratingScale,
        criteria: Array.isArray(t.criteria) ? t.criteria : [],
        instructions: t.instructions || '',
        isActive: t.isActive !== false,
        createdBy: t.createdBy || 'System',
        createdAt: t.createdAt || new Date().toISOString(),
      }));
      
      setTemplates(mappedTemplates);
    } catch (error) {
      onNotify?.('Error loading templates', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        onNotify?.('Template name is required', 'error');
        return;
      }
      
      // Filter out empty criteria and validate
      const validCriteria = criteriaList.filter(c => c.title.trim() && c.key.trim());
      if (validCriteria.length === 0) {
        onNotify?.('At least one criterion with key and title is required', 'error');
        return;
      }

      // Build criteria array with proper structure
      const criteria = validCriteria.map(c => ({
        key: c.key.trim().toLowerCase().replace(/\s+/g, '_'),
        title: c.title.trim(),
        weight: c.weight || 0,
        required: c.required,
      }));

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        templateType: formData.templateType,
        ratingScale: formData.ratingScale,
        criteria: criteria,
        instructions: formData.instructions?.trim() || '',
      };

      // Only add optional IDs if provided (already arrays)
      if (formData.applicableDepartmentIds.length > 0) {
        payload.applicableDepartmentIds = formData.applicableDepartmentIds;
      }
      if (formData.applicablePositionIds.length > 0) {
        payload.applicablePositionIds = formData.applicablePositionIds;
      }

      console.log('Template payload being sent:', JSON.stringify(payload, null, 2));

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `http://localhost:3000/api/performance/templates/${editingId}`
        : 'http://localhost:3000/api/performance/templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to create or edit performance templates. This action requires HR Manager or System Admin role.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Template error:', { status: response.status, error: errorData });
        throw new Error(errorData.message || errorData.error || `Failed to save template (${response.status})`);
      }

      const created = await response.json();
      console.log('Template saved successfully:', created);

      onNotify?.(`Template ${editingId ? 'updated' : 'created'} successfully`, 'success');
      setShowForm(false);
      setEditingId(null);
      setSelectedDepartmentId('');
      setPositions([]);
      setCriteriaList([{ key: '', title: '', weight: 0, required: true }]);
      setFormData({
        name: '',
        description: '',
        templateType: 'ANNUAL',
        ratingScale: {
          type: 'FIVE_POINT',
          min: 1,
          max: 5,
          labels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
        },
        instructions: '',
        applicableDepartmentIds: [],
        applicablePositionIds: [],
      });
      fetchTemplates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error saving template';
      onNotify?.(message, 'error');
      console.error('Full error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/performance/templates/${id}/deactivate`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to delete performance templates. This action requires HR Manager or System Admin role.', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to delete template');

      onNotify?.('Template deleted successfully', 'success');
      fetchTemplates();
    } catch (error) {
      onNotify?.('Error deleting template', 'error');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Appraisal Templates</h2>
        {isHRManager && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setSelectedDepartmentId('');
              setPositions([]);
              setCriteriaList([{ key: '', title: '', weight: 0, required: true }]);
              setFormData({
                name: '',
                description: '',
                templateType: 'ANNUAL',
                ratingScale: {
                  type: 'FIVE_POINT',
                  min: 1,
                  max: 5,
                  labels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
                },
                instructions: '',
                applicableDepartmentIds: [],
                applicablePositionIds: [],
              });
            }}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Template
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isHRManager && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Annual Performance Review 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the template purpose..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Template Type</label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value as 'ANNUAL' | 'SEMI_ANNUAL' | 'PROBATIONARY' | 'PROJECT' | 'AD_HOC' })}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ANNUAL">Annual</option>
              <option value="SEMI_ANNUAL">Semi-Annual</option>
              <option value="PROBATIONARY">Probationary</option>
              <option value="PROJECT">Project</option>
              <option value="AD_HOC">Ad-Hoc</option>
            </select>
          </div>

          {/* Criteria Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Evaluation Criteria</label>
              <button
                type="button"
                onClick={addCriterion}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Plus size={14} />
                Add Criterion
              </button>
            </div>
            <div className="space-y-3">
              {criteriaList.map((criterion, index) => (
                <div key={index} className="flex gap-2 items-start p-3 rounded bg-gray-700/30 border border-gray-600">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">Key</label>
                      <input
                        type="text"
                        value={criterion.key}
                        onChange={(e) => updateCriterion(index, 'key', e.target.value)}
                        className="w-full rounded bg-gray-700/50 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., productivity"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Title</label>
                      <input
                        type="text"
                        value={criterion.title}
                        onChange={(e) => updateCriterion(index, 'title', e.target.value)}
                        className="w-full rounded bg-gray-700/50 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., Productivity"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Weight (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={criterion.weight || 0}
                        onChange={(e) => updateCriterion(index, 'weight', parseInt(e.target.value) || 0)}
                        className="w-full rounded bg-gray-700/50 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Required</label>
                      <input
                        type="checkbox"
                        checked={criterion.required}
                        onChange={(e) => updateCriterion(index, 'required', e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                  {criteriaList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriterion(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Total weight should add up to 100%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide guidance for evaluators..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Select Department</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => {
                const deptId = e.target.value;
                setSelectedDepartmentId(deptId);
                if (deptId) {
                  fetchPositionsByDepartment(deptId);
                } else {
                  setPositions([]);
                }
              }}
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a department --</option>
              {departments.length === 0 ? (
                <option disabled>No departments available</option>
              ) : (
                departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedDepartmentId && (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Select Positions in {departments.find(d => d._id === selectedDepartmentId)?.name}
              </label>
              {positions.length > 0 ? (
                <>
                  <select
                    multiple
                    value={formData.applicablePositionIds}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                      // Also add the department ID if positions are selected
                      const deptIds = selectedIds.length > 0 && !formData.applicableDepartmentIds.includes(selectedDepartmentId)
                        ? [...formData.applicableDepartmentIds, selectedDepartmentId]
                        : formData.applicableDepartmentIds;
                      setFormData({ 
                        ...formData, 
                        applicablePositionIds: selectedIds,
                        applicableDepartmentIds: deptIds
                      });
                    }}
                    className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size={Math.min(positions.length, 5)}
                  >
                    {positions.map((pos) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.code}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple positions. Department will be auto-added.</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-yellow-400">No positions found for this department</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Save Template
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

      {/* Templates List */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-center text-gray-500">No templates available</p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{template.name}</h3>
                <p className="mt-1 text-xs text-gray-400">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.criteria.slice(0, 3).map((criterion, idx) => (
                    <span key={idx} className="inline-block rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                      {typeof criterion === 'string' ? criterion : criterion.title}
                    </span>
                  ))}
                  {template.criteria.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs text-gray-400">
                      +{template.criteria.length - 3} more
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Type: {template.templateType} • {new Date(template.createdAt || new Date()).toLocaleDateString()}
                </p>
              </div>
              {isHRManager && (
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(template.id || template._id || null);
                      // Load criteria into criteriaList
                      const loadedCriteria = template.criteria.map((c: any) => ({
                        key: c.key || '',
                        title: typeof c === 'string' ? c : c.title || '',
                        weight: c.weight || 0,
                        required: c.required !== false,
                      }));
                      setCriteriaList(loadedCriteria.length > 0 ? loadedCriteria : [{ key: '', title: '', weight: 0, required: true }]);
                      
                      setFormData({
                        name: template.name,
                        description: template.description || '',
                        templateType: template.templateType,
                        ratingScale: {
                          type: template.ratingScale?.type || 'FIVE_POINT',
                          min: template.ratingScale?.min || 1,
                          max: template.ratingScale?.max || 5,
                          labels: template.ratingScale?.labels || ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
                        },
                        instructions: template.instructions || '',
                        applicableDepartmentIds: template.applicableDepartmentIds || [],
                        applicablePositionIds: template.applicablePositionIds || [],
                      });
                      setShowForm(true);
                    }}
                    className="text-gray-400 hover:text-blue-400"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id || template._id || '')}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {!template.isActive && (
                <div className="ml-4 flex items-center gap-2 text-xs text-gray-500">
                  <Lock size={14} />
                  Inactive
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
