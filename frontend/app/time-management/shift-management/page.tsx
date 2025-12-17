"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  PauseCircle,
  Bell,
} from "lucide-react";

// Types based on backend schemas
type ShiftType = {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
};

type Shift = {
  _id: string;
  name: string;
  shiftType: ShiftType | string;
  startTime: string;
  endTime: string;
  graceInMinutes?: number;
  graceOutMinutes?: number;
  punchPolicy?: "MULTIPLE" | "FIRST_LAST" | "ONLY_FIRST";
  requiresApprovalForOvertime?: boolean;
  active: boolean;
};

type ShiftAssignment = {
  _id: string;
  shift: Shift | string;
  shiftId: string;
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "CANCELLED" | "EXPIRED";
  createdBy?: string;
  updatedBy?: string;
};

type ScheduleRule = {
  _id: string;
  name: string;
  pattern: string;
  description?: string;
  active: boolean;
};

const API_BASE_URL = "http://localhost:3000/time-management";

export default function ShiftManagement() {
  const [activeTab, setActiveTab] = useState<"assignments" | "shifts" | "types" | "rules">("assignments");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createShiftTypeDialog, setCreateShiftTypeDialog] = useState(false);
  const [createShiftDialog, setCreateShiftDialog] = useState(false);
  const [createRuleDialog, setCreateRuleDialog] = useState(false);
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for data
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [expiringAssignments, setExpiringAssignments] = useState<ShiftAssignment[]>([]);
  
  // Form state for creating shift assignment
  const [formData, setFormData] = useState({
    shiftId: "",
    assignmentType: "individual" as "individual" | "department" | "position",
    employee: "",
    department: "",
    position: "",
    startDate: "",
    endDate: "",
  });
  
  // Form state for shift type
  const [shiftTypeForm, setShiftTypeForm] = useState({
    name: "",
    description: "",
    active: true,
  });
  
  // Form state for shift
  const [shiftForm, setShiftForm] = useState({
    name: "",
    shiftTypeId: "",
    startTime: "",
    endTime: "",
    graceInMinutes: 0,
    graceOutMinutes: 0,
    punchPolicy: "FIRST_LAST" as "MULTIPLE" | "FIRST_LAST" | "ONLY_FIRST",
    requiresApprovalForOvertime: false,
    active: true,
  });
  
  // Form state for schedule rule
  const [ruleForm, setRuleForm] = useState({
    name: "",
    pattern: "",
    description: "",
    active: true,
  });
  
  // Form state for bulk assignment
  const [bulkForm, setBulkForm] = useState({
    shiftId: "",
    type: "department" as "department" | "position",
    targetId: "",
    startDate: "",
    endDate: "",
  });
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // FR-TM-04: Fetch expiring assignments
  const fetchExpiringAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-assignments/expiring-soon`, {
        credentials: 'include', // Send cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setExpiringAssignments(data || []);
      } else {
        console.error("Error fetching expiring assignments:", response.status);
        setExpiringAssignments([]);
      }
    } catch (err: any) {
      console.error("Error fetching expiring assignments:", err);
      setExpiringAssignments([]);
    }
  };

  // FR-TM-01: Fetch shift assignments
  const fetchShiftAssignments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      
      const url = `${API_BASE_URL}/shift-assignments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setShiftAssignments(data || []);
        setError(null);
      } else {
        setError("Failed to fetch shift assignments");
      }
    } catch (err: any) {
      setError("Failed to fetch shift assignments");
    } finally {
      setLoading(false);
    }
  };

  // FR-TM-02: Fetch shifts and shift types
  const fetchShifts = async () => {
    try {
      const [shiftsRes, typesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/shifts`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/shift-types`, { credentials: 'include' }),
      ]);
      
      if (shiftsRes.ok && typesRes.ok) {
        const shiftsData = await shiftsRes.json();
        const typesData = await typesRes.json();
        setShifts(shiftsData || []);
        setShiftTypes(typesData || []);
      } else {
        console.error("Error fetching shifts");
        setShifts([]);
        setShiftTypes([]);
      }
    } catch (err: any) {
      console.error("Error fetching shifts:", err);
      setShifts([]);
      setShiftTypes([]);
    }
  };

  // FR-TM-03: Fetch schedule rules
  const fetchScheduleRules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-rules`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setScheduleRules(data || []);
      } else {
        console.error("Error fetching schedule rules");
        setScheduleRules([]);
      }
    } catch (err: any) {
      console.error("Error fetching schedule rules:", err);
      setScheduleRules([]);
    }
  };

  // FR-TM-01: Create shift assignment
  const createShiftAssignment = async () => {
    try {
      const payload: any = {
        shiftId: formData.shiftId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // BR-TM-05: Assignment by dimension
      if (formData.assignmentType === "individual") {
        payload.employeeId = formData.employee;
      } else if (formData.assignmentType === "department") {
        payload.departmentId = formData.department;
      } else if (formData.assignmentType === "position") {
        payload.positionId = formData.position;
      }

      console.log('Creating shift assignment with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/shift-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setCreateDialogOpen(false);
        fetchShiftAssignments();
        resetForm();
        alert("Shift assignment created successfully!");
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(JSON.stringify(error.message || error));
      }
    } catch (err: any) {
      console.error('Error creating shift assignment:', err);
      alert("Failed to create shift assignment: " + (err.message || "Unknown error"));
    }
  };

  // BR-TM-02: Update assignment status
  const updateAssignmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-assignments/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignmentId: id, status }),
      });
      
      if (response.ok) {
        fetchShiftAssignments();
        alert(`Assignment ${status.toLowerCase()} successfully!`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update status");
      }
    } catch (err: any) {
      alert("Failed to update status");
    }
  };

  // Delete assignment
  const deleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/shift-assignments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        fetchShiftAssignments();
        alert("Assignment deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete assignment");
      }
    } catch (err: any) {
      alert("Failed to delete assignment");
    }
  };

  // FR-TM-02: Create Shift Type
  const createShiftType = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(shiftTypeForm),
      });
      
      if (response.ok) {
        setCreateShiftTypeDialog(false);
        fetchShifts();
        setShiftTypeForm({ name: "", description: "", active: true });
        alert("Shift type created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create shift type");
      }
    } catch (err: any) {
      alert("Failed to create shift type");
    }
  };

  // FR-TM-02: Toggle Shift Type Active Status
  const toggleShiftTypeActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus }),
      });
      
      if (response.ok) {
        fetchShifts();
        alert(`Shift type ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert("Failed to update shift type status");
      }
    } catch (err: any) {
      alert("Failed to update shift type status");
    }
  };

  // FR-TM-02: Delete Shift Type
  const deleteShiftType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift type?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/shift-types/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        fetchShifts();
        alert("Shift type deleted successfully!");
      } else {
        alert("Failed to delete shift type");
      }
    } catch (err: any) {
      alert("Failed to delete shift type");
    }
  };

  // FR-TM-02: Create Shift Configuration
  const createShift = async () => {
    if (!shiftForm.name || !shiftForm.shiftTypeId || !shiftForm.startTime || !shiftForm.endTime) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Validate MongoDB ObjectId format (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(shiftForm.shiftTypeId)) {
      alert("Invalid shift type selected. Please select a valid shift type.");
      return;
    }
    
    try {
      const payload = {
        name: shiftForm.name.trim(),
        shiftType: shiftForm.shiftTypeId,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        graceInMinutes: Number(shiftForm.graceInMinutes) || 0,
        graceOutMinutes: Number(shiftForm.graceOutMinutes) || 0,
        punchPolicy: shiftForm.punchPolicy,
        requiresApprovalForOvertime: shiftForm.requiresApprovalForOvertime,
        active: shiftForm.active,
      };
      
      console.log('Creating shift with payload:', payload);
      
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setCreateShiftDialog(false);
        fetchShifts();
        setShiftForm({ name: "", shiftTypeId: "", startTime: "", endTime: "", graceInMinutes: 0, graceOutMinutes: 0, punchPolicy: "FIRST_LAST", requiresApprovalForOvertime: false, active: true });
        alert("Shift created successfully!");
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(error.message || "Failed to create shift");
      }
    } catch (err: any) {
      console.error('Error creating shift:', err);
      alert("Failed to create shift: " + (err.message || "Unknown error"));
    }
  };

  // FR-TM-02: Toggle Shift Active Status
  const toggleShiftActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus }),
      });
      
      if (response.ok) {
        fetchShifts();
        alert(`Shift ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert("Failed to update shift status");
      }
    } catch (err: any) {
      alert("Failed to update shift status");
    }
  };

  // FR-TM-02: Delete Shift
  const deleteShift = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        fetchShifts();
        alert("Shift deleted successfully!");
      } else {
        alert("Failed to delete shift");
      }
    } catch (err: any) {
      alert("Failed to delete shift");
    }
  };

  // FR-TM-03: Create Schedule Rule
  const createScheduleRule = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ruleForm),
      });
      
      if (response.ok) {
        setCreateRuleDialog(false);
        fetchScheduleRules();
        setRuleForm({ name: "", pattern: "", description: "", active: true });
        alert("Schedule rule created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create schedule rule");
      }
    } catch (err: any) {
      alert("Failed to create schedule rule");
    }
  };

  // FR-TM-03: Toggle Schedule Rule Active Status
  const toggleScheduleRuleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus }),
      });
      
      if (response.ok) {
        fetchScheduleRules();
        alert(`Schedule rule ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert("Failed to update schedule rule status");
      }
    } catch (err: any) {
      alert("Failed to update schedule rule status");
    }
  };

  // FR-TM-03: Delete Schedule Rule
  const deleteScheduleRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule rule?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-rules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        fetchScheduleRules();
        alert("Schedule rule deleted successfully!");
      } else {
        alert("Failed to delete schedule rule");
      }
    } catch (err: any) {
      alert("Failed to delete schedule rule");
    }
  };

  // FR-TM-01: Bulk Assignment (Department/Position)
  const createBulkAssignment = async () => {
    try {
      const endpoint = bulkForm.type === "department" 
        ? `${API_BASE_URL}/shift-assignments/bulk/department`
        : `${API_BASE_URL}/shift-assignments/bulk/position`;
      
      const payload = bulkForm.type === "department"
        ? { shiftId: bulkForm.shiftId, departmentId: bulkForm.targetId, startDate: bulkForm.startDate, endDate: bulkForm.endDate }
        : { shiftId: bulkForm.shiftId, positionId: bulkForm.targetId, startDate: bulkForm.startDate, endDate: bulkForm.endDate };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setBulkAssignDialog(false);
        fetchShiftAssignments();
        setBulkForm({ shiftId: "", type: "department", targetId: "", startDate: "", endDate: "" });
        alert("Bulk assignment created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create bulk assignment");
      }
    } catch (err: any) {
      alert("Failed to create bulk assignment");
    }
  };

  const resetForm = () => {
    setFormData({
      shiftId: "",
      assignmentType: "individual",
      employee: "",
      department: "",
      position: "",
      startDate: "",
      endDate: "",
    });
  };

  useEffect(() => {
    fetchShiftAssignments();
    fetchShifts();
    fetchScheduleRules();
    fetchExpiringAssignments();
  }, [statusFilter]);

  // Helper to get shift type name
  const getShiftTypeName = (shift: Shift | string | null | undefined): string => {
    if (!shift || typeof shift === "string") return "Unknown";
    
    // If shiftType is populated as an object, return its name
    if (shift.shiftType && typeof shift.shiftType === "object") {
      return shift.shiftType.name || "Unknown";
    }
    
    // If shiftType is just an ID string, look it up in shiftTypes array
    if (shift.shiftType && typeof shift.shiftType === "string") {
      const type = shiftTypes.find(t => t._id === shift.shiftType);
      return type?.name || "Unknown";
    }
    
    return "Unknown";
  };

  // Helper for status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "PENDING": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "CANCELLED": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "EXPIRED": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  // Filter assignments by search
  const filteredAssignments = shiftAssignments.filter((assignment) => {
    if (!assignment) return false;
    const searchLower = searchQuery.toLowerCase();
    return (assignment.employeeId && String(assignment.employeeId).toLowerCase().includes(searchLower)) ||
           (assignment.departmentId && String(assignment.departmentId).toLowerCase().includes(searchLower)) ||
           (assignment.positionId && String(assignment.positionId).toLowerCase().includes(searchLower)) ||
           assignment.status.toLowerCase().includes(searchLower);
  });

  return (
    <DashboardLayout title="Shift Management" description="Create, assign, and manage employee shift schedules">
      <div className="text-white">
        {/* Header */}
        <div className="border-b border-neutral-800 bg-[#1a1a1a] px-8 py-6 flex justify-between">
          <div />
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded"
          >
            <Plus size={16} />
            Create Shift
          </button>
        </div>

      {/* Create Shift Assignment Dialog - FR-TM-01 */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Shift Assignment</h2>

            <div className="space-y-4">
              {/* Select Shift */}
              <div>
                <label className="block text-sm mb-2">Select Shift *</label>
                <select 
                  className="bg-[#2a2a2a] p-2 rounded w-full"
                  value={formData.shiftId}
                  onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
                >
                  <option value="">Choose a shift</option>
                  {shifts.map((shift) => (
                    <option key={shift._id} value={shift._id}>
                      {getShiftTypeName(shift)} - {shift.startTime} to {shift.endTime}
                    </option>
                  ))}
                </select>
              </div>

              {/* BR-TM-05: Assignment Type */}
              <div>
                <label className="block text-sm mb-2">Assignment Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="individual"
                      checked={formData.assignmentType === "individual"}
                      onChange={(e) => setFormData({...formData, assignmentType: e.target.value as any})}
                    />
                    Individual Employee
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="department"
                      checked={formData.assignmentType === "department"}
                      onChange={(e) => setFormData({...formData, assignmentType: e.target.value as any})}
                    />
                    Department
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="position"
                      checked={formData.assignmentType === "position"}
                      onChange={(e) => setFormData({...formData, assignmentType: e.target.value as any})}
                    />
                    Position
                  </label>
                </div>
              </div>

              {/* Dynamic fields based on assignment type */}
              {formData.assignmentType === "individual" && (
                <div>
                  <label className="block text-sm mb-2">Employee ID *</label>
                  <input
                    placeholder="Enter employee ID"
                    className="bg-[#2a2a2a] p-2 rounded w-full"
                    value={formData.employee}
                    onChange={(e) => setFormData({...formData, employee: e.target.value})}
                  />
                </div>
              )}

              {formData.assignmentType === "department" && (
                <div>
                  <label className="block text-sm mb-2">Department ID *</label>
                  <input
                    placeholder="Enter department ID"
                    className="bg-[#2a2a2a] p-2 rounded w-full"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              )}

              {formData.assignmentType === "position" && (
                <div>
                  <label className="block text-sm mb-2">Position ID *</label>
                  <input
                    placeholder="Enter position ID"
                    className="bg-[#2a2a2a] p-2 rounded w-full"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  />
                </div>
              )}

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Start Date *</label>
                  <input 
                    type="date" 
                    className="bg-[#2a2a2a] p-2 rounded w-full"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">End Date *</label>
                  <input 
                    type="date" 
                    className="bg-[#2a2a2a] p-2 rounded w-full"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-neutral-600 rounded hover:bg-[#2a2a2a]"
              >
                Cancel
              </button>
              <button
                onClick={createShiftAssignment}
                disabled={!formData.shiftId || !formData.startDate || !formData.endDate}
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shift Type Dialog */}
      {createShiftTypeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Shift Type</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name*</label>
                <input
                  type="text"
                  value={shiftTypeForm.name}
                  onChange={(e) =>
                    setShiftTypeForm({ ...shiftTypeForm, name: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  placeholder="e.g., Day Shift, Night Shift"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={shiftTypeForm.description}
                  onChange={(e) =>
                    setShiftTypeForm({
                      ...shiftTypeForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2 h-20"
                  placeholder="Description of the shift type"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shiftTypeForm.active}
                  onChange={(e) =>
                    setShiftTypeForm({
                      ...shiftTypeForm,
                      active: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCreateShiftTypeDialog(false);
                  setShiftTypeForm({ name: "", description: "", active: true });
                }}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded"
              >
                Cancel
              </button>
              <button
                onClick={createShiftType}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shift Configuration Dialog */}
      {createShiftDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Shift Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name*</label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, name: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  placeholder="e.g., Morning Shift, Evening Shift"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Shift Type*</label>
                <select
                  value={shiftForm.shiftTypeId}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, shiftTypeId: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                >
                  <option value="">Select shift type</option>
                  {shiftTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Start Time*</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, startTime: e.target.value })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Time*</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, endTime: e.target.value })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Grace In (min)</label>
                  <input
                    type="number"
                    value={shiftForm.graceInMinutes}
                    onChange={(e) =>
                      setShiftForm({
                        ...shiftForm,
                        graceInMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Grace Out (min)</label>
                  <input
                    type="number"
                    value={shiftForm.graceOutMinutes}
                    onChange={(e) =>
                      setShiftForm({
                        ...shiftForm,
                        graceOutMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Punch Policy*</label>
                <select
                  value={shiftForm.punchPolicy}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      punchPolicy: e.target.value as "MULTIPLE" | "FIRST_LAST" | "ONLY_FIRST",
                    })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                >
                  <option value="FIRST_LAST">First & Last Punch</option>
                  <option value="MULTIPLE">Multiple Punches</option>
                  <option value="ONLY_FIRST">Only First Punch</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shiftForm.requiresApprovalForOvertime}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      requiresApprovalForOvertime: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm">Requires Approval for Overtime</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCreateShiftDialog(false);
                  setShiftForm({
                    name: "",
                    shiftTypeId: "",
                    startTime: "",
                    endTime: "",
                    graceInMinutes: 0,
                    graceOutMinutes: 0,
                    punchPolicy: "FIRST_LAST",
                    requiresApprovalForOvertime: false,
                    active: true,
                  });
                }}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded"
              >
                Cancel
              </button>
              <button
                onClick={createShift}
                disabled={!shiftForm.name || !shiftForm.shiftTypeId || !shiftForm.startTime || !shiftForm.endTime}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Rule Dialog */}
      {createRuleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Schedule Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name*</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  placeholder="e.g., Weekly Rotation"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Pattern*</label>
                <select
                  value={ruleForm.pattern}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, pattern: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                >
                  <option value="">Select pattern</option>
                  <option value="flex-in-out">Flexible In/Out</option>
                  <option value="4on-3off">4 Days On, 3 Days Off</option>
                  <option value="rotational-weekly">Weekly Rotation</option>
                  <option value="fixed-schedule">Fixed Schedule</option>
                  <option value="custom">Custom Pattern</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2 h-20"
                  placeholder="Description of the schedule rule"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCreateRuleDialog(false);
                  setRuleForm({ name: "", pattern: "", description: "", active: true });
                }}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded"
              >
                Cancel
              </button>
              <button
                onClick={createScheduleRule}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assignment Dialog */}
      {bulkAssignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Bulk Shift Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Shift*</label>
                <select
                  value={bulkForm.shiftId}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, shiftId: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                >
                  <option value="">Select shift</option>
                  {shifts.map((shift) => (
                    <option key={shift._id} value={shift._id}>
                      {typeof shift.shiftType === "string" ? "Unknown" : shift.shiftType?.name || "Unknown"} - {shift.startTime} to{" "}
                      {shift.endTime}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Assignment Type*</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="department"
                      checked={bulkForm.type === "department"}
                      onChange={(e) =>
                        setBulkForm({ ...bulkForm, type: e.target.value as "department" | "position", targetId: "" })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Department</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="position"
                      checked={bulkForm.type === "position"}
                      onChange={(e) =>
                        setBulkForm({ ...bulkForm, type: e.target.value as "department" | "position", targetId: "" })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Position</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">
                  {bulkForm.type === "department" ? "Department" : "Position"} ID*
                </label>
                <input
                  type="text"
                  value={bulkForm.targetId}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, targetId: e.target.value })
                  }
                  className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  placeholder={`Enter ${bulkForm.type} ID`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Start Date*</label>
                  <input
                    type="date"
                    value={bulkForm.startDate}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, startDate: e.target.value })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Date*</label>
                  <input
                    type="date"
                    value={bulkForm.endDate}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, endDate: e.target.value })
                    }
                    className="w-full bg-[#2a2a2a] rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setBulkAssignDialog(false);
                  setBulkForm({
                    shiftId: "",
                    type: "department",
                    targetId: "",
                    startDate: "",
                    endDate: "",
                  });
                }}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded"
              >
                Cancel
              </button>
              <button
                onClick={createBulkAssignment}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-8">
        <div className="flex gap-4 mb-6">
          {(["assignments", "shifts", "types", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded capitalize ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              }`}
            >
              {tab === "types" ? "Shift Types" : tab === "rules" ? "Schedule Rules" : tab}
            </button>
          ))}
        </div>

        {/* FR-TM-01: Shift Assignments Tab */}
        {activeTab === "assignments" && (
          <>
            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setBulkAssignDialog(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded flex items-center gap-2"
              >
                <Users size={18} />
                Bulk Assign
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input
                  placeholder="Search assignments..."
                  className="w-full pl-10 bg-[#1a1a1a] p-2 rounded"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2 bg-[#1a1a1a] border border-neutral-700 rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {/* FR-TM-04: Expiry Notifications */}
            {expiringAssignments.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Bell className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-orange-400 text-sm font-medium">
                      {expiringAssignments.length} shift assignment(s) expiring soon
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Review and extend assignments to avoid coverage gaps
                    </p>
                  </div>
                </div>
                <div className="space-y-2 ml-8">
                  {expiringAssignments.slice(0, 5).map((assignment) => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(assignment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={assignment._id}
                        className="bg-[#1f1f1f] border border-orange-500/30 p-3 rounded flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Shift Assignment
                          </p>
                          <p className="text-xs text-neutral-400">
                            {assignment.employeeId && `Employee: ${typeof assignment.employeeId === 'string' ? assignment.employeeId : `${(assignment.employeeId as any).firstName || ''} ${(assignment.employeeId as any).lastName || ''}`.trim() || (assignment.employeeId as any)._id || 'Unknown'}`}
                            {assignment.departmentId && ` • Department: ${typeof assignment.departmentId === 'string' ? assignment.departmentId : (assignment.departmentId as any).name || (assignment.departmentId as any)._id || 'Unknown'}`}
                            {assignment.positionId && ` • Position: ${typeof assignment.positionId === 'string' ? assignment.positionId : (assignment.positionId as any).title || (assignment.positionId as any)._id || 'Unknown'}`}
                            {" • "}
                            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // TODO: Implement renewal functionality
                              alert("Renewal feature coming soon");
                            }}
                            className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => updateAssignmentStatus(assignment._id, "CANCELLED")}
                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {expiringAssignments.length > 5 && (
                    <button 
                      onClick={() => setStatusFilter("APPROVED")}
                      className="w-full px-3 py-2 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30"
                    >
                      View All {expiringAssignments.length} Expiring Assignments
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                Loading assignments...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p>No shift assignments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const shift = typeof assignment.shift === "string" ? null : assignment.shift;
                  return (
                    <div
                      key={assignment._id}
                      className="bg-[#1f1f1f] border border-neutral-800 p-6 rounded hover:border-neutral-700"
                    >
                      <div className="flex justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400">
                            {assignment.employeeId && `Employee: ${typeof assignment.employeeId === 'string' ? assignment.employeeId : `${(assignment.employeeId as any).firstName || ''} ${(assignment.employeeId as any).lastName || ''}`.trim() || (assignment.employeeId as any)._id || 'Unknown'}`}
                            {assignment.departmentId && ` • Department: ${typeof assignment.departmentId === 'string' ? assignment.departmentId : (assignment.departmentId as any).name || (assignment.departmentId as any)._id || 'Unknown'}`}
                            {assignment.positionId && ` • Position: ${typeof assignment.positionId === 'string' ? assignment.positionId : (assignment.positionId as any).title || (assignment.positionId as any)._id || 'Unknown'}`}
                          </p>
                        </div>
                        
                        {/* BR-TM-02: Status Transition Actions */}
                        <div className="flex gap-2">
                          {assignment.status === "PENDING" && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment._id, "APPROVED")}
                              className="p-2 hover:bg-green-500/10 rounded"
                              title="Approve"
                            >
                              <CheckCircle size={18} className="text-green-400" />
                            </button>
                          )}
                          {(assignment.status === "PENDING" || assignment.status === "APPROVED") && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment._id, "CANCELLED")}
                              className="p-2 hover:bg-gray-500/10 rounded"
                              title="Cancel"
                            >
                              <PauseCircle size={18} className="text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAssignment(assignment._id)}
                            className="p-2 hover:bg-red-500/10 rounded"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500">Time</div>
                            <div>{shift ? `${shift.startTime} - ${shift.endTime}` : "N/A"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500">Start Date</div>
                            <div>{new Date(assignment.startDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500">End Date</div>
                            <div>{new Date(assignment.endDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* FR-TM-02: Shifts Tab */}
        {activeTab === "shifts" && (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setCreateShiftDialog(true)}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded flex items-center gap-2"
              >
                <Plus size={18} />
                Create Shift Configuration
              </button>
            </div>
            <div className="space-y-4">
              {shifts.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <p>No shifts configured</p>
                </div>
              ) : (
              shifts.map((shift) => (
                <div
                  key={shift._id}
                  className="bg-[#1f1f1f] border border-neutral-800 p-6 rounded"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{shift.name || "Unnamed Shift"}</h3>
                      <div className="text-sm text-neutral-400 mt-1 space-y-0.5">
                        <p>
                          Type: {(() => {
                            if (!shift.shiftType) return "No Type";
                            if (typeof shift.shiftType === "object") return shift.shiftType.name;
                            const type = shiftTypes.find(t => t._id === shift.shiftType);
                            return type?.name || "Unknown Type";
                          })()}
                        </p>
                        <p>
                          Hours: {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-xs">
                          Punch Policy: {shift.punchPolicy || "N/A"} 
                          {shift.requiresApprovalForOvertime && " • Requires Overtime Approval"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShiftActive(shift._id, shift.active)}
                        className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${shift.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}
                        title={shift.active ? "Click to deactivate" : "Click to activate"}
                      >
                        {shift.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => deleteShift(shift._id)}
                        className="p-1.5 hover:bg-red-500/10 rounded"
                        title="Delete Shift"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {(shift.graceInMinutes || shift.graceOutMinutes) && (
                    <p className="text-xs text-neutral-500">
                      Grace Period: {shift.graceInMinutes || 0}min in, {shift.graceOutMinutes || 0}min out
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
          </>
        )}

        {/* FR-TM-02: Shift Types Tab */}
        {activeTab === "types" && (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setCreateShiftTypeDialog(true)}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded flex items-center gap-2"
              >
                <Plus size={18} />
                Create Shift Type
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {shiftTypes.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-neutral-400">
                  <p>No shift types configured</p>
                </div>
              ) : (
              shiftTypes.map((type) => (
                <div
                  key={type._id}
                  className="bg-[#1f1f1f] border border-neutral-800 p-6 rounded hover:border-neutral-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{type.name}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShiftTypeActive(type._id, type.active)}
                        className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${type.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}
                        title={type.active ? "Click to deactivate" : "Click to activate"}
                      >
                        {type.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => deleteShiftType(type._id)}
                        className="p-1.5 hover:bg-red-500/10 rounded"
                        title="Delete Type"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {type.description && (
                    <p className="text-sm text-neutral-400">{type.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
          </>
        )}

        {/* FR-TM-03: Schedule Rules Tab */}
        {activeTab === "rules" && (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setCreateRuleDialog(true)}
                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded flex items-center gap-2"
              >
                <Plus size={18} />
                Create Schedule Rule
              </button>
            </div>
            <div className="space-y-4">
              {scheduleRules.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <p>No schedule rules configured</p>
                </div>
              ) : (
              scheduleRules.map((rule) => (
                <div
                  key={rule._id}
                  className="bg-[#1f1f1f] border border-neutral-800 p-6 rounded"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-neutral-400 mt-1">Pattern: {rule.pattern}</p>
                      {rule.description && (
                        <p className="text-sm text-neutral-500 mt-2">{rule.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleScheduleRuleActive(rule._id, rule.active)}
                        className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${rule.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}
                        title={rule.active ? "Click to deactivate" : "Click to activate"}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => deleteScheduleRule(rule._id)}
                        className="p-1.5 hover:bg-red-500/10 rounded"
                        title="Delete Rule"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
