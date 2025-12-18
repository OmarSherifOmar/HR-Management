'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp, Award } from 'lucide-react';

interface Application {
  _id: string;
  candidateId: {
    name: string;
    email: string;
  };
  requisitionId: {
    title: string;
    department: string;
  };
  currentStage: string;
  status: string;
}

interface StageHistory {
  stage: string;
  date: string;
  changedBy: string;
  notes?: string;
}

export default function UpdateStagePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [notes, setNotes] = useState('');
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);

  const stages = [
    {
      id: 'screening',
      name: 'Screening',
      description: 'Initial resume and qualifications review',
      icon: <Clock size={20} />,
      color: 'bg-gray-600',
    },
    {
      id: 'interview',
      name: 'Interview',
      description: 'Technical and cultural fit assessment',
      icon: <TrendingUp size={20} />,
      color: 'bg-blue-600',
    },
    {
      id: 'offer',
      name: 'Offer',
      description: 'Salary negotiation and offer preparation',
      icon: <Award size={20} />,
      color: 'bg-purple-600',
    },
    {
      id: 'hired',
      name: 'Hired',
      description: 'Candidate accepted the offer',
      icon: <CheckCircle size={20} />,
      color: 'bg-green-600',
    },
    {
      id: 'rejected',
      name: 'Rejected',
      description: 'Candidate not selected',
      icon: <XCircle size={20} />,
      color: 'bg-red-600',
    },
  ];

  useEffect(() => {
    fetchApplication();
    fetchStageHistory();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:3000/applications/${applicationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        setSelectedStage(data.currentStage);
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStageHistory = async () => {
    // This would be a custom endpoint - for now, we'll mock the data
    const mockHistory: StageHistory[] = [
      { stage: 'screening', date: '2024-01-15', changedBy: 'John Smith', notes: 'Initial screening completed' },
      { stage: 'interview', date: '2024-01-20', changedBy: 'Sarah Johnson', notes: 'Technical interview scheduled' },
    ];
    setStageHistory(mockHistory);
  };

  const handleUpdateStage = async () => {
    if (!selectedStage || selectedStage === application?.currentStage) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await authenticatedFetch(
        `http://localhost:3000/applications/${applicationId}/stage/${selectedStage}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        router.push(`/recruitment/applications/${applicationId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update stage');
      }
    } catch (err) {
      setError('Error updating stage');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Update Stage" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Update Stage" description="Application not found">
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

  const currentStageInfo = stages.find(s => s.id === application.currentStage);

  return (
    <DashboardLayout 
      title="Update Application Stage" 
      description={`Update stage for ${application.candidateId.name}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Status */}
        <div className="lg:col-span-2">
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Current Status</h3>
            <div className="flex items-center gap-4">
              <div className={`${currentStageInfo?.color} p-3 rounded-lg`}>
                {currentStageInfo?.icon}
              </div>
              <div>
                <p className="text-white font-medium">{currentStageInfo?.name}</p>
                <p className="text-gray-400 text-sm">{currentStageInfo?.description}</p>
                <p className="text-white text-sm mt-2">
                  Candidate: <span className="font-medium">{application.candidateId.name}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  Position: {application.requisitionId.title} • {application.requisitionId.department}
                </p>
              </div>
            </div>
          </div>

          {/* Select New Stage */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select New Stage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedStage === stage.id
                      ? `${stage.color} text-white`
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {stage.icon}
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <p className="text-sm">{stage.description}</p>
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this stage change..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => router.push(`/recruitment/applications/${applicationId}`)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStage}
                disabled={!selectedStage || selectedStage === application.currentStage || submitting}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Stage'}
              </button>
            </div>
          </div>
        </div>

        {/* Stage History */}
        <div className="space-y-6">
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Stage History</h3>
            <div className="space-y-4">
              {stageHistory.length === 0 ? (
                <p className="text-gray-400 text-sm">No stage history available</p>
              ) : (
                stageHistory.map((history, index) => (
                  <div key={index} className="relative pl-6">
                    <div className="absolute left-0 top-0 w-3 h-3 bg-blue-600 rounded-full"></div>
                    <p className="text-white text-sm font-medium">
                      {history.stage.charAt(0).toUpperCase() + history.stage.slice(1)}
                    </p>
                    <p className="text-gray-400 text-xs">{history.date}</p>
                    <p className="text-gray-400 text-xs mt-1">Changed by: {history.changedBy}</p>
                    {history.notes && (
                      <p className="text-gray-400 text-xs mt-1 italic">"{history.notes}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stage Information */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Stage Information</h3>
            <div className="space-y-3">
              {stages.map((stage) => (
                <div key={stage.id} className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${stage.color}`}></span>
                    <span className="text-white font-medium text-sm">{stage.name}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
