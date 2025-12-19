'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import AddEmployeeForm from '../../../components/EmployeeProfile/AddEmployeeForm';

export default function AddEmployeePage() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Add Employee"
      description="Create a new employee profile"
    >
      <AddEmployeeForm
        onCancel={() => router.back()}
      />
    </DashboardLayout>
  );
}
