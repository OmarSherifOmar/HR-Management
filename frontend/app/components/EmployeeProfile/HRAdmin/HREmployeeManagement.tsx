'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Search, Edit, Eye, CheckCircle, X, Shield, Plus } from 'lucide-react';
import CreateEmployeeModal from './CreateEmployeeModal';

// Roles matching backend SystemRole enum values
const AVAILABLE_ROLES = [
  'department employee',
  'department head',
  'HR Manager',
  'HR Employee',
  'Payroll Specialist',
  'System Admin',
  'Legal & Policy Admin',
  'Recruiter',
  'Finance Staff',
  'Job Candidate',
  'HR Admin',
  'Payroll Manager',
];

const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Employee {
  _id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  personalEmail?: string;
  mobilePhone: string;
  homePhone?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  nationalId?: string;
  workEmail?: string;
  biography?: string;
  status: string;
  roles?: string[];
  address?: {
    streetAddress?: string;
    city?: string;
    country?: string;
  };
}

interface EditModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface AssignRolesModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (roles: string[]) => void;
}

function EditEmployeeModal({ employee, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    middleName: employee.middleName || '',
    personalEmail: employee.personalEmail || employee.email || '',
    workEmail: employee.workEmail || '',
    mobilePhone: employee.mobilePhone || '',
    homePhone: employee.homePhone || '',
    gender: employee.gender || '',
    maritalStatus: employee.maritalStatus || '',
    dateOfBirth: employee.dateOfBirth || '',
    nationalId: employee.nationalId || '',
    biography: employee.biography || '',
    address: {
      streetAddress: employee.address?.streetAddress || '',
      city: employee.address?.city || '',
      country: employee.address?.country || '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Employee</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">National ID</label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Personal Email</label>
              <input
                type="email"
                value={formData.personalEmail}
                onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Work Email</label>
              <input
                type="email"
                value={formData.workEmail}
                onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={formData.mobilePhone}
                onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Home Phone</label>
              <input
                type="tel"
                value={formData.homePhone}
                onChange={(e) => setFormData({ ...formData, homePhone: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Marital Status</label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address.streetAddress}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, streetAddress: e.target.value } })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Biography</label>
            <textarea
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignRolesModal({ employee, onClose, onSave }: AssignRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(employee.roles || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      alert('Please select at least one role');
      return;
    }
    setIsLoading(true);
    try {
      await onSave(selectedRoles);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">
          Assign Roles - {employee.firstName} {employee.lastName}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {AVAILABLE_ROLES.map((role: string) => (
              <label key={role} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded cursor-pointer hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-white text-sm">{role}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Saving...' : 'Assign Roles'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HREmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [assigningRolesEmployee, setAssigningRolesEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async (search?: string) => {
    setIsLoading(true);
    setError('');
    try {
      const query = search ? `?query=${encodeURIComponent(search)}` : '';
      const url = `${backend_url}/employees/searchs${query}`;
      console.log('[HREmployeeManagement] Fetching from:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('[HREmployeeManagement] Response status:', response.status);

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('You do not have permission to search employees. Only HR_ADMIN role can access this.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('[HREmployeeManagement] Employees fetched:', data);
        setEmployees(Array.isArray(data) ? data : data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[HREmployeeManagement] Error response:', errorData);
        setError(`Failed to fetch employees: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('[HREmployeeManagement] Error fetching employees:', err);
      setError(`Error fetching employees: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(searchTerm);
  };

  const handleViewEmployee = async (id: string) => {
    try {
      const response = await fetch(`${backend_url}/employees/${id}`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        setError('You do not have permission to view employee details.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSelectedEmployee(data);
      } else {
        setError('Failed to fetch employee details');
      }
    } catch (err) {
      setError('Failed to fetch employee details');
      console.error(err);
    }
  };

  const handleEditEmployee = async (formData: any) => {
    if (!editingEmployee) return;

    try {
      const response = await fetch(`${backend_url}/employees/${editingEmployee._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        setError('You do not have permission to edit employees');
        return;
      }

      if (response.ok) {
        setSuccess('Employee updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchEmployees(searchTerm);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update employee');
      }
    } catch (err) {
      setError(`Error updating employee: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    }
  };

  const handleChangeEmployeeStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`${backend_url}/employees/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 403) {
        setError('You do not have permission to change employee status');
        return;
      }

      if (response.ok) {
        setSuccess(`Employee status changed to ${newStatus} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        setStatusChangeEmployee(null);
        setSelectedStatus('');
        fetchEmployees(searchTerm);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to change employee status');
      }
    } catch (err) {
      setError(`Error changing employee status: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    }
  };

  const handleAssignRoles = async (roles: string[]) => {
    if (!assigningRolesEmployee) return;

    try {
      const response = await fetch(`${backend_url}/employees/${assigningRolesEmployee._id}/roles`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });

      if (response.status === 403) {
        setError('You do not have permission to assign roles');
        return;
      }

      if (response.ok) {
        setSuccess('Roles assigned successfully');
        setTimeout(() => setSuccess(''), 3000);
        setAssigningRolesEmployee(null);
        fetchEmployees(searchTerm);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to assign roles');
      }
    } catch (err) {
      setError(`Error assigning roles: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Search size={18} />
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              fetchEmployees();
            }}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
          >
            View All
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Create Employee
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="text-green-500 mt-0.5" />
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
        {isLoading && !employees.length ? (
          <div className="p-8 text-center text-gray-400">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {emp.workEmail || emp.personalEmail || emp.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{emp.mobilePhone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-900/20 text-green-200'
                            : emp.status === 'ON_LEAVE'
                            ? 'bg-yellow-900/20 text-yellow-200'
                            : emp.status === 'SUSPENDED'
                            ? 'bg-orange-900/20 text-orange-200'
                            : emp.status === 'RETIRED'
                            ? 'bg-gray-900/20 text-gray-200'
                            : 'bg-gray-900/20 text-gray-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewEmployee(emp._id)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setAssigningRolesEmployee(emp)}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                          title="Assign Roles"
                        >
                          <Shield size={16} />
                        </button>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setStatusChangeEmployee(emp);
                              setSelectedStatus(e.target.value);
                              handleChangeEmployeeStatus(emp._id, e.target.value);
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors cursor-pointer"
                          title="Change Status"
                        >
                          <option value="">Change Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="RETIRED">Retired</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleEditEmployee}
        />
      )}

      {/* Assign Roles Modal */}
      {assigningRolesEmployee && (
        <AssignRolesModal
          employee={assigningRolesEmployee}
          onClose={() => setAssigningRolesEmployee(null)}
          onSave={handleAssignRoles}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-6 text-sm">
              {/* Personal Information */}
              <div>
                <h4 className="text-gray-300 font-semibold mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400">Employee Number:</label>
                    <p className="text-white">{selectedEmployee.employeeNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">First Name:</label>
                    <p className="text-white">{selectedEmployee.firstName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Last Name:</label>
                    <p className="text-white">{selectedEmployee.lastName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Middle Name:</label>
                    <p className="text-white">{selectedEmployee.middleName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">National ID:</label>
                    <p className="text-white">{selectedEmployee.nationalId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Gender:</label>
                    <p className="text-white">{selectedEmployee.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Marital Status:</label>
                    <p className="text-white">{selectedEmployee.maritalStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Date of Birth:</label>
                    <p className="text-white">{selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-gray-300 font-semibold mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400">Personal Email:</label>
                    <p className="text-white">{selectedEmployee.personalEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Work Email:</label>
                    <p className="text-white">{selectedEmployee.workEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Mobile Phone:</label>
                    <p className="text-white">{selectedEmployee.mobilePhone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Home Phone:</label>
                    <p className="text-white">{selectedEmployee.homePhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedEmployee.address && (
                <div>
                  <h4 className="text-gray-300 font-semibold mb-3">Address</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400">Street Address:</label>
                      <p className="text-white">{selectedEmployee.address.streetAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-400">City:</label>
                      <p className="text-white">{selectedEmployee.address.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-400">Country:</label>
                      <p className="text-white">{selectedEmployee.address.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Biography */}
              {selectedEmployee.biography && (
                <div>
                  <h4 className="text-gray-300 font-semibold mb-3">Biography</h4>
                  <p className="text-white">{selectedEmployee.biography}</p>
                </div>
              )}

              {/* Assigned Roles */}
              {selectedEmployee.roles && selectedEmployee.roles.length > 0 && (
                <div>
                  <h4 className="text-gray-300 font-semibold mb-3">Assigned Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-gray-400">Status:</label>
                <p className="text-white">{selectedEmployee.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={() => {
          setSuccess('Employee created successfully');
          setTimeout(() => setSuccess(''), 3000);
          fetchEmployees();
        }}
      />
    </div>
  );
}
