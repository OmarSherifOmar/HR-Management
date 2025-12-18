'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Send, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface Cycle {
  _id: string;
  id?: string;
  name: string;
  status: string;
}

interface Template {
  _id: string;
  id?: string;
  name: string;
  templateType: string;
}

interface Department {
  _id: string;
  id?: string;
  name: string;
  headPositionId?: string;
}

interface Position {
  _id: string;
  id?: string;
  name: string;
  code: string;
  departmentId: string;
}

interface Employee {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  primaryPositionId?: string;
  supervisorId?: string;
  departmentId?: string;
}

interface Assignment {
  _id?: string;
  id?: string;
  employeeProfileId: string;
  managerProfileId: string;
  cycleId: string;
  templateId: string;
  departmentId: string;
  positionId?: string;
  status: string;
  assignedAt: string;
  dueDate?: string;
  employeeName?: string;
  cycleName?: string;
  employeeDetails?: {
    firstName?: string;
    lastName?: string;
    position?: string;
    department?: string;
  };
}

interface PerformanceAssignmentsProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function PerformanceAssignments({ userRole, employeeId, onNotify }: PerformanceAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allDeptEmployees, setAllDeptEmployees] = useState<Employee[]>([]); // For manager dropdown
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cycleId: '',
    templateId: '',
    departmentId: '',
    employeeProfileId: '',
    managerProfileId: '',
    positionId: '',
    dueDate: '',
  });

  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');
  const canCreateAssignments = ['HR Manager', 'HR Admin', 'HR Employee', 'System Admin'].includes(userRole || '');
  const isDepartmentHead = userRole === 'department head';

  useEffect(() => {
    fetchAssignments();
    fetchCycles();
    fetchTemplates();
    fetchDepartments();
  }, []);

  // Fetch positions and employees when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchPositions(formData.departmentId);
      fetchAllDepartmentEmployees(formData.departmentId); // Fetch all employees for manager dropdown
      // Reset dependent fields
      setFormData(prev => ({
        ...prev,
        positionId: '',
        employeeProfileId: '',
        managerProfileId: '',
      }));
      setEmployees([]);
    } else {
      setPositions([]);
      setEmployees([]);
      setAllDeptEmployees([]);
    }
  }, [formData.departmentId]);

  // Fetch employees when position changes
  useEffect(() => {
    if (formData.departmentId && formData.positionId) {
      fetchEmployeesByPosition(formData.positionId);
      // Reset employee and manager
      setFormData(prev => ({
        ...prev,
        employeeProfileId: '',
        managerProfileId: '',
      }));
    } else if (formData.departmentId && !formData.positionId) {
      // If no position selected, show all employees in department
      setEmployees(allDeptEmployees);
    }
  }, [formData.positionId, allDeptEmployees]);

  // Auto-fetch manager when employee is selected
  useEffect(() => {
    if (formData.employeeProfileId && formData.departmentId) {
      findDepartmentHead(formData.departmentId);
    }
  }, [formData.employeeProfileId]);

  // Fetch all employees in the department (for manager dropdown)
  const fetchAllDepartmentEmployees = async (departmentId: string) => {
    try {
      console.log('Fetching all employees for department ID:', departmentId);
      
      const response = await fetch(`http://localhost:3000/employees/searchs?department=${departmentId}&status=ACTIVE`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch all department employees:', response.status);
        setAllDeptEmployees([]);
        return;
      }
      const data = await response.json();
      const allEmployees = Array.isArray(data) ? data : (data.employees || data.data || []);
      console.log('Fetched department employees:', allEmployees.length);
      setAllDeptEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching all department employees:', error);
      setAllDeptEmployees([]);
    }
  };

  const findDepartmentHead = async (departmentId: string) => {
    try {
      // Try to get department head as manager
      const dept = departments.find(d => (d._id || d.id) === departmentId);
      if (dept?.headPositionId) {
        console.log('Looking for department head with position ID:', dept.headPositionId);
        // Search for employees in this department and find one with the head position
        const response = await fetch(`http://localhost:3000/employees/searchs?department=${departmentId}&status=ACTIVE`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const allEmployees = Array.isArray(data) ? data : (data.employees || data.data || []);
          
          // Find the employee who holds the department head position
          const headEmployee = allEmployees.find((e: Employee) => {
            const empPositionId = e.primaryPositionId?.toString() || 
                                  (e.primaryPositionId as any)?._id?.toString() || 
                                  (e.primaryPositionId as any)?.toString();
            return empPositionId === dept.headPositionId && 
                   (e._id || e.id) !== formData.employeeProfileId;
          });
          
          if (headEmployee) {
            setFormData(prev => ({ ...prev, managerProfileId: headEmployee._id || headEmployee.id || '' }));
            return;
          }
        }
      }
      // Clear manager if no head found
      setFormData(prev => ({ ...prev, managerProfileId: '' }));
    } catch (error) {
      console.error('Error finding department head:', error);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // Only fetch assignments for department heads (manager/me endpoint)
      // There's no general GET /assignments endpoint in the backend
      if (isDepartmentHead) {
        const response = await fetch('http://localhost:3000/api/performance/assignments/manager/me', {
          credentials: 'include',
        });

        if (response.status === 403) {
          setAssignments([]);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setAssignments(Array.isArray(data) ? data : []);
        }
      } else if (employeeId) {
        // For HR roles, try to fetch by manager ID
        const response = await fetch(`http://localhost:3000/api/performance/assignments/manager/${employeeId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAssignments(Array.isArray(data) ? data : []);
        } else {
          setAssignments([]);
        }
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycles = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/performance/cycles', {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      // Filter to show only ACTIVE or PLANNED cycles
      const activeCycles = (Array.isArray(data) ? data : []).filter(
        (c: Cycle) => c.status === 'ACTIVE' || c.status === 'PLANNED'
      );
      setCycles(activeCycles);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/performance/templates', {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/org/departments', {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPositions = async (departmentId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/org/positions?departmentId=${departmentId}`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchEmployeesByPosition = async (positionId: string) => {
    try {
      // Fetch all department employees by department ID and filter by position ID
      const departmentId = formData.departmentId;
      
      console.log('Fetching employees for position:', positionId, 'in department ID:', departmentId);
      
      const response = await fetch(`http://localhost:3000/employees/searchs?department=${departmentId}&status=ACTIVE`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch employees:', response.status);
        setEmployees([]);
        return;
      }
      const data = await response.json();
      const allEmployees = Array.isArray(data) ? data : (data.employees || data.data || []);
      
      console.log('All employees in department:', allEmployees.length);
      if (allEmployees.length > 0) {
        console.log('Sample employee full data:', JSON.stringify(allEmployees[0], null, 2));
      }
      
      // Filter employees by primaryPositionId matching the selected position
      const filteredEmployees = allEmployees.filter((emp: any) => {
        // Handle different formats of primaryPositionId
        // When populated, it becomes an object with _id and title
        // When not populated, it's just a string ID
        let empPositionId = '';
        
        if (typeof emp.primaryPositionId === 'string') {
          empPositionId = emp.primaryPositionId;
        } else if (emp.primaryPositionId && typeof emp.primaryPositionId === 'object') {
          // Populated object - extract _id
          empPositionId = emp.primaryPositionId._id?.toString() || 
                         emp.primaryPositionId.id?.toString() || 
                         '';
        }
        
        console.log(`Employee ${emp.firstName}: positionId=${empPositionId}, looking for=${positionId}`);
        
        const matches = empPositionId === positionId;
        return matches;
      });
      
      console.log('Filtered employees count:', filteredEmployees.length);
      setEmployees(filteredEmployees);
    } catch (error) {
      console.error('Error fetching employees by position:', error);
      setEmployees([]);
    }
  };

  const fetchEmployeesByDepartment = async (departmentId: string) => {
    try {
      console.log('Fetching all employees for department ID:', departmentId);
      
      const response = await fetch(`http://localhost:3000/employees/searchs?department=${departmentId}&status=ACTIVE`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch employees:', response.status);
        setEmployees([]);
        return;
      }
      const data = await response.json();
      const allEmployees = Array.isArray(data) ? data : (data.employees || data.data || []);
      console.log('Fetched employees by department:', allEmployees.length);
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.cycleId || !formData.templateId || !formData.employeeProfileId || 
          !formData.managerProfileId || !formData.departmentId) {
        onNotify?.('Please fill all required fields', 'error');
        return;
      }

      const payload = {
        cycleId: formData.cycleId,
        templateId: formData.templateId,
        employeeProfileId: formData.employeeProfileId,
        managerProfileId: formData.managerProfileId,
        departmentId: formData.departmentId,
        positionId: formData.positionId || undefined,
        dueDate: formData.dueDate || undefined,
      };

      console.log('Assignment payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3000/api/performance/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to create assignments', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create assignment');
      }

      onNotify?.('Assignment created successfully', 'success');
      setShowForm(false);
      setFormData({
        cycleId: '',
        templateId: '',
        departmentId: '',
        employeeProfileId: '',
        managerProfileId: '',
        positionId: '',
        dueDate: '',
      });
      fetchAssignments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating assignment';
      onNotify?.(message, 'error');
      console.error(error);
    }
  };

  const handlePublish = async (recordId: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/performance/assignments/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recordId, publishedByEmployeeId: employeeId }),
      });

      if (response.status === 403) {
        onNotify?.('You do not have permission to publish', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to publish');

      onNotify?.('Appraisal published successfully', 'success');
      fetchAssignments();
    } catch (error) {
      onNotify?.('Error publishing appraisal', 'error');
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'SUBMITTED':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'NOT_STARTED':
        return <AlertCircle size={16} className="text-yellow-400" />;
      case 'IN_PROGRESS':
        return <AlertCircle size={16} className="text-blue-400" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-300';
      case 'SUBMITTED':
        return 'bg-green-500/20 text-green-300';
      case 'PUBLISHED':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Appraisal Assignments</h2>
        {canCreateAssignments && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Assignment
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && canCreateAssignments && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          {/* Department Selection - STEP 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-300">1. Department *</label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ 
                ...formData, 
                departmentId: e.target.value,
                positionId: '',
                employeeProfileId: '',
                managerProfileId: '',
              })}
              required
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Selection - STEP 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-300">2. Position (Optional)</label>
            <select
              value={formData.positionId}
              onChange={(e) => setFormData({ 
                ...formData, 
                positionId: e.target.value,
                employeeProfileId: '',
                managerProfileId: '',
              })}
              disabled={!formData.departmentId}
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <option value="">-- All Positions --</option>
              {positions.map((pos) => (
                <option key={pos._id || pos.id} value={pos._id || pos.id}>
                  {pos.code} - {pos.name}
                </option>
              ))}
            </select>
            {!formData.departmentId && (
              <p className="mt-1 text-xs text-gray-500">Select a department first</p>
            )}
          </div>

          {/* Employee Selection - STEP 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-300">3. Employee to Appraise *</label>
            <select
              value={formData.employeeProfileId}
              onChange={(e) => setFormData({ ...formData, employeeProfileId: e.target.value })}
              required
              disabled={!formData.departmentId}
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            {!formData.departmentId && (
              <p className="mt-1 text-xs text-gray-500">Select a department first</p>
            )}
            {formData.departmentId && employees.length === 0 && (
              <p className="mt-1 text-xs text-yellow-500">No employees found in selected department/position</p>
            )}
          </div>

          {/* Manager Selection - STEP 4 (Auto-filled) */}
          <div>
            <label className="block text-sm font-medium text-gray-300">4. Appraising Manager (Department Head) *</label>
            <select
              value={formData.managerProfileId}
              onChange={(e) => setFormData({ ...formData, managerProfileId: e.target.value })}
              required
              disabled={!formData.employeeProfileId}
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Manager --</option>
              {allDeptEmployees
                .filter(e => (e._id || e.id) !== formData.employeeProfileId)
                .map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Auto-selected based on department head</p>
            {!formData.employeeProfileId && (
              <p className="mt-1 text-xs text-gray-500">Select an employee first</p>
            )}
          </div>

          {/* Cycle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Appraisal Cycle *</label>
            <select
              value={formData.cycleId}
              onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
              required
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Cycle --</option>
              {cycles.map((cycle) => (
                <option key={cycle._id || cycle.id} value={cycle._id || cycle.id}>
                  {cycle.name} ({cycle.status})
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Appraisal Template *</label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              required
              className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Template --</option>
              {templates.map((template) => (
                <option key={template._id || template.id} value={template._id || template.id}>
                  {template.name} ({template.templateType})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Create Assignment
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

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-center text-gray-500">
            {isDepartmentHead ? 'No appraisals assigned to you' : 'No assignments available'}
          </p>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment._id || assignment.id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {getStatusIcon(assignment.status)}
                  <div>
                    <h3 className="font-semibold text-white">
                      {assignment.employeeName || assignment.employeeDetails?.firstName 
                        ? `${assignment.employeeDetails?.firstName || ''} ${assignment.employeeDetails?.lastName || ''}`.trim() || 'Unknown Employee'
                        : `Employee ID: ${assignment.employeeProfileId}`}
                    </h3>
                    {assignment.employeeDetails?.position && (
                      <p className="text-xs text-gray-400">{assignment.employeeDetails.position}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  {assignment.cycleName && (
                    <span className="text-xs text-gray-500">Cycle: {assignment.cycleName}</span>
                  )}
                  <p className="text-xs text-gray-500">
                    Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                  </p>
                  {assignment.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {isHRRole && assignment.status === 'SUBMITTED' && (
                <button
                  onClick={() => handlePublish(assignment._id || assignment.id || '')}
                  className="ml-4 flex items-center gap-1 rounded bg-purple-600/20 px-3 py-2 text-xs font-medium text-purple-400 hover:bg-purple-600/30"
                >
                  <Send size={14} />
                  Publish
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
