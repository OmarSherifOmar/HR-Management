'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Send, CheckCircle, AlertCircle, Users, CheckSquare, FileEdit, Star, Save } from 'lucide-react';
import { authenticatedFetch } from '@/app/context/AuthContext';

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
  latestAppraisalId?: string;
  employeeName?: string;
  cycleName?: string;
  employeeDetails?: {
    firstName?: string;
    lastName?: string;
    position?: string;
    department?: string;
  };
  template?: {
    templateId?: string;
    name?: string;
    description?: string;
    templateType?: string;
    ratingScale?: {
      min: number;
      max: number;
      labels?: string[];
    };
    criteria?: Array<{
      key: string;
      title: string;
      description?: string;
      details?: string;
      weight: number;
      required: boolean;
    }>;
    instructions?: string;
  };
  currentRecord?: {
    recordId?: string;
    status?: string;
    ratings?: Array<{
      key: string;
      title: string;
      ratingValue: number;
      ratingLabel?: string;
      comments?: string;
    }>;
    totalScore?: number;
    managerSummary?: string;
  };
}

interface RatingEntry {
  key: string;
  title: string;
  ratingValue: number;
  ratingLabel?: string;
  comments?: string;
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
  const [allDeptEmployees, setAllDeptEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>(employeeId || '');
  const [formData, setFormData] = useState({
    cycleId: '',
    templateId: '',
    departmentId: '',
    employeeProfileId: '',
    managerProfileId: '',
    positionId: '',
    dueDate: '',
  });
  const [bulkFormData, setBulkFormData] = useState({
    cycleId: '',
    templateId: '',
    departmentId: '',
    managerProfileId: '',
    dueDate: '',
  });
  
  // Bulk publish state
  const [showBulkPublishForm, setShowBulkPublishForm] = useState(false);
  const [bulkPublishData, setBulkPublishData] = useState({
    cycleId: '',
    departmentIds: [] as string[],
  });
  const [submittedAppraisals, setSubmittedAppraisals] = useState<Assignment[]>([]);

  // Normalize role for checking
  const normalizedRole = (userRole || '').toUpperCase().replace(/\s+/g, '_');
  const isHRRole = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN'].includes(normalizedRole);
  const canCreateAssignments = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN'].includes(normalizedRole);
  const isDepartmentHead = normalizedRole === 'DEPARTMENT_HEAD';
  const canSubmitAppraisals = isDepartmentHead || isHRRole;
  const canBulkPublish = isHRRole;

  // State for appraisal form
  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [appraisalFormData, setAppraisalFormData] = useState<{
    ratings: RatingEntry[];
    managerSummary: string;
    strengths: string;
    improvementAreas: string;
  }>({
    ratings: [],
    managerSummary: '',
    strengths: '',
    improvementAreas: '',
  });

  // Fetch current user's employee ID if not provided
  useEffect(() => {
    if (!currentUserId) {
      const fetchCurrentUser = async () => {
        try {
          const response = await authenticatedFetch('http://localhost:3000/api/employee-profile/me');
          if (response.ok) {
            const data = await response.json();
            setCurrentUserId(data._id || data.id);
            console.log('[PerformanceAssignments] Current user ID:', data._id || data.id);
          } else {
            console.log('[PerformanceAssignments] Failed to fetch current user, status:', response.status);
          }
        } catch (error) {
          console.log('[PerformanceAssignments] Could not fetch current user:', error);
        }
      };
      fetchCurrentUser();
    }
  }, [currentUserId]);

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
      console.log('[fetchAssignments] userRole:', userRole, 'employeeId:', employeeId);
      
      // Check for HR roles - they should see ALL assignments
      // Handle both formats: 'HR_MANAGER' and 'HR Manager'
      const normalizedRole = (userRole || '').toUpperCase().replace(/\s+/g, '_');
      const isHRRole = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN'].includes(normalizedRole);
      
      console.log('[fetchAssignments] normalizedRole:', normalizedRole, 'isHRRole:', isHRRole);
      
      let url: string;
      if (isHRRole) {
        // HR can see all assignments
        url = 'http://localhost:3000/api/performance/assignments';
        console.log('[fetchAssignments] HR role - fetching all assignments from:', url);
      } else if (employeeId) {
        // Managers/Department Heads see their own assignments
        url = `http://localhost:3000/api/performance/assignments/manager/${employeeId}`;
        console.log('[fetchAssignments] Fetching via /manager/:id endpoint for:', employeeId);
      } else {
        console.log('[fetchAssignments] No employeeId available');
        setAssignments([]);
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('[fetchAssignments] Response status:', response.status);

      if (response.status === 403) {
        console.log('[fetchAssignments] Access denied (403)');
        onNotify?.('Access Denied: You do not have permission to view performance assignments. Please contact your administrator.', 'error');
        setAssignments([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchAssignments] Got assignments:', data?.length || 0);
        console.log('[fetchAssignments] Sample assignment:', data?.[0]);
        setAssignments(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.log('[fetchAssignments] Error response:', errorText);
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
        onNotify?.('Access Denied: You do not have permission to create performance assignments. This action requires HR Manager or department head role.', 'error');
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

  // Bulk assignment handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!bulkFormData.cycleId || !bulkFormData.templateId || !bulkFormData.departmentId || 
          !bulkFormData.managerProfileId || selectedEmployees.length === 0) {
        onNotify?.('Please fill all required fields and select at least one employee', 'error');
        return;
      }

      const assignments = selectedEmployees.map(empId => ({
        employeeProfileId: empId,
        managerProfileId: bulkFormData.managerProfileId,
        departmentId: bulkFormData.departmentId,
      }));

      const payload = {
        cycleId: bulkFormData.cycleId,
        templateId: bulkFormData.templateId,
        dueDate: bulkFormData.dueDate || undefined,
        assignments,
      };

      console.log('[handleBulkSubmit] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3000/api/performance/assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to create bulk assignments. This action requires HR Manager role.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create bulk assignments');
      }

      const result = await response.json();
      onNotify?.(`Created ${result.assignmentsCreated} assignments. ${result.skipped?.length || 0} skipped.`, 'success');
      setShowBulkForm(false);
      setBulkFormData({
        cycleId: '',
        templateId: '',
        departmentId: '',
        managerProfileId: '',
        dueDate: '',
      });
      setSelectedEmployees([]);
      fetchAssignments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating bulk assignments';
      onNotify?.(message, 'error');
      console.error(error);
    }
  };

  // Toggle employee selection for bulk assignment
  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Select all employees
  const selectAllEmployees = () => {
    const filteredEmps = allDeptEmployees.filter(e => (e._id || e.id) !== bulkFormData.managerProfileId);
    setSelectedEmployees(filteredEmps.map(e => e._id || e.id || ''));
  };

  // Deselect all employees
  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  // Toggle assignment selection for bulk publish
  const toggleAssignmentSelection = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  // Bulk publish handler - publishes each selected assignment individually
  const handleBulkPublish = async () => {
    if (selectedAssignments.length === 0) {
      onNotify?.('Please select at least one assignment to publish', 'error');
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const assignmentId of selectedAssignments) {
        try {
          // Backend extracts publishedByEmployeeId from JWT
          const response = await fetch('http://localhost:3000/api/performance/assignments/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ recordId: assignmentId }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error publishing ${assignmentId}:`, error);
        }
      }

      if (successCount > 0) {
        onNotify?.(`Published ${successCount} assignment(s)${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
      } else {
        onNotify?.('Failed to publish assignments', 'error');
      }
      
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error publishing assignments';
      onNotify?.(message, 'error');
      console.error(error);
    }
  };

  // Bulk publish all submitted appraisals for a cycle
  const handleBulkPublishByCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkPublishData.cycleId) {
      onNotify?.('Please select a cycle', 'error');
      return;
    }

    try {
      // Backend will extract publishedByEmployeeId from JWT token
      const payload = {
        cycleId: bulkPublishData.cycleId,
        departmentIds: bulkPublishData.departmentIds.length > 0 ? bulkPublishData.departmentIds : undefined,
      };

      console.log('[handleBulkPublishByCycle] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3000/api/performance/assignments/bulk-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('[handleBulkPublishByCycle] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to bulk publish appraisals. This action requires HR Manager role.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleBulkPublishByCycle] Error:', errorData);
        throw new Error(errorData.message || 'Failed to bulk publish');
      }

      const result = await response.json();
      console.log('[handleBulkPublishByCycle] Success:', result);
      
      onNotify?.(`Successfully published ${result.publishedCount} appraisal(s)!`, 'success');
      setShowBulkPublishForm(false);
      setBulkPublishData({ cycleId: '', departmentIds: [] });
      fetchAssignments();
    } catch (error: any) {
      const message = error.message || 'Error bulk publishing appraisals';
      onNotify?.(message, 'error');
      console.error('[handleBulkPublishByCycle] Error:', error);
    }
  };

  // Get count of submitted (unpublished) appraisals for a cycle
  const getSubmittedCountForCycle = (cycleId: string) => {
    return assignments.filter(a => 
      a.cycleId === cycleId && 
      (a.status === 'SUBMITTED' || a.currentRecord?.status === 'MANAGER_SUBMITTED')
    ).length;
  };

  const handlePublish = async (recordId: string) => {
    try {
      console.log('[handlePublish] Publishing recordId:', recordId);
      
      if (!recordId) {
        onNotify?.('No record ID available. Please submit the appraisal first.', 'error');
        return;
      }

      // Backend will extract publishedByEmployeeId from JWT token
      const payload = { recordId };
      console.log('[handlePublish] Payload:', JSON.stringify(payload));
      
      const response = await fetch('http://localhost:3000/api/performance/assignments/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('[handlePublish] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to publish appraisals. This action requires HR Manager role.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handlePublish] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to publish');
      }

      const data = await response.json();
      console.log('[handlePublish] Success:', data);
      onNotify?.('Appraisal published successfully!', 'success');
      fetchAssignments();
    } catch (error: any) {
      const message = error.message || 'Error publishing appraisal';
      onNotify?.(message, 'error');
      console.error('[handlePublish] Error:', error);
    }
  };

  // Open appraisal form for an assignment
  const openAppraisalForm = async (assignment: Assignment) => {
    console.log('[openAppraisalForm] Assignment:', assignment);
    console.log('[openAppraisalForm] Template ID:', assignment.templateId);
    
    // Always fetch the template to get full criteria data
    let templateData = assignment.template;
    let criteria: any[] = [];
    
    const templateId = assignment.templateId || assignment.template?.templateId;
    
    if (templateId) {
      try {
        console.log('[openAppraisalForm] Fetching template:', templateId);
        const response = await fetch(`http://localhost:3000/api/performance/templates/${templateId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const fetchedTemplate = await response.json();
          console.log('[openAppraisalForm] Fetched template:', fetchedTemplate);
          console.log('[openAppraisalForm] Fetched criteria:', fetchedTemplate.criteria);
          
          criteria = (fetchedTemplate.criteria || []).map((c: any) => ({
            key: c.key,
            title: c.title,
            description: c.details || c.description || '',
            weight: c.weight || 0,
            required: c.required !== false,
          }));
          
          // Update template data with fetched info
          templateData = {
            templateId: fetchedTemplate._id || fetchedTemplate.id,
            name: fetchedTemplate.name,
            description: fetchedTemplate.description,
            templateType: fetchedTemplate.templateType,
            ratingScale: fetchedTemplate.ratingScale,
            criteria: criteria,
            instructions: fetchedTemplate.instructions,
          };
        } else {
          console.error('[openAppraisalForm] Failed to fetch template:', response.status);
        }
      } catch (error) {
        console.error('[openAppraisalForm] Error fetching template:', error);
      }
    }
    
    // Fallback to assignment's template criteria if fetch failed
    if (criteria.length === 0 && assignment.template?.criteria) {
      criteria = assignment.template.criteria;
    }
    
    console.log('[openAppraisalForm] Final criteria:', criteria);
    
    // Update assignment with template data
    const updatedAssignment = {
      ...assignment,
      template: templateData,
    };
    
    setSelectedAssignment(updatedAssignment);
    
    // Initialize ratings based on template criteria
    const initialRatings: RatingEntry[] = criteria.map((criterion: any) => ({
      key: criterion.key,
      title: criterion.title,
      ratingValue: 0,
      ratingLabel: '',
      comments: '',
    }));
    
    console.log('[openAppraisalForm] Initial ratings:', initialRatings);
    
    // If there's an existing record, pre-fill the ratings
    if (assignment.currentRecord?.ratings) {
      assignment.currentRecord.ratings.forEach(existingRating => {
        const idx = initialRatings.findIndex(r => r.key === existingRating.key);
        if (idx !== -1) {
          initialRatings[idx] = { ...existingRating };
        }
      });
    }
    
    setAppraisalFormData({
      ratings: initialRatings,
      managerSummary: assignment.currentRecord?.managerSummary || '',
      strengths: '',
      improvementAreas: '',
    });
    setShowAppraisalForm(true);
  };

  // Close appraisal form
  const closeAppraisalForm = () => {
    setShowAppraisalForm(false);
    setSelectedAssignment(null);
    setAppraisalFormData({
      ratings: [],
      managerSummary: '',
      strengths: '',
      improvementAreas: '',
    });
  };

  // Update rating for a criterion
  const updateRating = (key: string, value: number, label?: string) => {
    setAppraisalFormData(prev => ({
      ...prev,
      ratings: prev.ratings.map(r => 
        r.key === key ? { ...r, ratingValue: value, ratingLabel: label } : r
      ),
    }));
  };

  // Update comment for a criterion
  const updateRatingComment = (key: string, comments: string) => {
    setAppraisalFormData(prev => ({
      ...prev,
      ratings: prev.ratings.map(r => 
        r.key === key ? { ...r, comments } : r
      ),
    }));
  };

  // Submit appraisal only (without publishing)
  const handleSubmitOnly = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) {
      onNotify?.('No assignment selected', 'error');
      return;
    }

