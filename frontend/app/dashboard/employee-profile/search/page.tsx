'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { HREmployeeSearch } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function EmployeeSearchPage() {
  const { canSearchEmployees } = useCanAccess();

  return (
    <DashboardLayout
      title="Employee Search & Management"
      description="Search and manage employee profiles"
    >
      <RoleBasedAccess requiredAccess={canSearchEmployees}>
        <HREmployeeSearch />
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
