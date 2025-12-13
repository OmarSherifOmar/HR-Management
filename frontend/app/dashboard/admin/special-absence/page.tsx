'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';

type SpecialAbsenceCode = 
  | 'BEREAVEMENT' 
  | 'JURY_DUTY' 
  | 'MILITARY' 
  | 'MISSION' 
  | 'TRAINING' 
  | 'STUDY' 
  | 'EMERGENCY' 
  | 'HAJJ'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'SICK_EXTENDED'
  | 'EXAM'
  | 'MARRIAGE'
  | 'CONTACT_INFECTED'
  | 'OTHER';

interface SpecialAbsenceRule {
  code: SpecialAbsenceCode | string;
  maxDaysPerYear?: number;
  maxDaysPerOccurrence?: number;
  requiresDocumentation: boolean;
  documentationType?: string;
  isPaid: boolean;
  payPercentage?: number;
  advanceNoticeRequired: boolean;
  advanceNoticeDays?: number;
  autoApprove: boolean;
  approvalLevels?: string[];
  allowExtension: boolean;
  extensionMaxDays?: number;
  notes?: string;
  
  // Special tracking fields (REQ-011)
  trackCumulatively?: boolean; // For sick leave (3-year cycle, max 360 days)
  cumulativeMaxDays?: number; // E.g., 360 days for sick leave
  cumulativePeriodYears?: number; // E.g., 3 years
  trackOccurrences?: boolean; // For maternity leave tracking
  maxOccurrences?: number; // E.g., max maternity leaves
}

interface SpecialAbsenceType {
  _id?: string;
  leaveType: {
    _id: string;
    code: string;
    name: string;
    categoryId: any;
    description?: string;
    paid: boolean;
    deductible: boolean;
    requiresAttachment: boolean;
    attachmentType?: string;
    maxDurationDays?: number;
  };
  rule: SpecialAbsenceRule | null;
}

interface Template {
  code: string;
  name: string;
  defaultRule: SpecialAbsenceRule;
}

interface Category {
  _id: string;
  name: string;
  code: string;
}

