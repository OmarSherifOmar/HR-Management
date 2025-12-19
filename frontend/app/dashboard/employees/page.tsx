'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeListView from '../../components/EmployeeProfile/EmployeeListView';
import EmployeeStats from '../../components/EmployeeProfile/EmployeeStats';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function EmployeesPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    suspendedEmployees: 0,
  });

  useEffect(() => {
    // Fetch employee statistics
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/employees/stats');
        
        if (response.status === 403) {
          console.error('Access Denied: You do not have permission to view employee statistics.');
          alert('Access Denied: You do not have permission to view employee statistics. Please contact your administrator.');
          return;
        }
        
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout
      title="Employees"
      description="Manage all employee profiles and information"
    >
      {/* Header with Action Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Employee Directory</h2>
          <p className="text-gray-400">View and manage all employees in your organization</p>
        </div>
        <Link
          href="/dashboard/employees/add"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Employee
        </Link>
      </div>

      {/* Statistics */}
      <div className="mb-8">
        <EmployeeStats
          totalEmployees={stats.totalEmployees}
          activeEmployees={stats.activeEmployees}
          onLeaveEmployees={stats.onLeaveEmployees}
          suspendedEmployees={stats.suspendedEmployees}
        />
      </div>

      {/* Employee List */}
      <EmployeeListView viewType="grid" />
    </DashboardLayout>
  );
}
