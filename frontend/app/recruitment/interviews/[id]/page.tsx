'use client';

import RecruitmentLayout from '../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, Users, Video, Phone, 
  MapPin, User, Mail, FileText, CheckCircle, XCircle,
  Edit, Trash2, Download, Printer, Send, MoreVertical
} from 'lucide-react';
import { authenticatedFetch } from '../../../context/AuthContext';

interface Interview {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
      phone?: string;
      resume?: string;
    };
    requisitionId: {
      title: string;
      department: string;
    };
    currentStage: string;
    status: string;
  };
  stage: string;
  scheduledDate: string;
  method: 'in_person' | 'video' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  panel?: Array<{
    _id: string;
    name: string;
    role: string;
    department: string;
    email: string;
  }>;
  videoLink?: string;
  location?: string;
  notes?: string;
  candidateFeedback?: string;
  feedbackId?: string;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  _id: string;
  interviewId: string;
  interviewerId: {
    name: string;
    role: string;
  };
  ratings: {
    technical: number;
    communication: number;
    cultureFit: number;
    problemSolving: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: 'hire' | 'maybe' | 'no_hire';
  notes: string;
  submittedAt: string;
}

export default function InterviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'feedback' | 'notes'>('details');

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/interviews/${id}`);
      const data = await res.json();
      setInterview(data);
      
      // If feedback exists, fetch it
      if (data.feedbackId) {
        const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const feedbackRes = await authenticatedFetch(`${URL}/feedback/${data.feedbackId}`);
        const feedbackData = await feedbackRes.json();
        setFeedback(feedbackData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
      case 'video': return <Video className="w-5 h-5 text-blue-400" />;
      case 'phone': return <Phone className="w-5 h-5 text-green-400" />;
      case 'in_person': return <MapPin className="w-5 h-5 text-purple-400" />;
      default: return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const getMethodText = (method: string) => {
    return method === 'in_person' ? 'In Person' : 
           method === 'video' ? 'Video Call' : 
           'Phone Call';
  };

  const handleStartInterview = () => {
    if (interview?.method === 'video' && interview.videoLink) {
      window.open(interview.videoLink, '_blank');
    }
    // Update status to in-progress or similar
  };

  const handleMarkComplete = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      await authenticatedFetch(`${URL}/interviews/${id}/status/completed`, {
        method: 'PUT',
      });
      fetchInterviewDetails();
    } catch (error) {
      console.error('Error marking interview as complete:', error);
    }
  };

  const handleCancelInterview = async () => {
    if (confirm('Are you sure you want to cancel this interview?')) {
      try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        await authenticatedFetch(`${URL}/interviews/${id}/status/cancelled`, {
          method: 'PUT',
        });
        fetchInterviewDetails();
      } catch (error) {
        console.error('Error cancelling interview:', error);
      }
    }
  };

  const handleSendReminder = async () => {
    try {
      // Send reminder email to candidate and panel
      alert('Reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading interview details...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  if (!interview) {
    return (
      <RecruitmentLayout>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Interview Not Found</h3>
          <p className="text-gray-400 mb-6">The interview you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/recruitment/interviews')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Back to Interviews
          </button>
        </div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/recruitment/interviews')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Interviews
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Interview Details</h1>
              <p className="text-gray-400">Scheduled for {formatDateTime(interview.scheduledDate)}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {interview.status === 'scheduled' && (
                <>
                  <button
                    onClick={handleStartInterview}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    {interview.method === 'video' ? 'Join Meeting' : 'Start Interview'}
                  </button>
                  <button
                    onClick={() => router.push(`/recruitment/interviews/${id}/reschedule`)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
                  >
                    Reschedule
                  </button>
                </>
              )}
              {interview.status === 'completed' && !feedback && (
                <button
                  onClick={() => router.push(`/recruitment/interviews/${id}/feedback`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <FileText size={18} />
                  Add Feedback
                </button>
              )}
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${getStatusColor(interview.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">
                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
              </span>
              <span className="text-sm opacity-90">
                {interview.stage.charAt(0).toUpperCase() + interview.stage.slice(1)} Interview
              </span>
            </div>
            <div className="flex gap-2">
              {interview.status === 'scheduled' && (
                <>
                  <button
                    onClick={handleSendReminder}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded"
                  >
                    Send Reminder
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded"
                  >
                    Mark Complete
                  </button>
                </>
              )}
              <button
                onClick={handleCancelInterview}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded"
              >
                {interview.status === 'cancelled' ? 'Delete' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-[#2a2a2a] rounded-lg">
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'details'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Interview Details
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'feedback'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Feedback {feedback && `(${feedback.recommendation === 'hire' ? '✓' : '?'})`}
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'notes'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Notes & Attachments
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Candidate Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Candidate Information</h3>
                      <div className="bg-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                              <div>
                                <h4 className="text-xl font-bold text-white">{interview.applicationId.candidateId.name}</h4>
                                <p className="text-gray-400">Candidate for {interview.applicationId.requisitionId.title}</p>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`mailto:${interview.applicationId.candidateId.email}`}
                                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-2"
                                >
                                  <Mail size={14} />
                                  Email
                                </a>
                                {interview.applicationId.candidateId.resume && (
                                  <a
                                    href={interview.applicationId.candidateId.resume}
                                    target="_blank"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2"
                                  >
                                    <FileText size={14} />
                                    Resume
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Email</p>
                                <p className="text-white">{interview.applicationId.candidateId.email}</p>
                              </div>
                              {interview.applicationId.candidateId.phone && (
                                <div>
                                  <p className="text-sm text-gray-400">Phone</p>
                                  <p className="text-white">{interview.applicationId.candidateId.phone}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-400">Position</p>
                                <p className="text-white">{interview.applicationId.requisitionId.title}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Application Status</p>
                                <p className="text-white capitalize">{interview.applicationId.status.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interview Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Interview Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-400">Date & Time</p>
                              <p className="text-white">{formatDateTime(interview.scheduledDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getMethodIcon(interview.method)}
                            <div>
                              <p className="text-sm text-gray-400">Method</p>
                              <p className="text-white">{getMethodText(interview.method)}</p>
                            </div>
                          </div>
                          {interview.method === 'video' && interview.videoLink && (
                            <div className="flex items-center gap-3">
                              <Video className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-sm text-gray-400">Video Link</p>
                                <a
                                  href={interview.videoLink}
                                  target="_blank"
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            </div>
                          )}
                          {interview.method === 'in_person' && interview.location && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-sm text-gray-400">Location</p>
                                <p className="text-white">{interview.location}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Stage</p>
                            <span className="text-xs px-3 py-1 bg-gray-700 text-white rounded-full capitalize">
                              {interview.stage.replace('_', ' ')} Interview
                            </span>
                          </div>
                          {interview.notes && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2">Notes</p>
                              <p className="text-white">{interview.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div>
                    {feedback ? (
                      <div className="space-y-6">
                        <div className="bg-[#1a1a1a] rounded-lg p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-semibold text-white">Interview Feedback</h4>
                              <p className="text-gray-400">Submitted by {feedback.interviewerId.name}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg ${
                              feedback.recommendation === 'hire' ? 'bg-green-600' :
                              feedback.recommendation === 'maybe' ? 'bg-yellow-600' : 'bg-red-600'
                            } text-white`}>
                              {feedback.recommendation === 'hire' ? 'Hire Recommended' :
                               feedback.recommendation === 'maybe' ? 'Needs Review' : 'Not Recommended'}
                            </div>
                          </div>

                          {/* Ratings */}
                          <div className="mb-6">
                            <h5 className="font-medium text-white mb-4">Ratings</h5>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {Object.entries(feedback.ratings).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <p className="text-sm text-gray-400 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                  <div className="text-2xl font-bold text-white">{value}/5</div>
                                  <div className="flex justify-center mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 mx-0.5 rounded-full ${
                                          i < value ? 'bg-yellow-500' : 'bg-gray-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h5 className="font-medium text-white mb-2">Strengths</h5>
                              <ul className="space-y-2">
                                {feedback.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-white">{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-white mb-2">Areas for Improvement</h5>
                              <ul className="space-y-2">
                                {feedback.weaknesses.map((weakness, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-white">{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Notes */}
                          {feedback.notes && (
                            <div>
                              <h5 className="font-medium text-white mb-2">Additional Notes</h5>
                              <p className="text-white bg-[#2a2a2a] p-4 rounded-lg">{feedback.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : interview.status === 'completed' ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No Feedback Submitted</h3>
                        <p className="text-gray-400 mb-6">Feedback hasn't been submitted for this interview yet.</p>
                        <button
                          onClick={() => router.push(`/recruitment/interviews/${id}/feedback`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                        >
                          Add Feedback Now
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Interview Not Completed</h3>
                        <p className="text-gray-400">Feedback will be available after the interview is completed.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Interview Notes</h4>
                      <textarea
                        placeholder="Add notes about the interview..."
                        defaultValue={interview.notes || ''}
                        rows={6}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                      />
                      <div className="flex justify-end mt-2">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                          Save Notes
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Attachments</h4>
                      <div className="space-y-3">
                        {interview.applicationId.candidateId.resume && (
                          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">Resume</p>
                                <p className="text-sm text-gray-400">Candidate's resume</p>
                              </div>
                            </div>
                            <a
                              href={interview.applicationId.candidateId.resume}
                              target="_blank"
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                            >
                              Download
                            </a>
                          </div>
                        )}
                        {/* Add more attachments as needed */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Panel & Actions */}
          <div className="space-y-6">
            {/* Panel Members */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Panel Members</h3>
              <div className="space-y-4">
                {interview.panel?.map((member) => (
                  <div key={member._id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{member.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-sm text-gray-400">{member.role}</p>
                      <p className="text-xs text-gray-500">{member.department}</p>
                    </div>
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    >
                      <Mail size={16} />
                    </a>
                  </div>
                ))}
                {(!interview.panel || interview.panel.length === 0) && (
                  <p className="text-gray-400 text-center py-4">No panel members assigned</p>
                )}
              </div>
              
              {interview.status === 'scheduled' && (
                <button
                  onClick={() => router.push(`/recruitment/interviews/${id}?edit=panel`)}
                  className="w-full mt-4 py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg"
                >
                  + Add Panel Member
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {interview.status === 'scheduled' && (
                  <>
                    <button
                      onClick={handleStartInterview}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >
                      {interview.method === 'video' ? 'Join Meeting' : 'Start Interview'}
                    </button>
                    <button
                      onClick={() => router.push(`/recruitment/interviews/${id}/reschedule`)}
                      className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={handleSendReminder}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                    >
                      Send Reminder
                    </button>
                  </>
                )}
                {interview.status === 'completed' && !feedback && (
                  <button
                    onClick={() => router.push(`/recruitment/interviews/${id}/feedback`)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    Submit Feedback
                  </button>
                )}
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center justify-center gap-2">
                  <Download size={18} />
                  Export Details
                </button>
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center justify-center gap-2">
                  <Printer size={18} />
                  Print
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-white">Interview Scheduled</p>
                    <p className="text-sm text-gray-400">
                      {new Date(interview.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {interview.status === 'completed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-white">Interview Completed</p>
                      <p className="text-sm text-gray-400">
                        {new Date(interview.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {feedback && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-white">Feedback Submitted</p>
                      <p className="text-sm text-gray-400">
                        {new Date(feedback.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}