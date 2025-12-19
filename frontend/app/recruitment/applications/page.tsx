'use client';

import RecruitmentLayout from '../layout';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Filter, Plus, MoreVertical, FileText, 
  User, Briefcase, Calendar, CheckCircle, XCircle,
  Eye, Edit, Mail, Download, ChevronDown
} from 'lucide-react';
import { authenticatedFetch } from '../../context/AuthContext';

interface Application {
  _id: string;
  candidateId: {
    name: string;
    email: string;
    phone?: string;
  };
  requisitionId: {
    title: string;
    department: string;
  };
  currentStage: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interviewing' | 'offer_extended' | 'hired' | 'rejected' | 'withdrawn';
  assignedHr?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  interviewCount?: number;
  lastInterviewDate?: string;
}

interface StageStats {
  screening: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [stageFilter, setStageFilter] = useState<string>(searchParams.get('stage') || 'all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StageStats>({
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await authenticatedFetch('http://localhost:3000/applications');
      const data = await res.json();
      setApplications(data);
      
      // Calculate stats
      const stageCounts: StageStats = {
        screening: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      };
      
      data.forEach((app: Application) => {
        if (stageCounts[app.currentStage] !== undefined) {
          stageCounts[app.currentStage]++;
        }
      });
      
      setStats(stageCounts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.candidateId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidateId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.requisitionId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.requisitionId?.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesStage = stageFilter === 'all' || app.currentStage === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
      case 'offer_extended':
        return 'bg-green-600 text-white';
      case 'rejected':
      case 'withdrawn':
        return 'bg-red-600 text-white';
      case 'interviewing':
      case 'shortlisted':
        return 'bg-yellow-600 text-white';
      case 'under_review':
        return 'bg-blue-600 text-white';
      case 'submitted':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'hired': return 'text-green-400';
      case 'offer': return 'text-purple-400';
      case 'interview': return 'text-yellow-400';
      case 'screening': return 'text-blue-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <RecruitmentLayout title="Applications" description="Manage candidate applications">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading applications...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout title="Applications" description="Manage candidate applications">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Applications</h1>
            <p className="text-gray-400">Manage and track all candidate applications</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stage Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(stats).map(([stage, count]) => (
            <div
              key={stage}
              className={`bg-[#2a2a2a] rounded-lg p-4 cursor-pointer ${stageFilter === stage ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 capitalize">{stage}</p>
                  <p className="text-2xl font-bold text-white mt-2">{count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search applications by candidate, position, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Stages</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer_extended">Offer Extended</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white flex items-center gap-2">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a1a1a]">
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Candidate</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Position</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Stage</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Status</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">HR</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Applied</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app._id} className="border-b border-gray-800 hover:bg-[#333333]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {app.candidateId?.name?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{app.candidateId?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{app.candidateId?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-white">{app.requisitionId?.title || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{app.requisitionId?.department || ''}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStageColor(app.currentStage)}`}></div>
                      <span className={`text-sm capitalize ${getStageColor(app.currentStage)}`}>
                        {app.currentStage}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(app.status)}`}>
                      {app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {app.assignedHr ? (
                        <>
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">{app.assignedHr.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-white">{app.assignedHr.name.split(' ')[0]}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-white">{formatDate(app.createdAt)}</p>
                      <p className="text-xs text-gray-400">{getDaysSince(app.createdAt)} days ago</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/recruitment/applications/${app._id}`)}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {app.status === 'shortlisted' && (
                        <button
                          onClick={() => router.push(`/recruitment/applications/${app._id}/schedule`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="Schedule Interview"
                        >
                          <Calendar size={16} />
                        </button>
                      )}
                      {app.status === 'interviewing' && (
                        <button
                          onClick={() => router.push(`/recruitment/applications/${app._id}/stage`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="Update Stage"
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`mailto:${app.candidateId.email}`, '_blank')}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Email Candidate"
                      >
                        <Mail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setStageFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-white mt-2">{applications.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Interviewing</p>
              <p className="text-2xl font-bold text-white mt-2">
                {applications.filter(a => a.currentStage === 'interview').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Offer Stage</p>
              <p className="text-2xl font-bold text-white mt-2">
                {applications.filter(a => a.currentStage === 'offer').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Hired This Month</p>
              <p className="text-2xl font-bold text-white mt-2">
                {applications.filter(a => 
                  a.status === 'hired' && 
                  new Date(a.updatedAt).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}