'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCanAccess } from '../../hooks/useRole';
import DashboardLayout from '../../components/DashboardLayout';
import {
  SelfServiceContactInfo,
  SelfServiceProfilePicture,
  SelfServiceChangeRequests,
  ManagerTeamView,
  HREmployeeManagement,
  HRChangeRequestReview,
} from '../../components/EmployeeProfile';

import { AlertCircle, ChevronRight } from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user, isLoading } = useAuth();
  const {
    canViewMyProfile,
    canViewTeamMembers,
    canSearchEmployees,
    canListChangeRequests,
  } = useCanAccess();
  const [activeView, setActiveView] = useState<string | null>(null);

  if (isLoading) {
    return (
      <DashboardLayout title="Employee Profile" description="Manage your profile">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const canAccess = canViewMyProfile();
  const canAccessTeam = canViewTeamMembers();
  const canAccessHR = canSearchEmployees() || canListChangeRequests();

  // Define menu items based on permissions
  const menuItems = [];
  
  if (canAccess) {
    menuItems.push({ id: 'profile', label: 'My Profile' });
  }
  if (canAccessTeam) {
    menuItems.push({ id: 'team', label: 'My Team' });
  }
  if (canSearchEmployees()) {
    menuItems.push({ id: 'employees', label: 'View All' });
  }
  if (canListChangeRequests()) {
    menuItems.push({ id: 'review-requests', label: 'Review Requests' });
  }

  return (
    <DashboardLayout title="Employee Profile" description="Manage your profile and team">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu Sidebar */}
        {menuItems.length > 0 ? (
          <div className="lg:col-span-1">
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700 sticky top-20">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2">EMPLOYEES</h3>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {item.label}
                    {activeView === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        ) : null}

        {/* Content Area */}
        <div className={menuItems.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {!activeView && menuItems.length === 0 ? (
            <div className="p-6 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-start gap-4">
              <AlertCircle size={24} className="text-yellow-500 mt-1" />
              <div>
                <h3 className="text-yellow-200 font-semibold mb-1">
                  No Features Available
                </h3>
                <p className="text-yellow-200 text-sm">
                  Your current role doesn't have access to any employee profile features.
                  Contact your administrator for more information.
                </p>
              </div>
            </div>
          ) : !activeView ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Select an option from the menu to get started</p>
            </div>
          ) : (
            <>
              {/* My Profile View */}
              {activeView === 'profile' && canAccess && (
                <div className="space-y-4">
                  <SelfServiceContactInfo />
                  <SelfServiceProfilePicture />
                  <SelfServiceChangeRequests />
                </div>
              )}

              {/* My Team View */}
              {activeView === 'team' && canAccessTeam && (
                <div>
                  <ManagerTeamView />
                </div>
              )}

              {/* View All Employees */}
              {activeView === 'employees' && canSearchEmployees() && (
                <div>
                  <HREmployeeManagement />
                </div>
              )}

              {/* Review Requests */}
              {activeView === 'review-requests' && canListChangeRequests() && (
                <div>
                  <HRChangeRequestReview />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
