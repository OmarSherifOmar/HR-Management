'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  Bell
} from 'lucide-react';

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  subItems?: { name: string; href: string }[];
};

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleMenuEnter = (menuName: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setHoveredMenu(menuName);
  };

  const handleMenuLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredMenu(null);
    }, 100);
    setCloseTimeout(timeout);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/dashboard',
    },
    {
      name: 'Employees',
      icon: <Users size={20} />,
      subItems: [
        { name: 'View All', href: '/dashboard/employees' },
        { name: 'Add New', href: '/dashboard/employees/add' },
        { name: 'Departments', href: '/dashboard/employees/departments' },
        { name: 'Positions', href: '/dashboard/employees/positions' },
      ],
    },
    {
      name: 'Organization',
      icon: <Building2 size={20} />,
      subItems: [
        { name: 'Structure', href: '/dashboard/organization' },
        { name: 'Departments', href: '/dashboard/organization/departments' },
        { name: 'Hierarchy', href: '/dashboard/organization/hierarchy' },
      ],
    },
    {
      name: 'Leaves',
      icon: <Calendar size={20} />,
      subItems: [
        { name: 'Requests', href: '/leaves' },
        { name: 'Approvals', href: '/dashboard/leaves/approvals' },
        { name: 'My Balance', href: '/leaves/balance' },
        ...(user?.role === 'HR Admin' ? [
          { name: 'Admin: Policies', href: '/dashboard/admin/policies' },
          { name: 'Admin: Leave Types', href: '/dashboard/admin/leave-types' },
          { name: 'Admin: Eligibility Rules', href: '/dashboard/admin/eligibility' },
          { name: 'Admin: Calendar & Blocked Days', href: '/dashboard/admin/calendar' },
          { name: 'Admin: Settings', href: '/dashboard/admin/settings' },
          { name: 'Admin: Entitlements', href: '/dashboard/admin/entitlements' },
        ] : []),
      ],
    },
    {
      name: 'Payroll',
      icon: <DollarSign size={20} />,
      subItems: [
        { name: 'Run Payroll', href: '/dashboard/payroll' },
        { name: 'Configuration', href: '/dashboard/payroll/configuration' },
        { name: 'History', href: '/dashboard/payroll/history' },
        { name: 'Reports', href: '/dashboard/payroll/reports' },
      ],
    },
    {
      name: 'Performance',
      icon: <TrendingUp size={20} />,
      subItems: [
        { name: 'Reviews', href: '/dashboard/performance' },
        { name: 'Goals', href: '/dashboard/performance/goals' },
        { name: 'Feedback', href: '/dashboard/performance/feedback' },
      ],
    },
    {
      name: 'Recruitment',
      icon: <Target size={20} />,
      subItems: [
        { name: 'Job Postings', href: '/dashboard/recruitment' },
        { name: 'Candidates', href: '/dashboard/recruitment/candidates' },
        { name: 'Interviews', href: '/dashboard/recruitment/interviews' },
        { name: 'Offers', href: '/dashboard/recruitment/offers' },
      ],
    },
    {
      name: 'Time Management',
      icon: <Clock size={20} />,
      subItems: [
        { name: 'Attendance', href: '/dashboard/time-management' },
        { name: 'Schedules', href: '/dashboard/time-management/schedules' },
        { name: 'Overtime', href: '/dashboard/time-management/overtime' },
        { name: 'Policy', href: '/dashboard/time-management/policy' },
        { name: 'Shift Management', href: '/time-management/shift-management' },
        { name: 'Configuration', href: '/dashboard/time-management/configuration' },
        { name: 'Exceptions', href: '/dashboard/time-management/exceptions' },
        { name: 'Approvals', href: '/dashboard/time-management/approvals' },
        { name: 'Reports', href: '/dashboard/time-management/reports' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#1a1a1a] transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">The Recruits</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
          </button>
        </div>

        <nav className="px-3 space-y-1 mt-4">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => item.subItems && handleMenuEnter(item.name)}
              onMouseLeave={handleMenuLeave}
            >
              {/* Main Menu Item */}
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    item.active
                      ? 'bg-[#2a2a2a] text-white'
                      : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {item.icon}
                  {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              ) : (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-gray-400 hover:bg-[#2a2a2a] hover:text-white cursor-pointer">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </div>
                  {sidebarOpen && item.subItems && <span className="text-xs">▶</span>}
                </div>
              )}

              {/* Flyout Submenu */}
              {item.subItems && hoveredMenu === item.name && (
                <div
                  className={`absolute top-0 bg-[#2a2a2a] rounded-lg shadow-xl border border-gray-700 py-2 min-w-[200px] z-50 ${
                    sidebarOpen ? 'left-full ml-2' : 'left-full ml-2'
                  }`}
                  onMouseEnter={() => handleMenuEnter(item.name)}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="px-3 py-2 border-b border-gray-700">
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {item.name}
                    </span>
                  </div>
                  <div className="py-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#333333] transition-all"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Header */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              {description && (
                <p className="text-sm text-gray-400 mt-0.5">{description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 inline-block w-2 h-2"></span>
                </button>
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.role || 'Team'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
