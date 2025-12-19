'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/app/context/AuthContext';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import {
  Users,
  TrendingUp,
  Briefcase,
  DollarSign,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  primaryPositionId: {
    title: string;
  };
  primaryDepartmentId: {
    name: string;
  };
  status: string;
}

interface TeamSummary {
  totalMembers: number;
  byJobTitle: Record<string, number>;
  byDepartment: Record<string, number>;
  byPayGrade: Record<string, number>;
}

const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ManagerTeamView() {
  const { user } = useAuth();
  const { canViewTeamMembers, canViewTeamSummary } = useCanAccess();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'summary'>('members');

  useEffect(() => {
    if (canViewTeamMembers()) {
      fetchTeamMembers();
    }
    if (canViewTeamSummary()) {
      fetchTeamSummary();
    }
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoadingMembers(true);
    setError('');

    try {
      console.log('[ManagerTeamView] Fetching team members...');
      const response = await fetch(`${URL}/employees/my-team`, {
        credentials: 'include',
      });

      if (response.status === 403) {
        throw new Error('Access Denied: You do not have permission to view team members. This feature is only available for managers.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ManagerTeamView] Error response:', errorData);
        throw new Error(errorData.message || `Failed to fetch team members: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ManagerTeamView] Team members fetched:', data);
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('[ManagerTeamView] Fetch error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchTeamSummary = async () => {
    setIsLoadingSummary(true);

    try {
      console.log('[ManagerTeamView] Fetching team summary...');
      const response = await fetch(
        `${URL}/employees/my-team/summary`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 403) {
        throw new Error('Access Denied: You do not have permission to view team summary. This feature is only available for managers.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ManagerTeamView] Error response:', errorData);
        throw new Error(errorData.message || `Failed to fetch team summary: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ManagerTeamView] Team summary fetched:', data);
      setSummary(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('[ManagerTeamView] Fetch error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <RoleBasedAccess requiredAccess={() => canViewTeamMembers() || canViewTeamSummary()}>
      <div className="space-y-6">
        {/* Stats Cards */}
        {canViewTeamSummary() && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-white">
                    {summary.totalMembers}
                  </p>
                </div>
                <Users size={32} className="text-blue-400" />
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Job Titles</p>
                  <p className="text-3xl font-bold text-white">
                    {Object.keys(summary.byJobTitle).length}
                  </p>
                </div>
                <Briefcase size={32} className="text-green-400" />
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Departments</p>
                  <p className="text-3xl font-bold text-white">
                    {Object.keys(summary.byDepartment).length}
                  </p>
                </div>
                <TrendingUp size={32} className="text-purple-400" />
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pay Grades</p>
                  <p className="text-3xl font-bold text-white">
                    {Object.keys(summary.byPayGrade).length}
                  </p>
                </div>
                <DollarSign size={32} className="text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700">
          {canViewTeamMembers() && (
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Team Members
            </button>
          )}
          {canViewTeamSummary() && (
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Summary
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && canViewTeamMembers() && (
          <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader size={24} className="text-blue-400 animate-spin" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400">No team members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Employee #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {teamMembers.map((member) => (
                      <tr
                        key={member._id}
                        className="hover:bg-[#333333] transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {member.employeeNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {member.primaryPositionId?.title || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {member.primaryDepartmentId?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'ACTIVE'
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && canViewTeamSummary() && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Job Title */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Distribution by Job Title</h4>
              <div className="space-y-3">
                {Object.entries(summary.byJobTitle).map(([title, count]) => (
                  <div key={title} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#1a1a1a] rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (count / summary.totalMembers) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Department */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Distribution by Department</h4>
              <div className="space-y-3">
                {Object.entries(summary.byDepartment).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{dept}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#1a1a1a] rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (count / summary.totalMembers) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Pay Grade */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Distribution by Pay Grade</h4>
              <div className="space-y-3">
                {Object.entries(summary.byPayGrade).map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{grade}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#1a1a1a] rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (count / summary.totalMembers) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedAccess>
  );
}
