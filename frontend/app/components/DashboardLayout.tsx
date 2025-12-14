'use client';

import { useAuth, authenticatedFetch } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode, useRef } from 'react';
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
  Bell,
  X
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

interface Notification {
  _id: string;
  to: string;
  type: string;
  message: string;
  createdAt: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user, isLoggedIn, isLoading, logout, permissions, hasPermission } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await authenticatedFetch('http://localhost:3000/notifications?limit=20');
      
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
        // Basic items - always show for all users (fallback if permissions not loaded)
        ...(hasPermission('request_own_leave') || permissions.length === 0 ? [
          { name: 'My Requests', href: '/leaves' },
        ] : []),
        ...(hasPermission('view_own_leave') || permissions.length === 0 ? [
          { name: 'My Balance', href: '/leaves/balance' },
        ] : []),
        
        // Approval permissions - with role fallback
        ...(hasPermission('approve_team_leave') || hasPermission('approve_department_leave') || user?.role === 'department head' ? [
          { name: 'Manager Reviews', href: '/leaves/manager/pending-reviews' },
        ] : []),
        ...(hasPermission('approve_all_leave') || user?.role === 'HR Manager' || user?.role === 'HR Admin' ? [
          { name: 'HR Reviews', href: '/leaves/hr/pending-reviews' },
        ] : []),
        
        // HR Admin section - with role fallback to ensure HR Admin always sees these
        ...(hasPermission('adjust_balances') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Balance Adjustments', href: '/dashboard/admin/balance-adjustments' },
        ] : []),
        ...(hasPermission('audit_leave_actions') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Audit Log', href: '/dashboard/admin/audit-log' },
        ] : []),
        ...(hasPermission('manage_leave_roles') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Role Management', href: '/dashboard/admin/role-management' },
        ] : []),
        ...(hasPermission('manage_leave_policies') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Policies', href: '/dashboard/admin/policies' },
        ] : []),
        ...(hasPermission('manage_leave_types') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Leave Types', href: '/dashboard/admin/leave-types' },
          { name: 'Admin: Parameters', href: '/dashboard/admin/parameters' },
          { name: 'Admin: Special Absence Types', href: '/dashboard/admin/special-absence' },
          { name: 'Admin: Leave Year Config', href: '/dashboard/admin/leave-year' },
          { name: 'Admin: Eligibility Rules', href: '/dashboard/admin/eligibility' },
        ] : []),
        ...(hasPermission('manage_entitlements') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Personalized Entitlements', href: '/dashboard/admin/personalized-entitlements' },
          { name: 'Admin: Entitlements', href: '/dashboard/admin/entitlements' },
        ] : []),
        ...(hasPermission('manage_calendar') || user?.role === 'HR Admin' ? [
          { name: 'Admin: Calendar & Blocked Days', href: '/dashboard/admin/calendar' },
        ] : []),
        ...(user?.role === 'HR Admin' ? [
          { name: 'Admin: Settings', href: '/dashboard/admin/settings' },
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
                  className={`absolute top-0 bg-[#2a2a2a] rounded-lg shadow-xl border border-gray-700 py-2 min-w-[200px] z-50 max-h-[70vh] overflow-y-auto custom-scrollbar transition-all duration-150 ${
                    sidebarOpen ? 'left-full ml-2' : 'left-full ml-2'
                  }`}
                  onMouseEnter={() => handleMenuEnter(item.name)}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="px-3 py-2 border-b border-gray-700 sticky top-0 bg-[#2a2a2a] z-10">
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
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={toggleNotifications}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-[#2a2a2a] rounded-lg shadow-xl border border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        <button 
                          onClick={() => setNotificationsOpen(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="overflow-y-auto flex-1">
                        {loadingNotifications ? (
                          <div className="p-8 text-center text-gray-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-sm">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <Bell size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification._id}
                                className="px-4 py-3 hover:bg-[#333333] transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Bell size={16} className="text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-blue-400 mb-1 uppercase">
                                      {notification.type}
                                    </p>
                                    <p className="text-sm text-gray-300 mb-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
