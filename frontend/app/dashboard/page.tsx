'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCanAccess } from '../hooks/useRole';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { 
  FileInput,
  UserPlus,
  Banknote,
  TrendingUp,
  User,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  SelfServiceContactInfo,
  SelfServiceProfilePicture,
  SelfServiceChangeRequests,
  ManagerTeamView,
  HREmployeeManagement,
  HRChangeRequestReview,
  CandidateManagement,
} from '../components/EmployeeProfile';

export default function DashboardPage() {
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
      <DashboardLayout title="Dashboard" description={`Welcome back, ${user?.name || 'User'}!`}>
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
    menuItems.push({ id: 'candidates', label: 'Candidates' });
  }
  if (canListChangeRequests()) {
    menuItems.push({ id: 'review-requests', label: 'Review Requests' });
  }

  // Set default active view to first available menu item if not set
  const currentActiveView = activeView || (menuItems.length > 0 ? menuItems[0].id : null);

  return (
    <DashboardLayout 
      title="Dashboard" 
      description={`Welcome back, ${user?.name || 'User'}!`}
    >
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
                      currentActiveView === item.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {item.label}
                    {currentActiveView === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        ) : null}

        {/* Content Area */}
        <div className={menuItems.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {!currentActiveView && menuItems.length === 0 ? (
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
          ) : (
            <>
              {/* My Profile View */}
              {currentActiveView === 'profile' && canAccess && (
                <div className="space-y-4">
                  <SelfServiceContactInfo />
                  <SelfServiceProfilePicture />
                  <SelfServiceChangeRequests />
                </div>
              )}

              {/* My Team View */}
              {currentActiveView === 'team' && canAccessTeam && (
                <div>
                  <ManagerTeamView />
                </div>
              )}

              {/* View All Employees */}
              {currentActiveView === 'employees' && canSearchEmployees() && (
                <div>
                  <HREmployeeManagement />
                </div>
              )}

              {/* Candidates */}
              {currentActiveView === 'candidates' && canSearchEmployees() && (
                <div>
                  <CandidateManagement />
                </div>
              )}

              {/* Review Requests */}
              {currentActiveView === 'review-requests' && canListChangeRequests() && (
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
