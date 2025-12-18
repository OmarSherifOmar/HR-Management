'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Target,
  Bell,
  ChevronDown,
  Home
} from 'lucide-react';

interface RecruitmentLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function RecruitmentLayout({ children, title, description }: RecruitmentLayoutProps) {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, router]);

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

  const recruitmentMenu = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/recruitment',
      active: activeMenu === 'dashboard',
    },
    {
      name: 'Job Postings',
      icon: <Briefcase size={20} />,
      href: '/recruitment/requisitions',
      active: activeMenu === 'postings',
    },
    {
      name: 'Candidates',
      icon: <Users size={20} />,
      href: '/recruitment/candidates',
      active: activeMenu === 'candidates',
      subItems: [
        { name: 'All Candidates', href: '/recruitment/candidates' },
        { name: 'Add New', href: '/recruitment/candidates/create' },
      ],
    },
    {
      name: 'Applications',
      icon: <FileText size={20} />,
      href: '/recruitment/applications',
      active: activeMenu === 'applications',
    },
    {
      name: 'Interviews',
      icon: <Calendar size={20} />,
      href: '/recruitment/interviews',
      active: activeMenu === 'interviews',
      subItems: [
        { name: 'All Interviews', href: '/recruitment/interviews' },
        { name: 'Schedule New', href: '/recruitment/interviews/create' },
      ],
    },
    {
      name: 'Offers',
      icon: <Target size={20} />,
      href: '/recruitment/offers',
      active: activeMenu === 'offers',
      subItems: [
        { name: 'All Offers', href: '/recruitment/offers' },
        { name: 'Pending Approval', href: '/recruitment/offers?status=pending' },
      ],
    },
    {
      name: 'Job Templates',
      icon: <Briefcase size={20} />,
      href: '/recruitment/job-templates',
      active: activeMenu === 'templates',
    },
    {
      name: 'Analytics',
      icon: <LayoutDashboard size={20} />,
      href: '/recruitment/analytics',
      active: activeMenu === 'analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Top Navigation */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white hover:text-gray-300">
              <Home size={20} />
              <span className="text-sm">Back to Main Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-700"></div>
            <div>
              <h1 className="text-xl font-bold text-white">Recruitment Module</h1>
              <p className="text-sm text-gray-400">Hiring and Talent Acquisition</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Recruiter'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="px-6 py-3 border-t border-gray-800 bg-[#1a1a1a]">
          <div className="flex items-center gap-6">
            {recruitmentMenu.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setActiveMenu(item.name.toLowerCase())}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
                {item.subItems && <ChevronDown size={16} />}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description && (
            <p className="text-gray-400 mt-2">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}