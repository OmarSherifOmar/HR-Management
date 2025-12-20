'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import EmployeeDetailView from '@/app/components/EmployeeProfile/EmployeeDetailView';
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
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
  managerId?: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        
        if (response.status === 403) {
          console.error('Access Denied: You do not have permission to view this employee profile.');
          alert('Access Denied: You do not have permission to view this employee profile. Please contact your administrator.');
          setLoading(false);
          return;
        }
        
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        
        const data = await response.json();
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <DashboardLayout
        title="Employee Profile"
        description="Loading..."
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading employee details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout
        title="Employee Profile"
        description="Not found"
      >
        <div className="text-center py-12 bg-[#2a2a2a] rounded-lg">
          <p className="text-gray-400">Employee not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Employee Profile"
      description={`${employee.firstName} ${employee.lastName}`}
    >
      <EmployeeDetailView employee={employee} />
    </DashboardLayout>
  );
}
