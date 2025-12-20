'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { SelfServiceChangeRequests } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function ChangeRequestsPage() {
  const { canRequestDataCorrection } = useCanAccess();

  return (
    <DashboardLayout
      title="Data Change Requests"
      description="Submit requests to correct your personal information"
    >
      <RoleBasedAccess requiredAccess={canRequestDataCorrection}>
        <div className="max-w-4xl">
          <SelfServiceChangeRequests />
        </div>
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
