'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Eye, CheckCircle, X, Heart } from 'lucide-react';

interface Candidate {
  _id: string;
  candidateNumber: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  mobilePhone?: string;
  status?: string;
  applicationDate?: string;
  positionId?: {
    _id: string;
    title: string;
  };
  resumeUrl?: string;
  notes?: string;
}

interface ConvertModalProps {
  candidate: Candidate;
  onClose: () => void;
  onConvert: (data: any) => void;
  isLoading?: boolean;
  departments?: any[];
  positions?: any[];
  onDepartmentChange?: (departmentId: string) => void;
  positionsLoading?: boolean;
}

function ConvertCandidateModal({ 
  candidate, 
  onClose, 
  onConvert, 
  isLoading,
  departments = [],
  positions = [],
  onDepartmentChange,
  positionsLoading = false,
}: ConvertModalProps) {
  const [formData, setFormData] = useState({
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    nationalId: '',
    personalEmail: candidate.personalEmail,
    workEmail: '',
    mobilePhone: candidate.mobilePhone || '',
    homePhone: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    primaryPositionId: '',
    primaryDepartmentId: '',
    contractType: '',
    workType: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Trigger position fetch when department changes
    if (name === 'primaryDepartmentId' && onDepartmentChange) {
      onDepartmentChange(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-white">Convert to Employee</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">National ID *</label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Personal Email</label>
              <input
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Work Email</label>
              <input
                type="email"
                name="workEmail"
                value={formData.workEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mobile Phone</label>
              <input
                type="tel"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.primaryPositionId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Department *</label>
              <select
                name="primaryDepartmentId"
                value={formData.primaryDepartmentId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Position *</label>
              <select
                name="primaryPositionId"
                value={formData.primaryPositionId}
                onChange={handleChange}
                required
                disabled={!formData.primaryDepartmentId || positionsLoading}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white disabled:opacity-50"
              >
                <option value="">
                  {positionsLoading ? 'Loading positions...' : formData.primaryDepartmentId ? 'Select Position' : 'Select Department First'}
                </option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg"
            >
              {isLoading ? 'Converting...' : 'Convert to Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/org/departments?active=true', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchPositions = async (departmentId: string) => {
    if (!departmentId) {
      setPositions([]);
      return;
    }

    setPositionsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/org/positions?departmentId=${departmentId}&active=true`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/employees/candidates/list/all', {
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('You do not have permission to view candidates.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCandidates(Array.isArray(data) ? data : data.data || []);
      } else {
        setError('Failed to fetch candidates');
      }
    } catch (err) {
      setError('Error fetching candidates');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertCandidate = async (formData: any) => {
    if (!selectedCandidate) return;

    setIsConverting(true);
    
    console.log('[CandidateManagement] Converting candidate with data:', {
      candidateId: selectedCandidate._id,
      primaryDepartmentId: formData.primaryDepartmentId,
      primaryPositionId: formData.primaryPositionId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      nationalId: formData.nationalId,
    });

    try {
      const response = await fetch(`http://localhost:3000/employees/candidates/${selectedCandidate._id}/convert`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        setError('You do not have permission to convert candidates');
        setIsConverting(false);
        return;
      }

      if (response.ok) {
        const responseData = await response.json();
        console.log('[CandidateManagement] Conversion successful:', {
          employeeId: responseData._id,
          primaryDepartmentId: responseData.primaryDepartmentId,
          primaryPositionId: responseData.primaryPositionId,
        });
        setSuccess('Candidate converted to employee successfully');
        setTimeout(() => setSuccess(''), 3000);
        setIsConvertModalOpen(false);
        setSelectedCandidate(null);
        fetchCandidates();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to convert candidate');
      }
    } catch (err) {
      setError(`Error converting candidate: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
        <h2 className="text-xl font-semibold text-white">Candidates Management</h2>
        <p className="text-gray-400 text-sm mt-1">Manage and convert candidates to employees</p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="text-green-500 mt-0.5" />
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
        {isLoading && !candidates.length ? (
          <div className="p-8 text-center text-gray-400">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No candidates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Resume</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Instructions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Application Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="border-b border-gray-700 hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <span>{candidate.firstName} {candidate.lastName}</span>
                        {candidate.status === 'CONVERTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 border border-pink-500/50 rounded text-xs text-pink-300">
                            <Heart size={12} className="fill-pink-500" />
                            Converted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{candidate.personalEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {candidate.positionId 
                        ? (typeof candidate.positionId === 'object' 
                          ? candidate.positionId.title 
                          : candidate.positionId) 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {candidate.resumeUrl ? (
                        <a 
                          href={candidate.resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline truncate max-w-xs block"
                          title={candidate.resumeUrl}
                        >
                          View Resume
                        </a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate" title={candidate.notes || ''}>
                      {candidate.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      {candidate.status !== 'CONVERTED' && (
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsConvertModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Modal */}
      {selectedCandidate && (
        <ConvertCandidateModal
          candidate={selectedCandidate}
          onClose={() => {
            setIsConvertModalOpen(false);
            setSelectedCandidate(null);
            setPositions([]);
          }}
          onConvert={handleConvertCandidate}
          isLoading={isConverting}
          departments={departments}
          positions={positions}
          onDepartmentChange={fetchPositions}
          positionsLoading={positionsLoading}
        />
      )}
    </div>
  );
}
