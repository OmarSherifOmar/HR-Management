'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { FileText, Calendar, AlertCircle, Clock, CheckCircle, XCircle, Send } from 'lucide-react';

type ResignationStatus = 'submitted' | 'approved' | 'rejected' | 'withdrawn';

type Resignation = {
  _id: string;
  employeeId: string;
  reason: string;
  additionalComments?: string;
  requestedLastWorkingDay: Date;
  actualLastWorkingDay?: Date;
  status: ResignationStatus;
  reviewedBy?: string;
  reviewComments?: string;
  reviewedAt?: Date;
  contractId: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function ResignationPage() {
  const { user } = useAuth();
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    additionalComments: '',
    requestedLastWorkingDay: '',
    contractId: '', // Will need to fetch employee's contract
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      // First get user's employee ID
      const userResponse = await fetch(`${URL}/employee-profile/me`, {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const employeeId = userData._id;

        // Then fetch their resignation requests
        const response = await fetch(`${URL}/resignation-requests/employee/${employeeId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setResignations(data);
        }
      }
    } catch (error) {
      console.error('Error fetching resignations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      // First get user's employee ID and contract ID
      const userResponse = await fetch(`${URL}/employee-profile/me`, {
        credentials: 'include',
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();

      // For now, we'll use a placeholder contract ID
      // In production, you should fetch the actual contract from the employee profile
      const requestData = {
        employeeId: userData._id,
        reason: formData.reason,
        additionalComments: formData.additionalComments,
        requestedLastWorkingDay: formData.requestedLastWorkingDay,
        contractId: userData.contractId || '000000000000000000000000', // Placeholder
      };

      const response = await fetch(`${URL}/resignation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          reason: '',
          additionalComments: '',
          requestedLastWorkingDay: '',
          contractId: '',
        });
        fetchResignations();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit resignation');
      }
    } catch (error) {
      setError('Failed to submit resignation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ResignationStatus) => {
    const badges = {
      submitted: { bg: 'bg-yellow-600', text: 'Submitted', icon: <Clock size={14} /> },
      approved: { bg: 'bg-green-600', text: 'Approved', icon: <CheckCircle size={14} /> },
      rejected: { bg: 'bg-red-600', text: 'Rejected', icon: <XCircle size={14} /> },
      withdrawn: { bg: 'bg-gray-600', text: 'Withdrawn', icon: <XCircle size={14} /> },
    };
    const badge = badges[status];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <DashboardLayout
      title="My Resignation Requests"
      description="Submit and track your resignation requests"
    >
      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Send size={20} />
          {showForm ? 'Cancel' : 'Submit Resignation'}
        </button>
      </div>

      {/* Resignation Form */}
      {showForm && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Submit Resignation Request</h3>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Resignation *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="Career Growth">Career Growth</option>
                <option value="Better Opportunity">Better Opportunity</option>
                <option value="Personal Reasons">Personal Reasons</option>
                <option value="Relocation">Relocation</option>
                <option value="Health Issues">Health Issues</option>
                <option value="Family Reasons">Family Reasons</option>
                <option value="Retirement">Retirement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Explanation (Optional)
              </label>
              <textarea
                value={formData.additionalComments}
                onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                rows={4}
                placeholder="Provide additional details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requested Last Working Day *
              </label>
              <input
                type="date"
                value={formData.requestedLastWorkingDay}
                onChange={(e) => setFormData({ ...formData, requestedLastWorkingDay: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Resignation'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resignation List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">My Requests</h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : resignations.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <FileText className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No resignation requests found</p>
            <p className="text-gray-500 text-sm mt-1">Submit your first resignation request above</p>
          </div>
        ) : (
          resignations.map((resignation) => (
            <div
              key={resignation._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold mb-1">Resignation Request</h4>
                  <p className="text-gray-400 text-sm">
                    Submitted on {new Date(resignation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(resignation.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Reason</p>
                  <p className="text-white">{resignation.reason}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Requested Last Working Day</p>
                  <p className="text-white flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(resignation.requestedLastWorkingDay).toLocaleDateString()}
                  </p>
                </div>
                {resignation.actualLastWorkingDay && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Actual Last Working Day</p>
                    <p className="text-white">{new Date(resignation.actualLastWorkingDay).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {resignation.additionalComments && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Additional Comments</p>
                  <p className="text-gray-300 text-sm">{resignation.additionalComments}</p>
                </div>
              )}

              {resignation.reviewComments && (
                <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Review Comments</p>
                  <p className="text-gray-300 text-sm">{resignation.reviewComments}</p>
                  {resignation.reviewedAt && (
                    <p className="text-gray-500 text-xs mt-2">
                      Reviewed on {new Date(resignation.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

