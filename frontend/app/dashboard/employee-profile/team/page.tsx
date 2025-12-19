'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { ManagerTeamView } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function TeamManagementPage() {
  const { canViewTeamMembers } = useCanAccess();

  return (
    <DashboardLayout
      title="Team Management"
      description="View and manage your team members"
    >
      <RoleBasedAccess requiredAccess={canViewTeamMembers}>
        <ManagerTeamView />
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