export default function SpecialAbsencePage() {
  const [specialTypes, setSpecialTypes] = useState<SpecialAbsenceType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingType, setEditingType] = useState<SpecialAbsenceType | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    description: '',
    maxDaysPerYear: 0,
    maxDaysPerOccurrence: 0,
    requiresDocumentation: true,
    documentationType: 'document',
    isPaid: true,
    payPercentage: 100,
    advanceNoticeRequired: false,
    advanceNoticeDays: 0,
    autoApprove: false,
    approvalLevels: [] as string[],
    allowExtension: false,
    extensionMaxDays: 0,
    notes: '',
    trackCumulatively: false,
    cumulativeMaxDays: 360,
    cumulativePeriodYears: 3,
    trackOccurrences: false,
    maxOccurrences: 3,
  });

  useEffect(() => {
    fetchSpecialTypes();
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchSpecialTypes = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/special-absence', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSpecialTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch special absence types:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/special-absence/templates', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/categories', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateFromTemplate = async (template: Template) => {
    if (!formData.categoryId) {
      alert('Please select a category first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/leaves/special-absence/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateCode: template.code,
          categoryId: formData.categoryId,
        }),
      });

      if (response.ok) {
        await fetchSpecialTypes();
        setShowTemplateModal(false);
        alert(`Created ${template.name} successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
      alert('Failed to create from template');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rule: SpecialAbsenceRule = {
        code: formData.code,
        maxDaysPerYear: formData.maxDaysPerYear || undefined,
        maxDaysPerOccurrence: formData.maxDaysPerOccurrence || undefined,
        requiresDocumentation: formData.requiresDocumentation,
        documentationType: formData.documentationType,
        isPaid: formData.isPaid,
        payPercentage: formData.payPercentage,
        advanceNoticeRequired: formData.advanceNoticeRequired,
        advanceNoticeDays: formData.advanceNoticeDays || undefined,
        autoApprove: formData.autoApprove,
        approvalLevels: formData.approvalLevels,
        allowExtension: formData.allowExtension,
        extensionMaxDays: formData.extensionMaxDays || undefined,
        notes: formData.notes,
        trackCumulatively: formData.trackCumulatively,
        cumulativeMaxDays: formData.cumulativeMaxDays,
        cumulativePeriodYears: formData.cumulativePeriodYears,
        trackOccurrences: formData.trackOccurrences,
        maxOccurrences: formData.maxOccurrences,
      };

      const response = await fetch('http://localhost:3000/leaves/special-absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          categoryId: formData.categoryId,
          description: formData.description,
          rule,
        }),
      });

      if (response.ok) {
        await fetchSpecialTypes();
        setShowCreateModal(false);
        resetForm();
        alert('Special absence type created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to create special absence type:', error);
      alert('Failed to create special absence type');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      categoryId: '',
      description: '',
      maxDaysPerYear: 0,
      maxDaysPerOccurrence: 0,
      requiresDocumentation: true,
      documentationType: 'document',
      isPaid: true,
      payPercentage: 100,
      advanceNoticeRequired: false,
      advanceNoticeDays: 0,
      autoApprove: false,
      approvalLevels: [],
      allowExtension: false,
      extensionMaxDays: 0,
      notes: '',
      trackCumulatively: false,
      cumulativeMaxDays: 360,
      cumulativePeriodYears: 3,
      trackOccurrences: false,
      maxOccurrences: 3,
    });
  };

  const toggleApprovalLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      approvalLevels: prev.approvalLevels.includes(level)
        ? prev.approvalLevels.filter(l => l !== level)
        : [...prev.approvalLevels, level],
    }));
  };

  return (
    <DashboardLayout title="Special Absence Types" description="Configure special leave types with unique rules">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">Special Absence / Mission Types</h1>
            <p className="text-gray-400 mt-1">
              Configure Hajj leave, maternity, sick leave tracking (360d/3y), contact with infected, exams, marriage, etc.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📋 Create from Template
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ➕ Create Custom Type
            </button>
          </div>
        </div>

        {/* Special Types List */}
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Max Days/Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Special Tracking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {specialTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No special absence types configured. Create one from a template or build your own.
                  </td>
                </tr>
              ) : (
                specialTypes.map((type) => (
                  <tr key={type.leaveType._id} className="hover:bg-[#333333] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">{type.leaveType.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{type.leaveType.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {type.rule?.maxDaysPerYear || '∞ Unlimited'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        type.leaveType.paid 
                          ? 'bg-green-900/50 text-green-300 border border-green-700' 
                          : 'bg-red-900/50 text-red-300 border border-red-700'
                      }`}>
                        {type.leaveType.paid ? `💰 ${type.rule?.payPercentage || 100}% Paid` : '❌ Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {type.rule?.trackCumulatively && (
                          <span className="bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded-full text-xs">
                            📊 {type.rule.cumulativeMaxDays}d/{type.rule.cumulativePeriodYears}y
                          </span>
                        )}
                        {type.rule?.trackOccurrences && (
                          <span className="bg-blue-900/50 text-blue-300 border border-blue-700 px-2 py-1 rounded-full text-xs">
                            🔢 Max {type.rule.maxOccurrences}×
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setEditingType(type)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        👁 View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">📋 Create from Template</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-600 text-white rounded px-3 py-2"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.code} className="bg-[#1a1a1a] border border-gray-700 hover:border-blue-600 rounded-lg p-4 transition-all">
                    <h3 className="font-bold text-lg text-white mb-2">{template.name}</h3>
                    <div className="text-sm text-gray-400 space-y-1 mb-3">
                      <p>📅 Max Days/Year: {template.defaultRule.maxDaysPerYear || 'Unlimited'}</p>
                      <p>💰 Pay: {template.defaultRule.payPercentage}%</p>
                      <p>📎 Documentation: {template.defaultRule.requiresDocumentation ? 'Required' : 'Optional'}</p>
                      <p className="text-xs mt-2 text-gray-500">{template.defaultRule.notes}</p>
                    </div>
                    <button
                      onClick={() => handleCreateFromTemplate(template)}
                      disabled={!formData.categoryId || loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowTemplateModal(false)}
                className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Create Custom Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Create Custom Special Absence Type</h2>
              
              <form onSubmit={handleCreateCustom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      placeholder="HAJJ"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      placeholder="Hajj Leave"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Days Per Year</label>
                    <input
                      type="number"
                      value={formData.maxDaysPerYear}
                      onChange={(e) => setFormData({ ...formData, maxDaysPerYear: parseInt(e.target.value) })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Days Per Occurrence</label>
                    <input
                      type="number"
                      value={formData.maxDaysPerOccurrence}
                      onChange={(e) => setFormData({ ...formData, maxDaysPerOccurrence: parseInt(e.target.value) })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                {/* Payment Settings */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold text-white mb-2">Payment Settings</h3>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center text-gray-400">
                      <input
                        type="checkbox"
                        checked={formData.isPaid}
                        onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                        className="mr-2"
                      />
                      Paid Leave
                    </label>
                    {formData.isPaid && (
                      <div className="flex items-center text-gray-400">
                        <label className="mr-2">Pay %:</label>
                        <input
                          type="number"
                          value={formData.payPercentage}
                          onChange={(e) => setFormData({ ...formData, payPercentage: parseInt(e.target.value) })}
                          className="bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 w-20 focus:border-blue-600 focus:outline-none"
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Tracking (Sick Leave / Maternity) */}
                <div className="border-t border-gray-700 pt-4 bg-blue-900/20 border border-blue-700/50 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">📊 Special Tracking Rules</h3>
                  
                  <div className="mb-4">
                    <label className="flex items-center mb-2 text-gray-400">
                      <input
                        type="checkbox"
                        checked={formData.trackCumulatively}
                        onChange={(e) => setFormData({ ...formData, trackCumulatively: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="font-medium text-white">Track Cumulatively (e.g., Sick Leave over 3 years)</span>
                    </label>
                    {formData.trackCumulatively && (
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm text-gray-400">Max Days in Period</label>
                          <input
                            type="number"
                            value={formData.cumulativeMaxDays}
                            onChange={(e) => setFormData({ ...formData, cumulativeMaxDays: parseInt(e.target.value) })}
                            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 focus:border-blue-600 focus:outline-none"
                            placeholder="360"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Period (Years)</label>
                          <input
                            type="number"
                            value={formData.cumulativePeriodYears}
                            onChange={(e) => setFormData({ ...formData, cumulativePeriodYears: parseInt(e.target.value) })}
                            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 focus:border-blue-600 focus:outline-none"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center mb-2 text-gray-400">
                      <input
                        type="checkbox"
                        checked={formData.trackOccurrences}
                        onChange={(e) => setFormData({ ...formData, trackOccurrences: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="font-medium text-white">Track Number of Occurrences (e.g., Maternity Leave)</span>
                    </label>
                    {formData.trackOccurrences && (
                      <div className="ml-6">
                        <label className="text-sm text-gray-400">Max Occurrences</label>
                        <input
                          type="number"
                          value={formData.maxOccurrences}
                          onChange={(e) => setFormData({ ...formData, maxOccurrences: parseInt(e.target.value) })}
                          className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 focus:border-blue-600 focus:outline-none"
                          placeholder="3"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Documentation */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold text-white mb-2">Documentation Requirements</h3>
                  <label className="flex items-center mb-2 text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.requiresDocumentation}
                      onChange={(e) => setFormData({ ...formData, requiresDocumentation: e.target.checked })}
                      className="mr-2"
                    />
                    Requires Documentation
                  </label>
                  {formData.requiresDocumentation && (
                    <select
                      value={formData.documentationType}
                      onChange={(e) => setFormData({ ...formData, documentationType: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="medical">Medical Certificate</option>
                      <option value="document">Official Document</option>
                      <option value="other">Other</option>
                    </select>
                  )}
                </div>

                {/* Advance Notice */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="flex items-center mb-2 text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.advanceNoticeRequired}
                      onChange={(e) => setFormData({ ...formData, advanceNoticeRequired: e.target.checked })}
                      className="mr-2"
                    />
                    Requires Advance Notice
                  </label>
                  {formData.advanceNoticeRequired && (
                    <input
                      type="number"
                      value={formData.advanceNoticeDays}
                      onChange={(e) => setFormData({ ...formData, advanceNoticeDays: parseInt(e.target.value) })}
                      className="bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      placeholder="Days"
                      min="0"
                    />
                  )}
                </div>

                {/* Approval */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="flex items-center mb-2 text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.autoApprove}
                      onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-Approve
                  </label>
                  {!formData.autoApprove && (
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Approval Levels:</p>
                      <div className="flex gap-2">
                        {['MANAGER', 'HR', 'DIRECTOR'].map(level => (
                          <label key={level} className="flex items-center text-gray-400">
                            <input
                              type="checkbox"
                              checked={formData.approvalLevels.includes(level)}
                              onChange={() => toggleApprovalLevel(level)}
                              className="mr-1"
                            />
                            {level}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extension */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="flex items-center mb-2 text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.allowExtension}
                      onChange={(e) => setFormData({ ...formData, allowExtension: e.target.checked })}
                      className="mr-2"
                    />
                    Allow Extension
                  </label>
                  {formData.allowExtension && (
                    <input
                      type="number"
                      value={formData.extensionMaxDays}
                      onChange={(e) => setFormData({ ...formData, extensionMaxDays: parseInt(e.target.value) })}
                      className="bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                      placeholder="Max Extension Days"
                      min="0"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                    rows={2}
                    placeholder="Additional notes or legal requirements..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Create Special Absence Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {editingType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">{editingType.leaveType.name}</h2>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-400">
                    <span className="font-semibold text-white">Code:</span> {editingType.leaveType.code}
                  </div>
                  <div className="text-gray-400">
                    <span className="font-semibold text-white">Category:</span> {editingType.leaveType.categoryId?.name}
                  </div>
                </div>
                
                {editingType.rule && (
                  <>
                    <div className="border-t border-gray-700 pt-3">
                      <p className="font-semibold text-white mb-2">Leave Rules:</p>
                      <div className="grid grid-cols-2 gap-2 text-gray-400">
                        <p>Max Days/Year: {editingType.rule.maxDaysPerYear || 'Unlimited'}</p>
                        <p>Max Days/Occurrence: {editingType.rule.maxDaysPerOccurrence || 'N/A'}</p>
                        <p>Paid: {editingType.rule.isPaid ? `${editingType.rule.payPercentage}%` : 'No'}</p>
                        <p>Auto-Approve: {editingType.rule.autoApprove ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    {editingType.rule.trackCumulatively && (
                      <div className="bg-purple-900/30 border border-purple-700/50 p-3 rounded">
                        <p className="font-semibold text-white">📊 Cumulative Tracking</p>
                        <p className="text-gray-400">Max {editingType.rule.cumulativeMaxDays} days over {editingType.rule.cumulativePeriodYears} years</p>
                      </div>
                    )}

                    {editingType.rule.trackOccurrences && (
                      <div className="bg-blue-900/30 border border-blue-700/50 p-3 rounded">
                        <p className="font-semibold text-white">🔢 Occurrence Tracking</p>
                        <p className="text-gray-400">Maximum {editingType.rule.maxOccurrences} occurrences</p>
                      </div>
                    )}

                    {editingType.rule.notes && (
                      <div className="border-t border-gray-700 pt-3">
                        <p className="font-semibold text-white">Notes:</p>
                        <p className="text-gray-400">{editingType.rule.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => setEditingType(null)}
                className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
