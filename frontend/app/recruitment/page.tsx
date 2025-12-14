'use client';

import RecruitmentLayout from './layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Briefcase, Calendar, FileText, Target, 
  TrendingUp, CheckCircle, Clock, DollarSign 
} from 'lucide-react';
import { authenticatedFetch } from '../context/AuthContext';

interface RecruitmentStats {
  totalCandidates: number;
  activeRequisitions: number;
  pendingInterviews: number;
  activeOffers: number;
  hiredThisMonth: number;
  interviewSuccessRate: number;
  averageTimeToHire: number;
  offerAcceptanceRate: number;
}

interface RecentActivity {
  type: 'application' | 'interview' | 'offer' | 'hire';
  title: string;
  description: string;
  time: string;
  candidateName: string;
}

export default function RecruitmentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RecruitmentStats>({
    totalCandidates: 0,
    activeRequisitions: 0,
    pendingInterviews: 0,
    activeOffers: 0,
    hiredThisMonth: 0,
    interviewSuccessRate: 0,
    averageTimeToHire: 0,
    offerAcceptanceRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics from APIs
      const [candidatesRes, applicationsRes, interviewsRes, offersRes] = await Promise.all([
        authenticatedFetch('http://localhost:3000/candidates'),
        authenticatedFetch('http://localhost:3000/applications'),
        authenticatedFetch('http://localhost:3000/interviews'),
        authenticatedFetch('http://localhost:3000/offers'),
      ]);

      const candidates = await candidatesRes.json();
      const applications = await applicationsRes.json();
      const interviews = await interviewsRes.json();
      const offers = await offersRes.json();

      // Calculate statistics
      const pendingInterviews = interviews.filter((i: any) => i.status === 'scheduled').length;
      const activeOffers = offers.filter((o: any) => 
        o.applicantResponse === 'pending' || o.finalStatus === 'pending'
      ).length;
      
      const hiredThisMonth = applications.filter((a: any) => {
        if (a.status !== 'hired') return false;
        const hireDate = new Date(a.updatedAt || a.createdAt);
        const now = new Date();
        return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalCandidates: candidates.length || 0,
        activeRequisitions: 12, // Mock data
        pendingInterviews,
        activeOffers,
        hiredThisMonth,
        interviewSuccessRate: 65, // Mock data
        averageTimeToHire: 28, // Mock data in days
        offerAcceptanceRate: 78, // Mock data
      });

      // Mock recent activities
      setRecentActivities([
        {
          type: 'hire',
          title: 'New Hire Completed',
          description: 'Software Engineer position',
          time: '2 hours ago',
          candidateName: 'John Smith',
        },
        {
          type: 'offer',
          title: 'Offer Extended',
          description: 'Senior Designer role',
          time: '5 hours ago',
          candidateName: 'Sarah Johnson',
        },
        {
          type: 'interview',
          title: 'Interview Scheduled',
          description: 'Technical round for DevOps',
          time: '1 day ago',
          candidateName: 'Michael Chen',
        },
        {
          type: 'application',
          title: 'New Application Received',
          description: 'For Product Manager position',
          time: '2 days ago',
          candidateName: 'Emma Wilson',
        },
      ]);

    } catch (error) {
      console.error('Error fetching recruitment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hire': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offer': return <Target className="w-5 h-5 text-blue-500" />;
      case 'interview': return <Calendar className="w-5 h-5 text-yellow-500" />;
      case 'application': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <RecruitmentLayout title="Recruitment Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading recruitment data...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout 
      title="Recruitment Dashboard" 
      description="Overview of hiring activities and metrics"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Candidates</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalCandidates}</p>
            </div>
            <div className="p-3 bg-blue-600/20 rounded-full">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Active in pipeline</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Job Postings</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.activeRequisitions}</p>
            </div>
            <div className="p-3 bg-purple-600/20 rounded-full">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Open positions</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Interviews</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.pendingInterviews}</p>
            </div>
            <div className="p-3 bg-yellow-600/20 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Scheduled this week</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Offers</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.activeOffers}</p>
            </div>
            <div className="p-3 bg-green-600/20 rounded-full">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Awaiting response</p>
          </div>
        </div>
      </div>

      {/* Charts and Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Metrics */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Interview Success Rate</span>
                <span className="text-sm font-medium text-white">{stats.interviewSuccessRate}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${stats.interviewSuccessRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Offer Acceptance Rate</span>
                <span className="text-sm font-medium text-white">{stats.offerAcceptanceRate}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${stats.offerAcceptanceRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Average Time to Hire</span>
                <span className="text-sm font-medium text-white">{stats.averageTimeToHire} days</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${Math.min(stats.averageTimeToHire * 2, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <button 
              onClick={() => router.push('/recruitment/analytics')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-[#1a1a1a] hover:bg-[#333333] transition-colors">
                <div className="p-2 rounded-lg bg-[#2a2a2a]">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{activity.title}</h4>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-2">Candidate: {activity.candidateName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/recruitment/requisitions/create')}
            className="p-6 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-center group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-full mb-3 group-hover:bg-blue-600/30">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-white block">Create Job Posting</span>
            <span className="text-xs text-gray-400 mt-1">New requisition</span>
          </button>
          <button
            onClick={() => router.push('/recruitment/interviews/create')}
            className="p-6 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-center group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-600/20 rounded-full mb-3 group-hover:bg-yellow-600/30">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-sm font-medium text-white block">Schedule Interview</span>
            <span className="text-xs text-gray-400 mt-1">New meeting</span>
          </button>
          <button
            onClick={() => router.push('/recruitment/candidates/create')}
            className="p-6 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-center group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600/20 rounded-full mb-3 group-hover:bg-green-600/30">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm font-medium text-white block">Add Candidate</span>
            <span className="text-xs text-gray-400 mt-1">New profile</span>
          </button>
          <button
            onClick={() => router.push('/recruitment/analytics')}
            className="p-6 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-center group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600/20 rounded-full mb-3 group-hover:bg-purple-600/30">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-white block">View Reports</span>
            <span className="text-xs text-gray-400 mt-1">Analytics</span>
          </button>
        </div>
      </div>
    </RecruitmentLayout>
  );
}