'use client';

import { useState, useEffect } from 'react';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import {
  Search,
  AlertCircle,
  Loader,
  ChevronRight,
  Edit2,
  Lock,
  Trash2,
} from 'lucide-react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  workEmail: string;
  primaryPositionId?: {
    title: string;
  };
  primaryDepartmentId?: {
    name: string;
  };
  status: string;
}

export default function HREmployeeSearch() {
  const { canSearchEmployees, canEditEmployee, canDeactivateEmployee, canAssignRoles } = useCanAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Auto-trigger search when filters change
  const performSearch = async (query: string, dept: string, status: string) => {
    if (!query && !dept && !status) {
      setEmployees([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (dept) params.append('departmentId', dept);
      if (status) params.append('status', status);

      const response = await fetch(
        `http://localhost:3000/employees/searchs?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search employees');
      }

      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Update search when any filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, filterDept, filterStatus);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timer);
  }, [searchQuery, filterDept, filterStatus]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, filterDept, filterStatus);
  };

  return (
    <RoleBasedAccess requiredAccess={canSearchEmployees}>
      <div className="space-y-6">
        {/* Search Form */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Search Employees</h3>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Name or Email
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  placeholder="Department ID"
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-blue-400 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400">
                {searchQuery ? 'No employees found' : 'Search to see results'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {employees.map((emp) => (
                    <tr
                      key={emp._id}
                      className="hover:bg-[#333333] transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {emp.workEmail}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {emp.primaryPositionId?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {emp.primaryDepartmentId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canEditEmployee() && (
                            <button
                              title="Edit"
                              className="p-2 text-blue-400 hover:bg-[#333333] rounded transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canAssignRoles() && (
                            <button
                              title="Assign Roles"
                              className="p-2 text-purple-400 hover:bg-[#333333] rounded transition-colors"
                            >
                              <Lock size={16} />
                            </button>
                          )}
                          {canDeactivateEmployee() && (
                            <button
                              title="Deactivate"
                              className="p-2 text-red-400 hover:bg-[#333333] rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:bg-[#333333] rounded transition-colors">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleBasedAccess>
  );
}
