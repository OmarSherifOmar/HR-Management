'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import {
  createChangeRequest,
  submitChangeRequest,
  getDepartments,
  getPositions,
  getPayGrades,
  searchEmployeeByNumber,
  Department,
  Position,
  Employee,
} from '@/app/lib/api/organizationService';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function CreateChangeRequestPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [payGrades, setPayGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  
  // Employee search state
  const [employeeSearchInput, setEmployeeSearchInput] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearching, setEmployeeSearching] = useState(false);

  const [formData, setFormData] = useState({
    requestType: 'NEW_POSITION',
    reason: '',
    targetDepartmentId: '',
    targetPositionId: '',
    // For NEW_DEPARTMENT / UPDATE_DEPARTMENT
    deptCode: '',
    deptName: '',
    deptDescription: '',
    headPositionId: '',
    // For NEW_POSITION / UPDATE_POSITION
    posTitle: '',
    posCode: '',
    posDescription: '',
    departmentId: '',
    reportsToPositionId: '',
    payGradeId: '',
    employeeId: '',
    startDate: '',
    supervisorPositionId: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const [depts, pos, grades] = await Promise.all([
        getDepartments(token),
        getPositions(token),
        getPayGrades(token),
      ]);
      setDepartments(Array.isArray(depts) ? depts : []);
      setPositions(Array.isArray(pos) ? pos : []);
      setPayGrades(Array.isArray(grades) ? grades : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAutoSubmit(e.target.checked);
  };

  const handleEmployeeSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmployeeSearchInput(value);
    
    if (value.trim().length < 1) {
      setEmployeeSearchResults([]);
      return;
    }

    try {
      setEmployeeSearching(true);
      const results = await searchEmployeeByNumber(value);
      setEmployeeSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
      setEmployeeSearchResults([]);
    } finally {
      setEmployeeSearching(false);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData((prev) => ({
      ...prev,
      employeeId: employee._id || '',
    }));
    setEmployeeSearchInput('');
    setEmployeeSearchResults([]);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setFormData((prev) => ({
      ...prev,
      employeeId: '',
    }));
    setEmployeeSearchInput('');
    setEmployeeSearchResults([]);
  };

  const buildPayload = () => {
    const { requestType } = formData;

    if (requestType === 'NEW_DEPARTMENT' || requestType === 'UPDATE_DEPARTMENT') {
      const payload: any = {
        code: formData.deptCode,
        name: formData.deptName,
        description: formData.deptDescription,
      };
      if (formData.headPositionId) {
        payload.headPositionId = formData.headPositionId;
      }
      return payload;
    }

    if (requestType === 'NEW_POSITION' || requestType === 'UPDATE_POSITION') {
      const payload: any = {
        title: formData.posTitle,
        code: formData.posCode,
        description: formData.posDescription,
        departmentId: formData.departmentId,
      };
      if (formData.reportsToPositionId) {
        payload.reportsToPositionId = formData.reportsToPositionId;
      }
      if (formData.payGradeId) {
        payload.payGradeId = formData.payGradeId;
      }
      if (formData.employeeId) {
        payload.employeeId = formData.employeeId;
        if (formData.startDate) {
          payload.startDate = formData.startDate;
        }
        if (formData.supervisorPositionId) {
          payload.supervisorPositionId = formData.supervisorPositionId;
        }
        if (formData.endDate) {
          payload.endDate = formData.endDate;
        }
      }
      return payload;
    }

    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      setError('Reason is required');
      return;
    }

    const { requestType } = formData;

    // Validation for each request type
    if (requestType === 'NEW_DEPARTMENT') {
      if (!formData.deptCode.trim() || !formData.deptName.trim()) {
        setError('Department code and name are required for NEW_DEPARTMENT');
        return;
      }
    } else if (requestType === 'UPDATE_DEPARTMENT') {
      if (!formData.targetDepartmentId) {
        setError('Please select a department to update');
        return;
      }
      if (!formData.deptCode.trim() || !formData.deptName.trim()) {
        setError('Department code and name are required for UPDATE_DEPARTMENT');
        return;
      }
    } else if (requestType === 'NEW_POSITION') {
      if (!formData.posTitle.trim() || !formData.posCode.trim() || !formData.departmentId) {
        setError('Position title, code, and department are required for NEW_POSITION');
        return;
      }
    } else if (requestType === 'UPDATE_POSITION') {
      if (!formData.targetPositionId) {
        setError('Please select a position to update');
        return;
      }
      if (!formData.posTitle.trim() || !formData.posCode.trim() || !formData.departmentId) {
        setError('Position title, code, and department are required for UPDATE_POSITION');
        return;
      }
    } else if (requestType === 'CLOSE_POSITION') {
      if (!formData.targetPositionId) {
        setError('Please select a position to close');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = buildPayload();

      const requestData: any = {
        requestType: formData.requestType,
        reason: formData.reason,
        details: formData.reason,
      };

      if (requestType === 'UPDATE_DEPARTMENT' || requestType === 'UPDATE_POSITION') {
        requestData.targetDepartmentId = formData.targetDepartmentId || undefined;
        requestData.targetPositionId = formData.targetPositionId || undefined;
      }

      if (Object.keys(payload).length > 0) {
        requestData.payload = payload;
      }

      // Create the change request
      const created = await createChangeRequest(requestData);

      // If auto-submit is enabled, submit the request
      if (autoSubmit && created._id) {
        await submitChangeRequest(created._id);
        alert('Change request created and submitted successfully!');
      } else {
        alert('Change request created successfully!');
      }

      router.push('/dashboard/organization/requests/my-requests');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create change request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Change Request">
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-2">Create Change Request</h1>
          <p className="text-gray-400">Submit a new organizational structure change request</p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">Create New Change Request</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                name="requestType"
                value={formData.requestType}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="NEW_DEPARTMENT">New Department</option>
                <option value="UPDATE_DEPARTMENT">Update Department</option>
                <option value="NEW_POSITION">New Position</option>
                <option value="UPDATE_POSITION">Update Position</option>
                <option value="CLOSE_POSITION">Close Position</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Explain the reason for this change request"
                rows={4}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                required
              />
            </div>

            {/* UPDATE_DEPARTMENT: Select Department to Update */}
            {formData.requestType === 'UPDATE_DEPARTMENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Department to Update <span className="text-red-500">*</span>
                </label>
                <select
                  name="targetDepartmentId"
                  value={formData.targetDepartmentId}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* UPDATE_POSITION / CLOSE_POSITION: Select Position */}
            {(formData.requestType === 'UPDATE_POSITION' || formData.requestType === 'CLOSE_POSITION') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Position to {formData.requestType === 'CLOSE_POSITION' ? 'Close' : 'Update'} <span className="text-red-500">*</span>
                </label>
                <select
                  name="targetPositionId"
                  value={formData.targetPositionId}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select a position</option>
                  {positions.map((pos) => (
                    <option key={pos._id} value={pos._id}>
                      {pos.title} ({pos.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DEPARTMENT FIELDS */}
            {(formData.requestType === 'NEW_DEPARTMENT' || formData.requestType === 'UPDATE_DEPARTMENT') && (
              <>
                <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Department Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="deptCode"
                        value={formData.deptCode}
                        onChange={handleChange}
                        placeholder="e.g., IT, HR, FIN"
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="deptName"
                        value={formData.deptName}
                        onChange={handleChange}
                        placeholder="e.g., Information Technology"
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        name="deptDescription"
                        value={formData.deptDescription}
                        onChange={handleChange}
                        placeholder="Department description"
                        rows={3}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department Head Position (Optional)
                      </label>
                      <select
                        name="headPositionId"
                        value={formData.headPositionId}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      >
                        <option value="">Select department head position</option>
                        {positions.map((pos) => (
                          <option key={pos._id} value={pos._id}>
                            {pos.title} ({pos.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* POSITION FIELDS */}
            {(formData.requestType === 'NEW_POSITION' || formData.requestType === 'UPDATE_POSITION') && (
              <>
                <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Position Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="posTitle"
                        value={formData.posTitle}
                        onChange={handleChange}
                        placeholder="e.g., Senior Developer"
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="posCode"
                        value={formData.posCode}
                        onChange={handleChange}
                        placeholder="e.g., SD-001"
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        name="posDescription"
                        value={formData.posDescription}
                        onChange={handleChange}
                        placeholder="Position description and responsibilities"
                        rows={3}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reports To Position (Optional)
                      </label>
                      <select
                        name="reportsToPositionId"
                        value={formData.reportsToPositionId}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      >
                        <option value="">Select reporting position</option>
                        {positions.map((pos) => (
                          <option key={pos._id} value={pos._id}>
                            {pos.title} ({pos.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pay Grade (Optional)
                      </label>
                      <select
                        name="payGradeId"
                        value={formData.payGradeId}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      >
                        <option value="">Select a pay grade</option>
                        {payGrades.map((grade: any) => (
                          <option key={grade._id} value={grade._id}>
                            {grade.grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Employee Assignment (Optional) */}
                <div className="bg-[#2a2a2a] border border-gray-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Assign Employee (Optional)</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Search Employee by Number
                      </label>
                      {selectedEmployee ? (
                        <div className="bg-[#1a1a1a] border border-green-600 rounded-lg px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {selectedEmployee.employeeNumber} - {selectedEmployee.firstName} {selectedEmployee.lastName}
                            </p>
                            {selectedEmployee.workEmail && (
                              <p className="text-gray-400 text-sm">{selectedEmployee.workEmail}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleClearEmployee}
                            className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={employeeSearchInput}
                            onChange={handleEmployeeSearch}
                            placeholder="Enter employee number (e.g., EMP001)"
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                          
                          {employeeSearching && (
                            <div className="absolute right-3 top-3">
                              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                            </div>
                          )}

                          {employeeSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                              {employeeSearchResults.map((emp) => (
                                <button
                                  key={emp._id}
                                  type="button"
                                  onClick={() => handleSelectEmployee(emp)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] border-b border-gray-700 last:border-b-0 transition-colors"
                                >
                                  <p className="text-white font-medium">
                                    {emp.employeeNumber} - {emp.firstName} {emp.lastName}
                                  </p>
                                  {emp.workEmail && (
                                    <p className="text-gray-400 text-xs">{emp.workEmail}</p>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedEmployee && (
                      <>
                        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3">
                          <p className="text-gray-300 text-sm mb-3">Additional Details for Employee Assignment:</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Supervisor Position (Optional)
                          </label>
                          <select
                            name="supervisorPositionId"
                            value={formData.supervisorPositionId}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                          >
                            <option value="">Select supervisor position</option>
                            {positions.map((pos) => (
                              <option key={pos._id} value={pos._id}>
                                {pos.title} ({pos.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Auto Submit Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSubmit"
                checked={autoSubmit}
                onChange={handleCheckboxChange}
                className="w-4 h-4 bg-[#2a2a2a] border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="autoSubmit" className="text-sm text-gray-300 cursor-pointer">
                Automatically submit request after creation
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Change Request'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