    // Validate all required ratings are filled
    const requiredCriteria = selectedAssignment.template?.criteria?.filter(c => c.required) || [];
    const missingRatings = requiredCriteria.filter(c => {
      const rating = appraisalFormData.ratings.find(r => r.key === c.key);
      return !rating || rating.ratingValue === 0;
    });

    if (missingRatings.length > 0) {
      onNotify?.(`Please rate all required criteria: ${missingRatings.map(c => c.title).join(', ')}`, 'error');
      return;
    }

    try {
      // Use the assignment's manager ID, or fall back to current user's employeeId
      const managerProfile = selectedAssignment.managerProfileId as any;
      const managerId = typeof managerProfile === 'object' && managerProfile 
                        ? (managerProfile._id || managerProfile.id) 
                        : (managerProfile || employeeId);
      
      const payload = {
        assignmentId: selectedAssignment._id || selectedAssignment.id,
        managerId: managerId,
        ratings: appraisalFormData.ratings.filter(r => r.ratingValue > 0),
        managerSummary: appraisalFormData.managerSummary,
        strengths: appraisalFormData.strengths,
        improvementAreas: appraisalFormData.improvementAreas,
      };

      console.log('[handleSubmitOnly] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3000/api/performance/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('[handleSubmitOnly] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to submit this appraisal. Only the assigned manager can submit appraisals.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleSubmitOnly] Error:', errorData);
        throw new Error(errorData.message || 'Failed to submit appraisal');
      }

