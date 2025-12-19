'use client';

'use client';

import Link from 'next/link';
import { Building2, Users, FileText, Plus, Users2, CheckCircle, Activity } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function OrganizationDashboard() {
  const modules = [
    {
      title: 'Departments',
      description: 'Create, manage, and deactivate departments',
      icon: <Building2 size={32} />,
      href: '/dashboard/organization/departments',
      color: 'from-blue-600 to-blue-700',
    },
    {
      title: 'Positions',
      description: 'Define and manage job positions within departments',
      icon: <Users size={32} />,
      href: '/dashboard/organization/positions',
      color: 'from-purple-600 to-purple-700',
    },
    {
      title: 'All Change Requests',
      description: 'View all requests and manage approvals, rejections, and deletions',
      icon: <FileText size={32} />,
      href: '/dashboard/organization/requests',
      color: 'from-green-600 to-green-700',
    },
    {
      title: 'My Requests',
      description: 'View and manage your change requests',
      icon: <Users2 size={32} />,
      href: '/dashboard/organization/requests/my-requests',
      color: 'from-orange-600 to-orange-700',
    },
    {
      title: 'Create Request',
      description: 'Submit a new organizational structure change request',
      icon: <Plus size={32} />,
      href: '/dashboard/organization/requests/create',
      color: 'from-indigo-600 to-indigo-700',
    },
  ];

  return (
    <DashboardLayout 
      title="Organization Structure"
      description="Manage your organizational hierarchy, departments, and positions"
    >
      <div className="space-y-6">

      {/* Main Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg border border-gray-700 hover:border-gray-500 p-8 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className={`inline-block p-4 rounded-lg bg-gradient-to-br ${module.color} text-white mb-4`}>
              {module.icon}
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{module.title}</h2>
            <p className="text-gray-400 text-sm">{module.description}</p>
            <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Manage →
            </div>
          </Link>
        ))}
      </div>

      {/* Data View Cards - Exactly like module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <button
          onClick={() => window.location.href = '/dashboard/organization/position-assignments'}
          className="group bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg border border-gray-700 hover:border-gray-500 p-8 transition-all hover:shadow-lg hover:shadow-blue-500/10 text-left"
        >
          <div className="inline-block p-4 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white mb-4">
            <Users2 size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Position Assignments</h2>
          <p className="text-gray-400 text-sm">View and manage position assignments</p>
          <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/dashboard/organization/structure-approvals'}
          className="group bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg border border-gray-700 hover:border-gray-500 p-8 transition-all hover:shadow-lg hover:shadow-green-500/10 text-left"
        >
          <div className="inline-block p-4 rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">Structure Approvals</h2>
          <p className="text-gray-400 text-sm">Review approval decisions and status</p>
          <div className="mt-4 flex items-center text-green-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/dashboard/organization/structure-change-logs'}
          className="group bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg border border-gray-700 hover:border-gray-500 p-8 transition-all hover:shadow-lg hover:shadow-purple-500/10 text-left"
        >
          <div className="inline-block p-4 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white mb-4">
            <Activity size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">Structure Change Logs</h2>
          <p className="text-gray-400 text-sm">View all organizational changes</p>
          <div className="mt-4 flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </div>
        </button>
      </div>
      </div>
    </DashboardLayout>
  );
}
