'use client';

import RecruitmentLayout from '../../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, Calendar, Clock, RefreshCw, 
  Video, Phone, MapPin, AlertCircle, Send, User
} from 'lucide-react';
import { authenticatedFetch } from '../../../../context/AuthContext';

interface Interview {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
      phone?: string;
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
    _id: string;
    name: string;
    email: string;
  }>;
  videoLink?: string;
  location?: string;
  notes?: string;
}

interface RescheduleForm {
  newDate: string;
  newTime: string;
  method: 'in_person' | 'video' | 'phone';
  location?: string;
  videoLink?: string;
  reason: string;
  notifyCandidate: boolean;
  notifyPanel: boolean;
  customMessage?: string;
}

export default function RescheduleInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<RescheduleForm>({
    newDate: '',
    newTime: '',
    method: 'video',
    reason: '',
    notifyCandidate: true,
    notifyPanel: true,
    customMessage: '',
  });

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
      generateSuggestedTimes();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      const res = await authenticatedFetch(`http://localhost:3000/interviews/${id}`);
      const data = await res.json();
      setInterview(data);
      
      // Pre-fill form with current interview data
      const scheduledDate = new Date(data.scheduledDate);
      setFormData(prev => ({
        ...prev,
        newDate: scheduledDate.toISOString().split('T')[0],
        newTime: scheduledDate.toTimeString().substring(0, 5),
        method: data.method,
        location: data.location,
        videoLink: data.videoLink,
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setLoading(false);
    }
  };

  const generateSuggestedTimes = () => {
    const suggestedTimesArray: string[] = [];
    const now = new Date();
    
    // Generate suggested times for next 3 days at 9 AM, 11 AM, 2 PM, 4 PM
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      ['09:00', '11:00', '14:00', '16:00'].forEach(time => {
        suggestedTimesArray.push(`${dateStr} ${time}`);
      });
    }
    
    setSuggestedTimes(suggestedTimesArray.slice(0, 8)); // Show 8 suggested times
  };

  const formatOriginalDateTime = (dateString: string) => {
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

  const formatSuggestedTime = (timeString: string) => {
    const [date, time] = timeString.split(' ');
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSuggestedTimeClick = (timeString: string) => {
    const [date, time] = timeString.split(' ');
    setFormData(prev => ({
      ...prev,
      newDate: date,
      newTime: time,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newScheduledDate = new Date(`${formData.newDate}T${formData.newTime}`);
      
      // Update interview with new date and status
      const updateData: any = {
        scheduledDate: newScheduledDate.toISOString(),
        method: formData.method,
        status: 'rescheduled',
      };

      if (formData.method === 'in_person' && formData.location) {
        updateData.location = formData.location;
      }
      
      if (formData.method === 'video' && formData.videoLink) {
        updateData.videoLink = formData.videoLink;
      }

      await authenticatedFetch(`http://localhost:3000/interviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      // Send notifications if selected
      if (formData.notifyCandidate || formData.notifyPanel) {
        await sendRescheduleNotifications();
      }

      router.push(`/recruitment/interviews/${id}`);
    } catch (error) {
      console.error('Error rescheduling interview:', error);
      alert('Failed to reschedule interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendRescheduleNotifications = async () => {
    try {
      const notificationData = {
        interviewId: id,
        candidateId: interview?.applicationId.candidateId,
        candidateName: interview?.applicationId.candidateId.name,
        candidateEmail: interview?.applicationId.candidateId.email,
        panelMembers: interview?.panel?.map(p => ({ id: p._id, email: p.email })),
        originalDate: interview?.scheduledDate,
        newDate: `${formData.newDate}T${formData.newTime}`,
        reason: formData.reason,
        customMessage: formData.customMessage,
        notifyCandidate: formData.notifyCandidate,
        notifyPanel: formData.notifyPanel,
      };

      // This would call a backend endpoint to send emails/notifications
      await authenticatedFetch('http://localhost:3000/interviews/reschedule-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't fail the whole reschedule if notifications fail
    }
  };

  if (loading) {
    return (
      <RecruitmentLayout title="Reschedule Interview" description="Reschedule interview">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading interview details...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  if (!interview) {
    return (
      <RecruitmentLayout title="Interview Not Found" description="The requested interview was not found">
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
    <RecruitmentLayout title="Reschedule Interview" description={`Reschedule interview with ${interview.applicationId.candidateId.name}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/recruitment/interviews/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Interview
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <RefreshCw className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reschedule Interview</h1>
              <p className="text-gray-400">
                Select a new time for interview with {interview.applicationId.candidateId.name}
              </p>
            </div>
          </div>
        </div>

        {/* Current Interview Info */}
        <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Currently Scheduled For</h2>
          
          <div className="p-4 bg-[#1a1a1a] rounded-lg mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{interview.applicationId.candidateId.name}</h3>
                  <p className="text-gray-400">{interview.applicationId.requisitionId.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar size={14} />
                      {formatOriginalDateTime(interview.scheduledDate)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      {interview.method === 'video' && <Video size={14} />}
                      {interview.method === 'phone' && <Phone size={14} />}
                      {interview.method === 'in_person' && <MapPin size={14} />}
                      {interview.method === 'in_person' ? 'In Person' : 
                       interview.method === 'video' ? 'Video Call' : 'Phone Call'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm px-3 py-1 bg-yellow-600 text-white rounded-full">
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-600/10 border border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white mb-1">Rescheduling Notice</h4>
                <p className="text-sm text-yellow-300">
                  Rescheduling this interview will automatically update the calendar event and 
                  send notifications to the candidate and panel members based on your preferences below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Date & Time */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Select New Date & Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.newDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, newDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={formData.newTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, newTime: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Suggested Times */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Suggested Times (Next 3 Days)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {suggestedTimes.map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestedTimeClick(time)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      `${formData.newDate} ${formData.newTime}` === time
                        ? 'border-blue-500 bg-blue-600/10 text-white'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-[#333333] text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {formatSuggestedTime(time)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interview Method */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Interview Method</h2>
            
            <div className="flex gap-4 mb-6">
              {(['video', 'in_person', 'phone'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, method }))}
                  className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-lg border ${
                    formData.method === method
                      ? 'border-blue-500 bg-blue-600/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {method === 'video' && <Video size={24} />}
                  {method === 'in_person' && <MapPin size={24} />}
                  {method === 'phone' && <Phone size={24} />}
                  <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {formData.method === 'video' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Video Conference Link
                </label>
                <input
                  type="url"
                  value={formData.videoLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoLink: e.target.value }))}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom/Teams link"
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            )}

            {formData.method === 'in_person' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Meeting Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Meeting room, floor, building address..."
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            )}
          </div>

          {/* Reason for Rescheduling */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Reason for Rescheduling</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Reason (Visible to Candidate)
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                required
              >
                <option value="">Select a reason...</option>
                <option value="conflict">Schedule Conflict</option>
                <option value="emergency">Emergency / Urgent Matter</option>
                <option value="unavailable">Panel Member Unavailable</option>
                <option value="technical">Technical Issues</option>
                <option value="candidate_request">Candidate Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Additional Notes (Internal)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                placeholder="Add any internal notes about the rescheduling reason..."
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Notification Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Notify Candidate</p>
                    <p className="text-sm text-gray-400">
                      {interview.applicationId.candidateId.name} ({interview.applicationId.candidateId.email})
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyCandidate}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyCandidate: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Notify Panel Members</p>
                    <p className="text-sm text-gray-400">
                      {interview.panel?.length || 0} panel member{interview.panel?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyPanel}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyPanel: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Custom Message */}
            {formData.notifyCandidate && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Custom Notification Message (Optional)
                </label>
                <textarea
                  value={formData.customMessage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  rows={3}
                  placeholder="Add a personalized message for the candidate..."
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This message will be included in the reschedule notification email to the candidate.
                </p>
              </div>
            )}
          </div>

          {/* New Schedule Preview */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Schedule Preview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#1a1a1a] rounded-lg">
                <h3 className="font-medium text-white mb-2">Previous Schedule</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={16} />
                    <span>{formatOriginalDateTime(interview.scheduledDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    {interview.method === 'video' && <Video size={16} />}
                    {interview.method === 'phone' && <Phone size={16} />}
                    {interview.method === 'in_person' && <MapPin size={16} />}
                    <span className="capitalize">{interview.method.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-600/10 border border-green-700 rounded-lg">
                <h3 className="font-medium text-white mb-2">New Schedule</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <Calendar size={16} />
                    <span>
                      {formData.newDate && formData.newTime ? (
                        new Date(`${formData.newDate}T${formData.newTime}`).toLocaleString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    {formData.method === 'video' && <Video size={16} />}
                    {formData.method === 'phone' && <Phone size={16} />}
                    {formData.method === 'in_person' && <MapPin size={16} />}
                    <span className="capitalize">{formData.method.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push(`/recruitment/interviews/${id}`)}
              className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
            >
              Cancel
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all changes?')) {
                    fetchInterviewDetails();
                  }
                }}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.newDate || !formData.newTime || !formData.reason}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {submitting ? 'Rescheduling...' : 'Reschedule Interview'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </RecruitmentLayout>
  );
}