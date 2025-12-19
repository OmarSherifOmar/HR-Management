'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/app/context/AuthContext';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import {
  AlertCircle,
  Check,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ChangeRequest {
  _id: string;
  requestDescription: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
}

const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SelfServiceChangeRequests() {
  const { user } = useAuth();
  const { canRequestDataCorrection } = useCanAccess();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notifiedApprovedIds, setNotifiedApprovedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    field: '',
    oldValue: '',
    newValue: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingCurrentValue, setFetchingCurrentValue] = useState(false);

  // Fetch change requests on mount
  useEffect(() => {
    const fetchChangeRequests = async () => {
      setIsFetching(true);
      try {
        console.log('[SelfServiceChangeRequests] Fetching my change requests...');
        const response = await fetch(`${URL}/employees/me/change-requests`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          console.warn('[SelfServiceChangeRequests] Not authenticated');
          setError('Your session has expired. Please log in again.');
          return;
        }

        if (response.status === 403) {
          console.warn('[SelfServiceChangeRequests] Access forbidden');
          setError('Access Denied: You do not have permission to view change requests. Please contact your administrator.');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log('[SelfServiceChangeRequests] Fetched requests:', data);
          setRequests(Array.isArray(data) ? data : []);
        } else {
          console.error('[SelfServiceChangeRequests] Failed to fetch:', response.status);
          setError(`Failed to load change requests: ${response.status}`);
        }
      } catch (err) {
        console.error('[SelfServiceChangeRequests] Error fetching requests:', err);
        setError('Failed to load change requests. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };

    if (user) {
      fetchChangeRequests();
    }
  }, [user]);

  // Detect when change requests are approved and refresh profile (only once per request)
  useEffect(() => {
    const checkForApprovedChanges = () => {
      const newlyApprovedRequests = requests.filter(
        (req) => req.status === 'APPROVED' && !notifiedApprovedIds.has(req._id)
      );

      if (newlyApprovedRequests.length > 0) {
        console.log('[SelfServiceChangeRequests] Detected newly approved requests:', newlyApprovedRequests);
        
        // Add these request IDs to the notified set
        const updatedNotified = new Set(notifiedApprovedIds);
        newlyApprovedRequests.forEach((req) => updatedNotified.add(req._id));
        setNotifiedApprovedIds(updatedNotified);

        // Dispatch custom event that parent components (like SelfServiceContactInfo) can listen to
        window.dispatchEvent(
          new CustomEvent('profileUpdated', {
            detail: { approvedRequests: newlyApprovedRequests },
          })
        );

        // Show success notification
        setSuccess('Your profile has been updated with approved changes!');
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    checkForApprovedChanges();
  }, [requests, notifiedApprovedIds]);

  // Fetch current value when field is selected
  useEffect(() => {
    const fetchCurrentValue = async () => {
      if (!formData.field) {
        setFormData((prev) => ({
          ...prev,
          oldValue: '',
        }));
        return;
      }

      setFetchingCurrentValue(true);
      try {
        console.log('[SelfServiceChangeRequests] Fetching current value for field:', formData.field);
        const response = await fetch(`${URL}/employees/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[SelfServiceChangeRequests] Employee data:', data);

          let currentValue = '';

          // Handle different field types
          switch (formData.field) {
            case 'firstName':
              currentValue = data.firstName || '';
              break;
            case 'lastName':
              currentValue = data.lastName || '';
              break;
            case 'personalEmail':
              currentValue = data.personalEmail || '';
              break;
            case 'mobilePhone':
              currentValue = data.mobilePhone || '';
              break;
            case 'address':
              currentValue = data.address?.streetAddress || '';
              break;
            case 'dateOfBirth':
              currentValue = data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : '';
              break;
            case 'nationality':
              currentValue = data.nationality || '';
              break;
            case 'bloodType':
              currentValue = data.bloodType || '';
              break;
            case 'maritalStatus':
              currentValue = data.maritalStatus || '';
              break;
            default:
              currentValue = '';
          }

          console.log('[SelfServiceChangeRequests] Current value:', currentValue);
          setFormData((prev) => ({
            ...prev,
            oldValue: currentValue,
          }));
        }
      } catch (err) {
        console.error('[SelfServiceChangeRequests] Error fetching current value:', err);
        setError('Failed to fetch current value. Please try again.');
      } finally {
        setFetchingCurrentValue(false);
      }
    };

    fetchCurrentValue();
  }, [formData.field]);

  const fields = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'nationality',
    'personalEmail',
    'mobilePhone',
    'address',
    'bloodType',
    'maritalStatus',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${URL}/employees/change-requests`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field: formData.field,
            oldValue: formData.oldValue,
            newValue: formData.newValue,
            reason: formData.reason,
          }),
        }
      );

      if (response.status === 403) {
        throw new Error('Access Denied: You do not have permission to submit change requests. Please contact your administrator.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit change request');
      }

      const newRequest = await response.json();
      console.log('[SelfServiceChangeRequests] Created request:', newRequest);

      setSuccess('Change request submitted successfully!');
      setFormData({
        field: '',
        oldValue: '',
        newValue: '',
        reason: '',
      });
      setShowForm(false);

      // Refresh the requests list
      try {
        const refreshResponse = await fetch(`${URL}/employees/me/change-requests`, {
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          console.log('[SelfServiceChangeRequests] Refreshed requests:', refreshedData);
          setRequests(Array.isArray(refreshedData) ? refreshedData : []);
        }
      } catch (fetchErr) {
        console.error('[SelfServiceChangeRequests] Failed to refresh requests:', fetchErr);
      }
    } catch (err) {
      console.error('[SelfServiceChangeRequests] Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-900/20 border-green-700 text-green-200';
      case 'REJECTED':
        return 'bg-red-900/20 border-red-700 text-red-200';
      case 'PENDING':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-200';
      default:
        return 'bg-gray-700 border-gray-600 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  return (
    <RoleBasedAccess requiredAccess={canRequestDataCorrection}>
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Data Correction Requests
          </h3>
          <div className="flex gap-2">
            {!showForm && (
              <>
                <button
                  onClick={async () => {
                    setIsFetching(true);
                    try {
                      const response = await fetch(`${URL}/employees/me/change-requests`, {
                        credentials: 'include',
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setRequests(Array.isArray(data) ? data : []);
                      }
                    } catch (err) {
                      console.error('Error refreshing requests:', err);
                    } finally {
                      setIsFetching(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                  title="Refresh request list"
                >
                  🔄
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <FileText size={16} />
                  New Request
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-[#1a1a1a] border border-gray-600 rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Field to Change
                </label>
                <select
                  value={formData.field}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      field: e.target.value,
                    }))
                  }
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select a field</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Current Value
                  </label>
                  <input
                    type="text"
                    value={formData.oldValue}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none cursor-not-allowed opacity-75"
                    placeholder={fetchingCurrentValue ? 'Loading...' : 'No value'}
                  />
                  {fetchingCurrentValue && (
                    <p className="text-xs text-gray-400 mt-1">Fetching current value...</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    New Value
                  </label>
                  <input
                    type="text"
                    value={formData.newValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newValue: e.target.value,
                      }))
                    }
                    className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="New value"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reason for Change
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Explain why this change is needed"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Check size={16} />
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      field: '',
                      oldValue: '',
                      newValue: '',
                      reason: '',
                    });
                  }}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          {isFetching ? (
            <p className="text-gray-400 text-sm">Loading change requests...</p>
          ) : requests.length === 0 && !showForm ? (
            <p className="text-gray-400 text-sm">No change requests yet.</p>
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className={`p-4 border rounded-lg ${getStatusColor(
                  req.status
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{req.requestDescription}</p>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(req.status)}
                    <span className="text-xs font-semibold uppercase">
                      {req.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs opacity-75 mb-2">{req.reason}</p>
                <p className="text-xs opacity-60">
                  Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </RoleBasedAccess>
  );
}