      const result = await response.json();
      console.log('[handleSubmitOnly] Success:', result);
      
      onNotify?.(`Appraisal submitted! Score: ${result.totalScore}% - ${result.overallRatingLabel}. Awaiting HR publication.`, 'success');
      closeAppraisalForm();
      fetchAssignments();
    } catch (error: any) {
      const message = error.message || 'Error submitting appraisal';
      onNotify?.(message, 'error');
      console.error('[handleSubmitOnly] Error:', error);
    }
  };

  // Submit and publish appraisal
  const handleSubmitAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) {
      onNotify?.('No assignment selected', 'error');
      return;
    }

    // Validate all required ratings are filled
    const requiredCriteria = selectedAssignment.template?.criteria?.filter(c => c.required) || [];
    const missingRatings = requiredCriteria.filter(c => {
      const rating = appraisalFormData.ratings.find(r => r.key === c.key);
      return !rating || rating.ratingValue === 0;
    });

    if (missingRatings.length > 0) {
      onNotify?.(`Please rate all required criteria: ${missingRatings.map(c => c.title).join(', ')}`, 'error');
      return;
    }

    try {
      const payload = {
        assignmentId: selectedAssignment._id || selectedAssignment.id,
        ratings: appraisalFormData.ratings.filter(r => r.ratingValue > 0),
        managerSummary: appraisalFormData.managerSummary,
        strengths: appraisalFormData.strengths,
        improvementAreas: appraisalFormData.improvementAreas,
      };

      console.log('[handleSubmitAndPublish] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3000/api/performance/assignments/submit-and-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('[handleSubmitAndPublish] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('Access Denied: You do not have permission to submit and publish appraisals. This action requires HR Manager role.', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleSubmitAndPublish] Error:', errorData);
        throw new Error(errorData.message || 'Failed to submit appraisal');
      }

      const result = await response.json();
      console.log('[handleSubmitAndPublish] Success:', result);
      
      onNotify?.(`Appraisal submitted and published! Score: ${result.totalScore}% - ${result.overallRatingLabel}`, 'success');
      closeAppraisalForm();
      fetchAssignments();
    } catch (error: any) {
      const message = error.message || 'Error submitting appraisal';
      onNotify?.(message, 'error');
      console.error('[handleSubmitAndPublish] Error:', error);
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
        <div className="flex gap-2">
          {isHRRole && (
            <button
              onClick={() => { setShowBulkPublishForm(!showBulkPublishForm); setShowBulkForm(false); setShowForm(false); }}
              className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Send size={16} />
              Bulk Publish
            </button>
          )}
          {canCreateAssignments && (
            <>
              <button
                onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false); setShowBulkPublishForm(false); }}
                className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Users size={16} />
                Bulk Assign
              </button>
              <button
                onClick={() => { setShowForm(!showForm); setShowBulkForm(false); setShowBulkPublishForm(false); }}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                New Assignment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Publish Bar */}
      {isHRRole && selectedAssignments.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-green-600 bg-green-900/20 p-3">
          <span className="text-sm text-green-300">
            {selectedAssignments.length} assignment(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedAssignments([])}
              className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkPublish}
              className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Send size={16} />
              Publish Selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assignment Form */}
      {showBulkForm && canCreateAssignments && (
        <form onSubmit={handleBulkSubmit} className="space-y-4 rounded-lg border border-purple-700 bg-gray-800/50 p-4">
          <h3 className="text-lg font-semibold text-purple-300">Bulk Assignment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Department *</label>
              <select
                value={bulkFormData.departmentId}
                onChange={(e) => {
                  setBulkFormData({ ...bulkFormData, departmentId: e.target.value, managerProfileId: '' });
                  setSelectedEmployees([]);
                  if (e.target.value) {
                    fetchAllDepartmentEmployees(e.target.value);
                  }
                }}
                required
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Appraising Manager *</label>
              <select
                value={bulkFormData.managerProfileId}
                onChange={(e) => {
                  setBulkFormData({ ...bulkFormData, managerProfileId: e.target.value });
                  setSelectedEmployees([]);
                }}
                required
                disabled={!bulkFormData.departmentId}
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-300"
              >
                <option value="">-- Select Manager --</option>
                {allDeptEmployees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Cycle */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Appraisal Cycle *</label>
              <select
                value={bulkFormData.cycleId}
                onChange={(e) => setBulkFormData({ ...bulkFormData, cycleId: e.target.value })}
                required
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Cycle --</option>
                {cycles.map((cycle) => (
                  <option key={cycle._id || cycle.id} value={cycle._id || cycle.id}>
                    {cycle.name} ({cycle.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Appraisal Template *</label>
              <select
                value={bulkFormData.templateId}
                onChange={(e) => setBulkFormData({ ...bulkFormData, templateId: e.target.value })}
                required
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                value={bulkFormData.dueDate}
                onChange={(e) => setBulkFormData({ ...bulkFormData, dueDate: e.target.value })}
                className="mt-1 w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Employee Selection */}
          {bulkFormData.departmentId && bulkFormData.managerProfileId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Select Employees to Assign ({selectedEmployees.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllEmployees}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllEmployees}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded border border-gray-600 bg-gray-900/50 p-2">
                {allDeptEmployees
                  .filter(e => (e._id || e.id) !== bulkFormData.managerProfileId)
                  .map((emp) => {
                    const empId = emp._id || emp.id || '';
                    const isSelected = selectedEmployees.includes(empId);
                    return (
                      <label
                        key={empId}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700/50 ${isSelected ? 'bg-purple-900/30' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEmployeeSelection(empId)}
                          className="rounded border-gray-600"
                        />
                        <span className="text-sm text-gray-200">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </label>
                    );
                  })}
                {allDeptEmployees.filter(e => (e._id || e.id) !== bulkFormData.managerProfileId).length === 0 && (
                  <p className="text-sm text-gray-500 p-2">No employees available in this department</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={selectedEmployees.length === 0}
              className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create {selectedEmployees.length} Assignment(s)
            </button>
            <button
              type="button"
              onClick={() => { setShowBulkForm(false); setSelectedEmployees([]); }}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bulk Publish Form */}
      {showBulkPublishForm && isHRRole && (
        <form onSubmit={handleBulkPublishByCycle} className="space-y-4 rounded-lg border border-green-700 bg-gray-800/50 p-4">
          <h3 className="text-lg font-semibold text-green-300">Bulk Publish Appraisals</h3>
          <p className="text-sm text-gray-400">Publish all submitted appraisals for a performance cycle at once.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cycle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Performance Cycle *</label>
              <select
                value={bulkPublishData.cycleId}
                onChange={(e) => setBulkPublishData({ ...bulkPublishData, cycleId: e.target.value })}
                required
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select Cycle --</option>
                {cycles.map((cycle) => (
                  <option key={cycle._id || cycle.id} value={cycle._id || cycle.id}>
                    {cycle.name} ({cycle.status})
                  </option>
                ))}
              </select>
              {bulkPublishData.cycleId && (
                <p className="mt-1 text-sm text-green-400">
                  {getSubmittedCountForCycle(bulkPublishData.cycleId)} submitted appraisal(s) ready to publish
                </p>
              )}
            </div>

            {/* Optional Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300">Filter by Departments (Optional)</label>
              <select
                multiple
                value={bulkPublishData.departmentIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setBulkPublishData({ ...bulkPublishData, departmentIds: selectedOptions });
                }}
                className="mt-1 w-full rounded bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
              >
                {departments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple. Leave empty to publish all.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!bulkPublishData.cycleId || getSubmittedCountForCycle(bulkPublishData.cycleId) === 0}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Send size={16} />
                Publish All Submitted
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setShowBulkPublishForm(false); setBulkPublishData({ cycleId: '', departmentIds: [] }); }}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
          assignments.map((assignment) => {
            const assignmentId = assignment._id || assignment.id || '';
            const isPublished = assignment.status === 'PUBLISHED' || assignment.status === 'HR_PUBLISHED';
            const isSubmitted = assignment.status === 'SUBMITTED' || assignment.currentRecord?.status === 'MANAGER_SUBMITTED';
            const recordId = assignment.currentRecord?.recordId || assignment.latestAppraisalId;
            const isSelected = selectedAssignments.includes(assignmentId);
            const canPublish = isHRRole && isSubmitted && recordId && !isPublished; // Show publish button only for submitted assignments with recordId
            const canFillAppraisal = canSubmitAppraisals && !isPublished && !isSubmitted && assignment.status !== 'ACKNOWLEDGED';
            const canManagerPublish = isDepartmentHead && isSubmitted && recordId;
            
            // Debug logging
            if (canPublish || canManagerPublish) {
              console.log('[Assignment Debug]', {
                assignmentId,
                status: assignment.status,
                currentRecordStatus: assignment.currentRecord?.status,
                currentRecordId: assignment.currentRecord?.recordId,
                latestAppraisalId: assignment.latestAppraisalId,
                resolvedRecordId: recordId,
              });
            }
            
            return (
              <div
                key={assignmentId}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  isSelected ? 'border-green-600 bg-green-900/20' : 'border-gray-700 bg-gray-800/30'
                }`}
              >
                {/* Checkbox for bulk publish */}
                {canPublish && (
                  <div className="mr-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAssignmentSelection(assignmentId)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(assignment.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {assignment.employeeName || assignment.employeeDetails?.firstName 
                          ? `${assignment.employeeDetails?.firstName || ''} ${assignment.employeeDetails?.lastName || ''}`.trim() || assignment.employeeName
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
                    {assignment.template?.name && (
                      <span className="text-xs text-gray-500">Template: {assignment.template.name}</span>
                    )}
                    <p className="text-xs text-gray-500">
                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                    {assignment.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {assignment.currentRecord?.totalScore !== undefined && (
                      <span className="text-xs text-blue-400 font-medium">
                        Score: {assignment.currentRecord.totalScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex gap-2">
                  {/* Fill Appraisal Button - for managers on NOT_STARTED or IN_PROGRESS */}
                  {canFillAppraisal && (
                    <button
                      onClick={() => openAppraisalForm(assignment)}
                      className="flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <FileEdit size={14} />
                      Fill Appraisal
                    </button>
                  )}
                  {/* Manager can publish their own submitted appraisal */}
                  {canManagerPublish && (
                    <button
                      onClick={() => handlePublish(recordId)}
                      className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <Send size={14} />
                      Publish
                    </button>
                  )}
                  {/* HR Publish Button */}
                  {canPublish && !canManagerPublish && (
                    <button
                      onClick={() => handlePublish(recordId)}
                      className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <Send size={14} />
                      Publish
                    </button>
                  )}
                  {isPublished && (
                    <span className="flex items-center gap-1 rounded bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400">
                      <CheckCircle size={14} />
                      Published
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Appraisal Form Modal */}
      {showAppraisalForm && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Appraisal for {selectedAssignment.employeeName || 
                    `${selectedAssignment.employeeDetails?.firstName || ''} ${selectedAssignment.employeeDetails?.lastName || ''}`.trim() ||
                    'Employee'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedAssignment.template?.name || 'Template'} • {selectedAssignment.cycleName || 'Cycle'}
                </p>
              </div>
              <button
                onClick={closeAppraisalForm}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Template Instructions */}
            {selectedAssignment.template?.instructions && (
              <div className="mb-6 rounded-lg border border-blue-600/30 bg-blue-900/20 p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Instructions</h3>
                <p className="text-sm text-gray-300">{selectedAssignment.template.instructions}</p>
              </div>
            )}

            <form onSubmit={handleSubmitAndPublish} className="space-y-6">
              {/* Rating Scale Info */}
              {selectedAssignment.template?.ratingScale && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Rating Scale</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: selectedAssignment.template.ratingScale.max }, (_, i) => i + 1).map((val) => (
                      <span key={val} className="flex items-center gap-1 text-xs text-gray-400">
                        <Star size={12} className={val <= 3 ? 'text-yellow-500' : 'text-green-500'} />
                        {val} {selectedAssignment.template?.ratingScale?.labels?.[val - 1] && `- ${selectedAssignment.template.ratingScale.labels[val - 1]}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Criteria Ratings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Evaluation Criteria</h3>
                  <span className="text-xs text-gray-400">
                    {appraisalFormData.ratings.filter(r => r.ratingValue > 0).length} / {appraisalFormData.ratings.length} rated
                  </span>
                </div>
                
                {appraisalFormData.ratings.length === 0 ? (
                  <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/20 p-4 text-center">
                    <p className="text-sm text-yellow-400">No criteria defined in the template.</p>
                    <p className="text-xs text-gray-400 mt-1">Please contact HR to set up evaluation criteria.</p>
                  </div>
                ) : (
                  appraisalFormData.ratings.map((rating, index) => {
                    const criterion = selectedAssignment.template?.criteria?.find(c => c.key === rating.key);
                    const maxRating = selectedAssignment.template?.ratingScale?.max || 5;
                    
                    return (
                      <div key={rating.key} className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
                        {/* Criterion Header - Similar to Template Form */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 rounded bg-gray-700/30 border border-gray-600">
                          <div>
                            <label className="text-xs text-gray-400">Key</label>
                            <p className="text-sm text-white font-mono">{rating.key}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Title</label>
                            <p className="text-sm text-white">{rating.title}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Weight</label>
                            <p className="text-sm text-blue-400">{criterion?.weight || 0}%</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Required</label>
                            <p className={`text-sm ${criterion?.required ? 'text-red-400' : 'text-gray-400'}`}>
                              {criterion?.required ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>

                        {/* Description if available */}
                        {(criterion?.description || criterion?.details) && (
                          <p className="text-xs text-gray-400 mb-3 italic">
                            {criterion.description || criterion.details}
                          </p>
                        )}

                        {/* Rating Selection */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-300">Your Rating:</span>
                          <span className="text-sm font-bold text-blue-400">
                            {rating.ratingValue > 0 ? `${rating.ratingValue} / ${maxRating}` : 'Not rated'}
                          </span>
                        </div>
                        
                        {/* Rating Buttons */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Array.from({ length: maxRating }, (_, i) => i + 1).map((val) => {
                            const label = selectedAssignment.template?.ratingScale?.labels?.[val - 1];
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateRating(rating.key, val, label)}
                                className={`h-10 min-w-[40px] px-2 rounded border-2 text-sm font-bold transition-all ${
                                  rating.ratingValue === val
                                    ? 'border-blue-500 bg-blue-500/30 text-blue-300'
                                    : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700/50'
                                }`}
                                title={label || `Rating ${val}`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Show selected rating label */}
                        {rating.ratingValue > 0 && selectedAssignment.template?.ratingScale?.labels?.[rating.ratingValue - 1] && (
                          <p className="text-xs text-green-400 mb-3 font-medium">
                            ✓ {selectedAssignment.template.ratingScale.labels[rating.ratingValue - 1]}
                          </p>
                        )}
                        
                        {/* Comments for this criterion */}
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Comments (optional)</label>
                          <textarea
                            value={rating.comments || ''}
                            onChange={(e) => updateRatingComment(rating.key, e.target.value)}
                            placeholder={`Add comments for ${rating.title}...`}
                            rows={2}
                            className="w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Manager Summary */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Overall Summary <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={appraisalFormData.managerSummary}
                  onChange={(e) => setAppraisalFormData(prev => ({ ...prev, managerSummary: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Provide an overall summary of the employee's performance..."
                  className="w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Strengths */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Key Strengths
                </label>
                <textarea
                  value={appraisalFormData.strengths}
                  onChange={(e) => setAppraisalFormData(prev => ({ ...prev, strengths: e.target.value }))}
                  rows={3}
                  placeholder="Highlight the employee's key strengths and achievements..."
                  className="w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Improvement Areas */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Areas for Improvement
                </label>
                <textarea
                  value={appraisalFormData.improvementAreas}
                  onChange={(e) => setAppraisalFormData(prev => ({ ...prev, improvementAreas: e.target.value }))}
                  rows={3}
                  placeholder="Suggest areas where the employee can improve..."
                  className="w-full rounded bg-gray-700/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeAppraisalForm}
                  className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOnly}
                  className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Save size={16} />
                  Submit Only
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Send size={16} />
                  Submit & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
