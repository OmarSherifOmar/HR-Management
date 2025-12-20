'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../../context/AuthContext';
import { ArrowLeft, Calendar, Video, Phone, Users } from 'lucide-react';

interface Application {
  _id: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
  };
  requisitionId: {
    _id: string;
    title: string;
  };
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function ScheduleInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    stage: 'interview' as 'screening' | 'interview' | 'offer',
    scheduledDate: '',
    scheduledTime: '',
    method: 'video' as 'video' | 'phone' | 'in_person',
    videoLink: '',
    calendarEventId: '',
    panel: [] as string[],
    duration: 60,
    notes: '',
  });

  useEffect(() => {
    fetchApplication();
    fetchEmployees();
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
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      // This endpoint would need to be created - fetching employees for panel
      const response = await authenticatedFetch(
        `${URL}/employees?role=Manager&role=HR`
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      const interviewData = {
        applicationId,
        stage: formData.stage,
        scheduledDate: scheduledDateTime.toISOString(),
        method: formData.method,
        videoLink: formData.method === 'video' ? formData.videoLink : undefined,
        panel: formData.panel.length > 0 ? formData.panel : undefined,
        calendarEventId: formData.calendarEventId || undefined,
        status: 'scheduled',
      };

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(`${URL}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      if (response.ok) {
        router.push(`/recruitment/applications/${applicationId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to schedule interview');
      }
    } catch (err) {
      setError('Error scheduling interview');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePanelToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      panel: prev.panel.includes(employeeId)
        ? prev.panel.filter(id => id !== employeeId)
        : [...prev.panel, employeeId],
    }));
  };

  if (loading) {
    return (
      <DashboardLayout title="Schedule Interview" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Schedule Interview" description="Application not found">
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <DashboardLayout 
      title="Schedule Interview" 
      description={`Schedule interview for ${application.candidateId.name}`}
    >
      <div className="mb-6">
        <button
          onClick={() => router.push(`/recruitment/applications/${applicationId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Application
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-[#2a2a2a] rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Candidate Information</h3>
          <p className="text-white">{application.candidateId.name}</p>
          <p className="text-gray-400 text-sm">{application.candidateId.email}</p>
          <p className="text-gray-400 text-sm mt-1">
            Applied for: {application.requisitionId.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Interview Stage
            </label>
            <div className="flex gap-2">
              {['screening', 'interview', 'offer'].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: stage as any })}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    formData.stage === stage
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Date
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Time
              </label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Interview Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, method: 'video' })}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.method === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                }`}
              >
                <Video size={24} />
                <span>Video Call</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, method: 'phone' })}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.method === 'phone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                }`}
              >
                <Phone size={24} />
                <span>Phone Call</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, method: 'in_person' })}
                className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.method === 'in_person'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                }`}
              >
                <Calendar size={24} />
                <span>In Person</span>
              </button>
            </div>
          </div>

          {/* Video Link (if video selected) */}
          {formData.method === 'video' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Video Conference Link
              </label>
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              />
            </div>
          )}

          {/* Panel Members */}
          <div>
            <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Users size={16} />
              Select Panel Members
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-[#1a1a1a] rounded-lg">
              {employees.map((employee) => (
                <div key={employee._id} className="flex items-center gap-3 p-2 hover:bg-[#333333] rounded">
                  <input
                    type="checkbox"
                    id={`employee-${employee._id}`}
                    checked={formData.panel.includes(employee._id)}
                    onChange={() => handlePanelToggle(employee._id)}
                    className="rounded"
                  />
                  <label htmlFor={`employee-${employee._id}`} className="flex-1 cursor-pointer">
                    <p className="text-white">{employee.name}</p>
                    <p className="text-gray-400 text-sm">{employee.email} • {employee.role}</p>
                  </label>
                </div>
              ))}
            </div>
            {formData.panel.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Selected {formData.panel.length} panel member(s)
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes & Instructions
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Add any notes or instructions for the interview..."
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.push(`/recruitment/applications/${applicationId}`)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
