'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { SelfServiceContactInfo } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function MyContactPage() {
  const { canUpdateMyContact } = useCanAccess();

  return (
    <DashboardLayout
      title="Contact Information"
      description="Update your phone number, address, and personal email"
    >
      <RoleBasedAccess requiredAccess={canUpdateMyContact}>
        <div className="max-w-2xl">
          <SelfServiceContactInfo />
        </div>
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
