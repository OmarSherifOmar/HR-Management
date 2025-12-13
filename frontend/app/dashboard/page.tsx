'use client';

import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  FileInput,
  UserPlus,
  Banknote,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const recentActivities = [
    { type: 'leave', message: 'John Doe requested 3 days leave', time: '2 hours ago', status: 'pending' },
    { type: 'employee', message: 'Sarah Smith joined as Senior Developer', time: '5 hours ago', status: 'completed' },
    { type: 'payroll', message: 'Payroll processed for December', time: '1 day ago', status: 'completed' },
    { type: 'performance', message: 'Q4 Performance reviews started', time: '2 days ago', status: 'ongoing' },
  ];

  return (
    <DashboardLayout 
      title="Dashboard" 
      description={`Welcome back, ${user?.name || 'User'}!`}
    >
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#333333] transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  activity.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : activity.status === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-left group">
              <span className="text-2xl mb-2 block">
                <UserPlus size={24} />
              </span>
              <span className="text-sm font-medium text-white">
                Add Employee
              </span>
            </button>
            <button className="p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-left group">
              <span className="text-2xl mb-2 block">
                <FileInput size={24} />
              </span>
              <span className="text-sm font-medium text-white">
                New Leave Request
              </span>
            </button>
            <button className="p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-left group">
              <span className="text-2xl mb-2 block">
                <Banknote size={24} />
              </span>
              <span className="text-sm font-medium text-white">
                Process Payroll
              </span>
            </button>
            <button className="p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-left group">
              <span className="text-2xl mb-2 block">
                <TrendingUp size={24} />
              </span>
              <span className="text-sm font-medium text-white">
                View Reports
              </span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
