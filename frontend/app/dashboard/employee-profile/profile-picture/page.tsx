'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { SelfServiceProfilePicture } from '../../../components/EmployeeProfile';
import { RoleBasedAccess } from '../../../components/Auth/RoleBasedAccess';
import { useCanAccess } from '../../../hooks/useRole';

export default function ProfilePicturePage() {
  const { canUploadProfilePicture } = useCanAccess();

  return (
    <DashboardLayout
      title="Profile Picture"
      description="Upload and manage your profile picture"
    >
      <RoleBasedAccess requiredAccess={canUploadProfilePicture}>
        <div className="max-w-2xl">
          <SelfServiceProfilePicture />
        </div>
      </RoleBasedAccess>
    </DashboardLayout>
  );
}
