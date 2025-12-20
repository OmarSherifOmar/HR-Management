'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import EmployeeCard from './EmployeeCard';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  jobTitle?: string;
  department?: string;
  profilePictureUrl?: string;
  status?: string;
}

interface EmployeeListViewProps {
  viewType?: 'grid' | 'list';
}

export default function EmployeeListView({ viewType = 'grid' }: EmployeeListViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Fetch employees from API
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        
        if (response.status === 403) {
          console.error('Access Denied: You do not have permission to view employee list.');
          alert('Access Denied: You do not have permission to view employee list. Please contact your administrator.');
          setLoading(false);
          return;
        }
        
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        
        const data = await response.json();
        setEmployees(data);
        setFilteredEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Filter and sort employees
  useEffect(() => {
    let filtered = employees.filter((emp) => {
      const matchesSearch =
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
      const matchesStatus = !statusFilter || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'name') {
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      } else if (sortBy === 'department') {
        compareValue = (a.department || '').localeCompare(b.department || '');
      } else if (sortBy === 'status') {
        compareValue = (a.status || '').localeCompare(b.status || '');
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter, statusFilter, sortBy, sortOrder]);

  const departments = Array.from(new Set(employees.map((emp) => emp.department).filter(Boolean)));
  const statuses = Array.from(new Set(employees.map((emp) => emp.status).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white rounded px-10 py-3 border border-[#333333] focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Filter by Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Sort by</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-[#1a1a1a] rounded border border-[#333333] hover:bg-[#333333] transition-colors text-gray-400"
              >
                {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Employee List/Grid */}
      {filteredEmployees.length > 0 ? (
        <div
          className={
            viewType === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              id={employee.id}
              firstName={employee.firstName}
              lastName={employee.lastName}
              email={employee.email}
              phone={employee.phone}
              address={employee.address}
              jobTitle={employee.jobTitle}
              department={employee.department}
              profilePictureUrl={employee.profilePictureUrl}
              status={employee.status}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#2a2a2a] rounded-lg">
          <p className="text-gray-400">No employees found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
