'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { HRChangeRequestReview } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function ChangeRequestReviewPage() {
  const { canListChangeRequests } = useCanAccess();

  return (
    <DashboardLayout
      title="Data Change Request Review"
      description="Review and approve/reject employee data change requests"
    >
      <RoleBasedAccess requiredAccess={canListChangeRequests}>
        <HRChangeRequestReview />
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
