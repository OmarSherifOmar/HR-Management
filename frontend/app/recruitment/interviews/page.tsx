'use client';

import RecruitmentLayout from '../layout';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Filter, Plus, MoreVertical, Calendar, Clock, 
  User, Video, Phone, MapPin, CheckCircle, XCircle,
  Edit, Trash2, Eye, Mail
} from 'lucide-react';
import { authenticatedFetch } from '../../context/AuthContext';

interface Interview {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
    };
    requisitionId: {
      title: string;
    };
  };
  stage: string;
  scheduledDate: string;
  method: 'in_person' | 'video' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  panel?: Array<{
    name: string;
    role: string;
  }>;
  videoLink?: string;
  location?: string;
  candidateFeedback?: string;
  feedbackId?: string;
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <InterviewsContent />
    </Suspense>
  );
}

function InterviewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/interviews`);
      const data = await res.json();
      setInterviews(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = 
      interview.applicationId?.candidateId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.applicationId?.requisitionId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.stage.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || interview.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      case 'rescheduled': return 'bg-yellow-600 text-white';
      case 'no_show': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'video': return <Video size={16} className="text-blue-400" />;
      case 'phone': return <Phone size={16} className="text-green-400" />;
      case 'in_person': return <MapPin size={16} className="text-purple-400" />;
      default: return <Calendar size={16} className="text-gray-400" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (scheduledDate: string) => {
    const now = new Date();
    const interviewDate = new Date(scheduledDate);
    const diffTime = interviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffTime < 0) return 'Past';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return 'Upcoming';
  };

  const getTimeColor = (scheduledDate: string, status: string) => {
    if (status !== 'scheduled') return 'text-gray-400';
    
    const now = new Date();
    const interviewDate = new Date(scheduledDate);
    const diffTime = interviewDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'text-red-400';
    if (diffHours < 48) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading interviews...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout>
      {/* Header with Actions */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Interviews</h1>
            <p className="text-gray-400">Schedule and manage candidate interviews</p>
          </div>
          <div className="flex gap-3">
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 ${viewMode === 'calendar' ? 'bg-gray-700 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
              >
                Calendar View
              </button>
            </div>
            <button
              onClick={() => router.push('/recruitment/interviews/create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search interviews by candidate, position, or stage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Methods</option>
              <option value="in_person">In Person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
            </select>
            <button className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white flex items-center gap-2">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      {viewMode === 'list' ? (
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1a1a]">
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Candidate</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Position & Stage</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Date & Time</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Method</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Status</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Panel</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((interview) => (
                  <tr key={interview._id} className="border-b border-gray-800 hover:bg-[#333333]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {interview.applicationId?.candidateId?.name?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{interview.applicationId?.candidateId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{interview.applicationId?.candidateId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{interview.applicationId?.requisitionId?.title || 'N/A'}</p>
                        <p className="text-xs text-gray-400 capitalize">{interview.stage.replace('_', ' ')}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-white">{formatDateTime(interview.scheduledDate)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={12} className={getTimeColor(interview.scheduledDate, interview.status)} />
                          <span className={`text-xs ${getTimeColor(interview.scheduledDate, interview.status)}`}>
                            {getTimeRemaining(interview.scheduledDate)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(interview.method)}
                        <span className="text-sm text-white capitalize">{interview.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex -space-x-2">
                        {interview.panel?.slice(0, 3).map((member, index) => (
                          <div key={index} className="w-6 h-6 bg-gray-700 rounded-full border-2 border-[#2a2a2a] flex items-center justify-center" title={member.name}>
                            <span className="text-xs text-white">{member.name.charAt(0)}</span>
                          </div>
                        ))}
                        {interview.panel && interview.panel.length > 3 && (
                          <div className="w-6 h-6 bg-gray-800 rounded-full border-2 border-[#2a2a2a] flex items-center justify-center" title={`+${interview.panel.length - 3} more`}>
                            <span className="text-xs text-gray-400">+{interview.panel.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {interview.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => router.push(`/recruitment/interviews/${interview._id}?action=start`)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => router.push(`/recruitment/interviews/${interview._id}/reschedule`)}
                              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded"
                            >
                              Reschedule
                            </button>
                          </>
                        )}
                        {interview.status === 'completed' && !interview.feedbackId && (
                          <button
                            onClick={() => router.push(`/recruitment/interviews/${interview._id}/feedback`)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
                          >
                            Add Feedback
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/recruitment/interviews/${interview._id}`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInterviews.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No interviews found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setMethodFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Interview Calendar</h3>
              <p className="text-gray-400">View and manage interviews by date</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
                Today
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
                Week
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
                Month
              </button>
            </div>
          </div>
          
          {/* Mock Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center py-2 text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}
            
            {Array.from({ length: 35 }).map((_, index) => {
              const dayInterviews = filteredInterviews.filter(interview => {
                const interviewDate = new Date(interview.scheduledDate).getDate();
                return interviewDate === (index % 30) + 1;
              });
              
              return (
                <div key={index} className="min-h-24 p-2 border border-gray-800 rounded-lg bg-[#1a1a1a]">
                  <div className="text-right">
                    <span className={`text-xs ${index < 5 ? 'text-gray-500' : 'text-white'}`}>
                      {(index % 30) + 1}
                    </span>
                  </div>
                  {dayInterviews.slice(0, 2).map(interview => (
                    <div
                      key={interview._id}
                      className="mt-1 p-1.5 text-xs rounded truncate cursor-pointer hover:opacity-90"
                      style={{ 
                        backgroundColor: interview.status === 'scheduled' ? '#2563eb' : 
                                       interview.status === 'completed' ? '#059669' : '#dc2626'
                      }}
                      onClick={() => router.push(`/recruitment/interviews/${interview._id}`)}
                    >
                      <p className="text-white font-medium truncate">
                        {interview.applicationId?.candidateId?.name?.split(' ')[0] || 'Candidate'}
                      </p>
                      <p className="text-white/80 truncate">{interview.stage}</p>
                    </div>
                  ))}
                  {dayInterviews.length > 2 && (
                    <div className="mt-1 text-xs text-gray-400 text-center">
                      +{dayInterviews.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Interviews */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Interviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredInterviews
            .filter(interview => interview.status === 'scheduled')
            .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
            .slice(0, 4)
            .map(interview => (
              <div key={interview._id} className="bg-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white">{interview.applicationId?.candidateId?.name}</h4>
                    <p className="text-sm text-gray-400">{interview.applicationId?.requisitionId?.title}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(interview.status)}`}>
                    {getTimeRemaining(interview.scheduledDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Clock size={14} />
                  {formatDateTime(interview.scheduledDate)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMethodIcon(interview.method)}
                    <span className="text-sm text-gray-400 capitalize">{interview.method.replace('_', ' ')}</span>
                  </div>
                  <button
                    onClick={() => router.push(`/recruitment/interviews/${interview._id}`)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </RecruitmentLayout>
  );
}
