'use client';

import { Users, CheckCircle2, AlertCircle, Pause } from 'lucide-react';

interface EmployeeStatsProps {
  totalEmployees?: number;
  activeEmployees?: number;
  onLeaveEmployees?: number;
  suspendedEmployees?: number;
}

export default function EmployeeStats({
  totalEmployees = 0,
  activeEmployees = 0,
  onLeaveEmployees = 0,
  suspendedEmployees = 0,
}: EmployeeStatsProps) {
  const stats = [
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-600/20',
    },
    {
      label: 'Active',
      value: activeEmployees,
      icon: CheckCircle2,
      color: 'bg-green-600',
      bgColor: 'bg-green-600/20',
    },
    {
      label: 'On Leave',
      value: onLeaveEmployees,
      icon: AlertCircle,
      color: 'bg-yellow-600',
      bgColor: 'bg-yellow-600/20',
    },
    {
      label: 'Suspended',
      value: suspendedEmployees,
      icon: Pause,
      color: 'bg-red-600',
      bgColor: 'bg-red-600/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon size={24} className={`text-white`} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              <p className="text-xs text-gray-500">
                {((stat.value / (totalEmployees || 1)) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
