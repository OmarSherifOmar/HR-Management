'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../context/AuthContext';
import { 
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
  Download,
  MessageSquare
} from 'lucide-react';

interface Application {
  _id: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  requisitionId: {
    _id: string;
    title: string;
    department: string;
  };
  assignedHr?: {
    _id: string;
    name: string;
    email: string;
  };
  currentStage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Interview {
  _id: string;
  scheduledDate: string;
  method: string;
  status: string;
  panel: Array<{
    _id: string;
    name: string;
  }>;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [application, setApplication] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'interviews' | 'documents'>('details');

  useEffect(() => {
    fetchApplication();
    fetchInterviews();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(
        `${URL}/applications/${applicationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else {
        setError('Failed to load application details');
      }
    } catch (err) {
      setError('Error fetching application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(
        `${URL}/interviews/application/${applicationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

  const handleUpdateStage = async (stage: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(
        `${URL}/applications/${applicationId}/stage/${stage}`,
        {
          method: 'PUT',
        }
      );
      if (response.ok) {
        fetchApplication(); // Refresh data
      } else {
        setError('Failed to update stage');
      }
    } catch (err) {
      setError('Error updating stage');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(
        `${URL}/applications/${applicationId}/status/${status}`,
        {
          method: 'PUT',
        }
      );
      if (response.ok) {
        fetchApplication(); // Refresh data
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      setError('Error updating status');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Application Details" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading application details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Application Details" description="Application not found">
        <div className="text-center py-12">
          <p className="text-gray-400">Application not found</p>
          <button
            onClick={() => router.push('/recruitment/applications')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Applications
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
      case 'accepted':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'interviewing':
      case 'under_review':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'hired':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'interview':
        return 'bg-blue-600 text-white';
      case 'offer':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout 
      title="Application Details" 
      description={`Viewing application for ${application.candidateId.name}`}
    >
      <div className="mb-6">
        <button
          onClick={() => router.push('/recruitment/applications')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Back to Applications
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Header with Status */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {application.candidateId.name}
            </h1>
            <p className="text-gray-400">
              Applied for <span className="text-white font-medium">{application.requisitionId.title}</span> in {application.requisitionId.department}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Applied on {formatDate(application.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(application.currentStage)}`}>
              {application.currentStage.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`px-4 py-2 font-medium ${activeTab === 'interviews' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Interviews ({interviews.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 font-medium ${activeTab === 'documents' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Documents
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Candidate Information */}
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User size={20} />
                  Candidate Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="text-white font-medium">{application.candidateId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Mail size={16} />
                      {application.candidateId.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Phone size={16} />
                      {application.candidateId.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building size={20} />
                  Job Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Position</p>
                    <p className="text-white font-medium">{application.requisitionId.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Department</p>
                    <p className="text-white font-medium">{application.requisitionId.department}</p>
                  </div>
                </div>
              </div>

              {/* HR Assignment */}
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">HR Assignment</h3>
                {application.assignedHr ? (
                  <div>
                    <p className="text-sm text-gray-400">Assigned HR Representative</p>
                    <p className="text-white font-medium">{application.assignedHr.name}</p>
                    <p className="text-gray-400 text-sm">{application.assignedHr.email}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">No HR assigned yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="text-center py-8 bg-[#2a2a2a] rounded-lg">
                  <p className="text-gray-400">No interviews scheduled yet</p>
                  <button
                    onClick={() => router.push(`/recruitment/applications/${applicationId}/schedule`)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Interview
                  </button>
                </div>
              ) : (
                interviews.map((interview) => (
                  <div key={interview._id} className="bg-[#2a2a2a] rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium mb-2">
                          {new Date(interview.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Method: <span className="text-white">{interview.method}</span>
                        </p>
                        {interview.panel && interview.panel.length > 0 && (
                          <p className="text-gray-400 text-sm mt-2">
                            Panel: {interview.panel.map(p => p.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          interview.status === 'completed' ? 'bg-green-600' :
                          interview.status === 'scheduled' ? 'bg-blue-600' :
                          interview.status === 'cancelled' ? 'bg-red-600' :
                          'bg-gray-600'
                        } text-white`}>
                          {interview.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => router.push(`/recruitment/interviews/${interview._id}`)}
                          className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => router.push(`/recruitment/applications/${applicationId}/schedule`)}
                className="w-full py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Schedule New Interview
              </button>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Application Documents</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Resume</p>
                      <p className="text-gray-400 text-sm">Updated 2 days ago</p>
                    </div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300">
                    <Download size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">Cover Letter</p>
                      <p className="text-gray-400 text-sm">Updated 2 days ago</p>
                    </div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300">
                    <Download size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Portfolio</p>
                      <p className="text-gray-400 text-sm">Updated 1 week ago</p>
                    </div>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300">
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Update Stage */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Update Stage</h3>
            <div className="space-y-2">
              {['screening', 'interview', 'offer', 'hired', 'rejected'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleUpdateStage(stage)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    application.currentStage === stage
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
            <div className="space-y-2">
              {['submitted', 'under_review', 'shortlisted', 'interviewing', 'offer_extended', 'hired', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    application.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/recruitment/interviews/create?applicationId=${applicationId}`)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Calendar size={20} />
                Schedule Interview
              </button>
              <button
                onClick={() => router.push(`/recruitment/offers/create?applicationId=${applicationId}&candidateId=${application.candidateId._id}`)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <CheckCircle size={20} />
                Create Offer
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                <MessageSquare size={20} />
                Send Message
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 w-3 h-3 bg-blue-600 rounded-full"></div>
                <p className="text-white text-sm">Application Submitted</p>
                <p className="text-gray-400 text-xs">{formatDate(application.createdAt)}</p>
              </div>
              {application.updatedAt !== application.createdAt && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-0 w-3 h-3 bg-green-600 rounded-full"></div>
                  <p className="text-white text-sm">Last Updated</p>
                  <p className="text-gray-400 text-xs">{formatDate(application.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
