'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Search,
  Download,
  Eye
} from 'lucide-react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  primaryDepartmentId?: string;
}

interface LeaveType {
  _id: string;
  code: string;
  name: string;
  deductible?: boolean;
}

interface LeaveRequest {
  _id: string;
  employeeId: Employee;
  leaveTypeId: LeaveType;
  dates: {
    from: string;
    to: string;
  };
  durationDays: number;
  status: string;
  justification?: string;
  createdAt: string;
}

interface TeamMemberData {
  employee: Employee;
  entitlements: any[];
  upcomingLeaves: LeaveRequest[];
}

export default function TeamLeaveHistoryPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);
  const [allLeaveTypes, setAllLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'upcomingDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // View mode: 'balances' or 'history'
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');

  // Effect 1: Check auth and fetch leave types once on login
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }
    
    console.log('[Team Leave History] User role:', user?.role);
    
    const canAccess = user?.role === 'department head' || 
                     user?.role === 'HR Manager' || 
                     user?.role === 'HR Admin';
    
    console.log('[Team Leave History] Can access:', canAccess);
    
    if (isLoggedIn && !canAccess) {
      console.log('[Team Leave History] Access denied, redirecting to dashboard');
      router.replace('/dashboard');
      return;
    }
    
    if (isLoggedIn && canAccess) {
      fetchLeaveTypes();
    }
  }, [isLoading, isLoggedIn, user, router]);

  // Effect 2: Fetch team data when filters change
  useEffect(() => {
    if (isLoggedIn) {
      fetchTeamData();
    }
  }, [isLoggedIn, leaveTypeFilter, statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query params
      const params = new URLSearchParams();
      if (leaveTypeFilter) params.append('leaveTypeId', leaveTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      const queryString = params.toString();
      const url = `http://localhost:3000/leave-requests/manager/team-balances${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching team data from:', url);
      
      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Team Leave History] Full API response:', result);
        console.log('[Team Leave History] Data count:', result?.count);
        console.log('[Team Leave History] Team members:', result?.data?.length);
        
        if (result.success && Array.isArray(result.data)) {
          console.log('[Team Leave History] Setting team data with', result.data.length, 'members');
          result.data.forEach((member: any, idx: number) => {
            console.log(`  Member ${idx + 1}:`, {
              name: `${member.employee?.firstName} ${member.employee?.lastName}`,
              upcomingLeaves: member.upcomingLeaves?.length || 0,
              entitlements: member.entitlements?.length || 0
            });
          });
          setTeamData(result.data);
        } else {
          console.error('[Team Leave History] Invalid response format:', result);
          setError('Invalid response format from server');
        }
      } else {
        const errorText = await response.text();
        console.error('[Team Leave History] Failed to fetch:', response.status, errorText);
        setError(`Failed to load team data: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      setError('An error occurred while loading team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      console.log('[Team Leave History] Fetching leave types...');
      const response = await authenticatedFetch('http://localhost:3000/leaves/types');
      
      if (response.ok) {
        const types = await response.json();
        console.log('[Team Leave History] Leave types fetched:', types?.length || 0);
        setAllLeaveTypes(types || []);
      } else {
        const text = await response.text().catch(() => '');
        console.error('[Team Leave History] Failed to fetch leave types:', response.status, text);
        if (response.status === 403) {
          console.error('[Team Leave History] 403 Forbidden - user:', user);
        }
      }
    } catch (err: any) {
      console.error('[Team Leave History] Error fetching leave types:', err);
    }
  };

  // Get unique leave types from team data
  const uniqueLeaveTypes = useMemo(() => {
    const types = new Set<string>();
    teamData.forEach(member => {
      member.upcomingLeaves?.forEach(leave => {
        if (leave.leaveTypeId) {
          types.add(JSON.stringify({
            _id: leave.leaveTypeId._id,
            name: leave.leaveTypeId.name
          }));
        }
      });
    });
    return Array.from(types).map(t => JSON.parse(t));
  }, [teamData]);

  // Filter by employee search
  const filteredData = useMemo(() => {
    if (!employeeSearch) return teamData;
    
    const search = employeeSearch.toLowerCase();
    return teamData.filter(member => 
      `${member.employee.firstName} ${member.employee.lastName}`.toLowerCase().includes(search) ||
      member.employee.employeeNumber?.toLowerCase().includes(search)
    );
  }, [teamData, employeeSearch]);

  // Flatten all leaves for table view
  const allLeaves = useMemo(() => {
    const leaves: (LeaveRequest & { employeeName: string })[] = [];
    
    filteredData.forEach(member => {
      member.upcomingLeaves?.forEach(leave => {
        leaves.push({
          ...leave,
          employeeName: `${member.employee.firstName} ${member.employee.lastName}`
        });
      });
    });
    
    return leaves;
  }, [filteredData]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalEmployees = filteredData.length;
    const totalUpcomingLeaves = allLeaves.filter(l => 
      l.status === 'pending' || l.status === 'approved'
    ).length;
    const pendingApprovals = allLeaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = allLeaves.filter(l => l.status === 'approved').length;
    
    return {
      totalEmployees,
      totalUpcomingLeaves,
      pendingApprovals,
      approvedLeaves
    };
  }, [filteredData, allLeaves]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'cancelled':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout title="Team Leave History" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <DashboardLayout
      title="Team Leave History & Reports"
      description="View and analyze leave requests for your supervised team members"
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-500 font-semibold">Error</h3>
              <p className="text-gray-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalEmployees}</p>
              </div>
              <Users className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upcoming Leaves</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalUpcomingLeaves}</p>
              </div>
              <Calendar className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pendingApprovals}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.approvedLeaves}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Employee Search */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Name or employee number..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Leave Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Leave Type
              </label>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                {allLeaveTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="name">Employee Name</option>
                <option value="department">Department</option>
                <option value="upcomingDate">Upcoming Leave Date</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setEmployeeSearch('');
                  setLeaveTypeFilter('');
                  setStatusFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Team Leave Requests</h3>
            <p className="text-sm text-gray-400 mt-1">
              Showing {allLeaves.length} leave request(s) from {filteredData.length} team member(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    From - To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No leave requests found for the selected filters
                    </td>
                  </tr>
                ) : (
                  allLeaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{leave.employeeName}</div>
                        {leave.employeeId?.employeeNumber && (
                          <div className="text-xs text-gray-400">{leave.employeeId.employeeNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {leave.leaveTypeId?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(leave.dates.from).toLocaleDateString()} - {new Date(leave.dates.to).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">
                          {leave.durationDays} {leave.durationDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-2 ${getStatusColor(leave.status)}`}>
                          {getStatusIcon(leave.status)}
                          <span className="text-sm font-medium capitalize">{leave.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/leaves/manager/pending-reviews`)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">About Team Leave Reports</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• View leave requests for employees you directly supervise</li>
                <li>• Filter by leave type, status, and date range to analyze patterns</li>
                <li>• Monitor upcoming leaves to manage team workload effectively</li>
                <li>• Track pending approvals that require your attention</li>
                <li>• Export reports for further analysis and planning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
