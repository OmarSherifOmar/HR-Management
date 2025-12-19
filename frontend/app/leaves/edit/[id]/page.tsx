'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Loader,
  Upload,
  X,
  ArrowLeft
} from 'lucide-react';

interface LeaveType {
  _id: string;
  id?: string;
  name: string;
  code: string;
  remaining?: number;
  requiresAttachment?: boolean;
  attachmentType?: string;
}

interface LeaveRequest {
  _id: string;
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
    requiresAttachment?: boolean;
    attachmentType?: string;
  };
  dates: {
    from: string;
    to: string;
  };
  justification?: string;
  attachmentId?: string;
  status: string;
}

export default function EditLeaveRequestPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    justification: '',
    attachmentId: ''
  });

  const [formErrors, setFormErrors] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    justification: '',
    attachment: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [originalRequest, setOriginalRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (isLoggedIn && requestId) {
      fetchLeaveRequest();
      fetchLeaveTypes();
    }
  }, [isLoading, isLoggedIn, requestId, router]);

  const fetchLeaveRequest = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`http://localhost:3000/leave-requests/${requestId}`);
      
      if (response.ok) {
        const result = await response.json();
        const request = result.data;
        
        // Check if request is pending
        if (request.status !== 'pending') {
          setError('Only pending leave requests can be modified');
          return;
        }

        setOriginalRequest(request);
        setFormData({
          leaveTypeId: request.leaveTypeId._id,
          startDate: request.dates.from.split('T')[0],
          endDate: request.dates.to.split('T')[0],
          justification: request.justification || '',
          attachmentId: request.attachmentId || ''
        });

        setSelectedLeaveType({
          _id: request.leaveTypeId._id,
          name: request.leaveTypeId.name,
          code: request.leaveTypeId.code,
          requiresAttachment: request.leaveTypeId.requiresAttachment,
          attachmentType: request.leaveTypeId.attachmentType
        });
      } else {
        setError('Failed to load leave request');
      }
    } catch (err: any) {
      setError('Failed to load leave request');
      console.error('Error fetching leave request:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:3000/leaves/entitlements/my-balance');
      
      if (response.ok) {
        const result = await response.json();
        const types = result.data.balances.map((balance: any) => {
          // Calculate available balance based on accrued days (not full yearly entitlement)
          const accruedBalance = balance.accrued + balance.carryForward;
          const availableBalance = accruedBalance - balance.taken - balance.pending;
          
          return {
            _id: balance.leaveTypeId,
            name: balance.leaveTypeName,
            code: balance.leaveTypeCode,
            remaining: Math.max(0, availableBalance),
            requiresAttachment: balance.requiresAttachment,
            attachmentType: balance.attachmentType
          };
        });
        setLeaveTypes(types);
      }
    } catch (err: any) {
      console.error('Error fetching leave types:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      justification: '',
      attachment: ''
    };

    let isValid = true;

    if (!formData.leaveTypeId) {
      errors.leaveTypeId = 'Please select a leave type';
      isValid = false;
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
      isValid = false;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        errors.endDate = 'End date must be after start date';
        isValid = false;
      }
    }

    if (selectedLeaveType?.requiresAttachment && !formData.attachmentId && !selectedFile) {
      errors.attachment = 'Attachment is required for this leave type';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormErrors(prev => ({
        ...prev,
        attachment: 'File size must be less than 5MB'
      }));
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        attachment: 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX'
      }));
      return;
    }

    setSelectedFile(file);
    setFormErrors(prev => ({ ...prev, attachment: '' }));
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, attachmentId: '' }));
    setFormErrors(prev => ({ ...prev, attachment: '' }));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    setFormErrors(prev => ({ ...prev, attachment: '' }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const response = await authenticatedFetch('http://localhost:3000/attachments', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }

      setFormData(prev => ({ ...prev, attachmentId: data.data._id }));
      return data.data._id;
    } catch (err) {
      setFormErrors(prev => ({
        ...prev,
        attachment: err instanceof Error ? err.message : 'Failed to upload file'
      }));
      throw err;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let attachmentId = formData.attachmentId;

      if (selectedFile && !attachmentId) {
        attachmentId = await handleFileUpload();
      }

      const payload: any = {
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (formData.justification) {
        payload.justification = formData.justification;
      }

      if (attachmentId) {
        payload.attachmentId = attachmentId;
      }

      const response = await authenticatedFetch(`http://localhost:3000/leave-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to update leave request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your request');
      console.error('Error updating leave request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    if (name === 'leaveTypeId' && value !== formData.leaveTypeId) {
      const leaveType = leaveTypes.find(lt => lt._id === value);
      setSelectedLeaveType(leaveType || null);
      
      // Only clear attachment if changing to a different leave type that doesn't require attachment
      // Preserve existing attachment if it was already there
      if (selectedFile) {
        setSelectedFile(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout title="Edit Leave Request" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-blue-500" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !originalRequest) {
    return (
      <DashboardLayout title="Edit Leave Request" description="Error loading request">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => router.push('/leaves')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Leave Requests
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Leave Request"
      description="Modify your pending leave request"
    >
      {success ? (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-8 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Request Updated Successfully!</h3>
          <p className="text-gray-300">Redirecting you to your leave requests...</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/leaves')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Leave Requests
          </button>

          <form onSubmit={handleSubmit} className="bg-[#2a2a2a] rounded-lg p-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-500 font-semibold">Error</h3>
                  <p className="text-gray-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-300 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                id="leaveTypeId"
                name="leaveTypeId"
                value={formData.leaveTypeId}
                onChange={handleChange}
                className={`w-full bg-[#1a1a1a] border ${
                  formErrors.leaveTypeId ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                disabled={submitting || !!originalRequest}
              >
                <option value="">Select a leave type</option>
                {leaveTypes.map((type, index) => (
                  <option key={`${type._id}-${index}`} value={type._id}>
                    {type.name} ({type.code}) - {type.remaining} days available
                  </option>
                ))}
              </select>
              {originalRequest && (
                <p className="text-gray-400 text-sm mt-1">Leave type cannot be changed.</p>
              )}
              {formErrors.leaveTypeId && (
                <p className="text-red-500 text-sm mt-1">{formErrors.leaveTypeId}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full bg-[#1a1a1a] border ${
                    formErrors.startDate ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                  disabled={submitting}
                />
              </div>
              {formErrors.startDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className={`w-full bg-[#1a1a1a] border ${
                    formErrors.endDate ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                  disabled={submitting}
                />
              </div>
              {formErrors.endDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="justification" className="block text-sm font-medium text-gray-300 mb-2">
                Justification (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  id="justification"
                  name="justification"
                  value={formData.justification}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Provide a reason for your leave request..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Attachment Section - Always show, required flag depends on leave type */}
            {(selectedLeaveType?.requiresAttachment || formData.attachmentId || selectedFile) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Attachment {selectedLeaveType?.requiresAttachment && <span className="text-red-500">*</span>}
                </label>
                
                <p className="text-sm text-gray-400 mb-3">
                  {selectedLeaveType?.requiresAttachment 
                    ? 'This leave type requires an attachment.'
                    : 'You can optionally attach supporting documents.'
                  } Accepted formats: PDF, JPEG, PNG, GIF, DOC, DOCX (max 5MB)
                </p>

                {!selectedFile && !formData.attachmentId ? (
                  <div>
                    <input
                      type="file"
                      id="fileInput"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={submitting || uploadingFile}
                    />
                    <label
                      htmlFor="fileInput"
                      className={`flex items-center justify-center gap-2 w-full bg-[#1a1a1a] border ${
                        formErrors.attachment ? 'border-red-500' : 'border-gray-700'
                      } border-dashed rounded-lg px-4 py-8 text-gray-400 hover:text-white hover:border-blue-500 transition-colors cursor-pointer`}
                    >
                      <Upload size={24} />
                      <span>Click to upload or drag and drop</span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-400" size={20} />
                      <div>
                        <p className="text-white text-sm">{selectedFile?.name || 'Current attachment'}</p>
                        <p className="text-gray-400 text-xs">
                          {selectedFile && `${(selectedFile.size / 1024).toFixed(2)} KB`}
                          {formData.attachmentId && uploadingFile === false && (
                            <span className="text-green-400 ml-2">✓ Uploaded</span>
                          )}
                          {uploadingFile && (
                            <span className="text-blue-400 ml-2">Uploading...</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFileRemove}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      disabled={submitting || uploadingFile}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {formErrors.attachment && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.attachment}</p>
                )}

                {selectedFile && !formData.attachmentId && !uploadingFile && (
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    disabled={submitting}
                  >
                    <Upload size={18} />
                    Upload Attachment
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/leaves')}
                className="flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-[#333333] text-white rounded-lg transition-colors font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Update Request
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-400 mt-0.5" size={20} />
              <div>
                <h4 className="text-blue-400 font-semibold mb-1">Note</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Only pending requests can be modified</li>
                  <li>• Changes will reset the approval workflow</li>
                  <li>• Your updated request will be sent for approval again</li>
                  <li>• Make sure you have sufficient leave balance available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
