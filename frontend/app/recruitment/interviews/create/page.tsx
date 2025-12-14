'use client';

import RecruitmentLayout from '../../layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Calendar, Clock, Users, Video, 
  Phone, MapPin, User, X, Plus, Search 
} from 'lucide-react';
import { authenticatedFetch } from '../../../context/AuthContext';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Application {
  _id: string;
  candidateId: Candidate;
  requisitionId: {
    title: string;
    department: string;
  };
  currentStage: string;
}

interface PanelMember {
  _id: string;
  name: string;
  role: string;
  department: string;
}

export default function CreateInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([]);
  const [searchCandidate, setSearchCandidate] = useState('');
  const [searchPanel, setSearchPanel] = useState('');
  
  const [formData, setFormData] = useState({
    applicationId: '',
    stage: 'screening',
    scheduledDate: '',
    scheduledTime: '',
    method: 'video',
    duration: '60',
    location: '',
    videoLink: '',
    notes: '',
    panel: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, panelRes] = await Promise.all([
        authenticatedFetch('http://localhost:3000/applications?status=shortlisted&limit=50'),
        authenticatedFetch('http://localhost:3000/employees?limit=50'),
      ]);
      
      const appsData = await appsRes.json();
      const panelData = await panelRes.json();
      
      setApplications(appsData);
      setPanelMembers(panelData.map((emp: any) => ({
        _id: emp._id,
        name: emp.name,
        role: emp.position,
        department: emp.department,
      })));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app =>
    app.candidateId.name.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    app.candidateId.email.toLowerCase().includes(searchCandidate.toLowerCase()) ||
    app.requisitionId.title.toLowerCase().includes(searchCandidate.toLowerCase())
  );

  const filteredPanel = panelMembers.filter(member =>
    member.name.toLowerCase().includes(searchPanel.toLowerCase()) ||
    member.role.toLowerCase().includes(searchPanel.toLowerCase()) ||
    member.department.toLowerCase().includes(searchPanel.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const interviewData = {
        applicationId: formData.applicationId,
        stage: formData.stage,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString(),
        method: formData.method,
        panel: formData.panel,
        videoLink: formData.method === 'video' ? formData.videoLink : undefined,
        location: formData.method === 'in_person' ? formData.location : undefined,
        notes: formData.notes,
        status: 'scheduled',
      };

      const res = await authenticatedFetch('http://localhost:3000/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });

      if (res.ok) {
        router.push('/recruitment/interviews');
      } else {
        throw new Error('Failed to create interview');
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Failed to schedule interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePanelToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      panel: prev.panel.includes(memberId)
        ? prev.panel.filter(id => id !== memberId)
        : [...prev.panel, memberId],
    }));
  };

  if (loading) {
    return (
      <RecruitmentLayout title="Schedule Interview" description="Create a new interview">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout title="Schedule Interview" description="Create a new interview">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Interviews
          </button>
          <h1 className="text-2xl font-bold text-white">Schedule New Interview</h1>
          <p className="text-gray-400">Fill in the details to schedule an interview</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate Selection */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">1. Select Candidate</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search Candidate or Application
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by candidate name, email, or position..."
                  value={searchCandidate}
                  onChange={(e) => setSearchCandidate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredApplications.map(app => (
                <div
                  key={app._id}
                  className={`p-4 mb-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.applicationId === app._id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-[#333333]'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, applicationId: app._id }))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{app.candidateId.name}</p>
                        <p className="text-sm text-gray-400">{app.candidateId.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{app.requisitionId.title}</p>
                      <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded capitalize">
                        {app.currentStage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Details */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">2. Interview Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="screening">Screening</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="hr">HR</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Method</label>
                <div className="flex gap-2">
                  {['video', 'in_person', 'phone'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, method }))}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg border ${
                        formData.method === method
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {method === 'video' && <Video size={18} />}
                      {method === 'in_person' && <MapPin size={18} />}
                      {method === 'phone' && <Phone size={18} />}
                      <span className="capitalize">{method.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>

              {formData.method === 'video' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Video Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom/Teams link"
                    value={formData.videoLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoLink: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              )}

              {formData.method === 'in_person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Meeting room, floor, building address..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Panel Members */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">3. Select Panel Members</h2>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search panel members by name or role..."
                  value={searchPanel}
                  onChange={(e) => setSearchPanel(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.panel.map(memberId => {
                  const member = panelMembers.find(m => m._id === memberId);
                  return member ? (
                    <div key={memberId} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 rounded-full">
                      <span className="text-sm text-white">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => handlePanelToggle(memberId)}
                        className="text-gray-300 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {filteredPanel.map(member => (
                  <div
                    key={member._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.panel.includes(member._id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-[#333333]'
                    }`}
                    onClick={() => handlePanelToggle(member._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">{member.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.role} • {member.department}</p>
                      </div>
                      {formData.panel.includes(member._id) && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">4. Additional Notes</h2>
            <textarea
              placeholder="Add any special instructions, topics to cover, or notes for the panel..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.applicationId}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </RecruitmentLayout>
  );
}