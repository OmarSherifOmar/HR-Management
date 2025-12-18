'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { AlertTriangle, Search, Filter, Plus, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

type TerminationRequest = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    primaryDepartmentId?: {
      name: string;
    };
  };
  initiator: 'employee' | 'hr' | 'manager';
  reason: string;
  employeeComments?: string;
  hrComments?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'clearance_in_progress' | 'completed';
  terminationDate?: Date;
  contractId: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function TerminationsPage() {
  const { user } = useAuth();
  const [terminations, setTerminations] = useState<TerminationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    initiator: 'hr',
    reason: '',
    hrComments: '',
    terminationDate: '',
    contractId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'HR Manager' || user?.role === 'HR Admin') {
      fetchTerminations();
      fetchEmployees();
    }
  }, [user]);

  const fetchTerminations = async () => {
    try {
      const response = await fetch('http://localhost:3000/termination-requests', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTerminations(data);
      }
    } catch (error) {
      console.error('Error fetching terminations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:3000/employee-profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Fetch employee's contract ID
      const employeeResponse = await fetch(`http://localhost:3000/employee-profile/${formData.employeeId}`, {
        credentials: 'include',
      });

      if (!employeeResponse.ok) {
        throw new Error('Failed to fetch employee data');
      }

      const employeeData = await employeeResponse.json();

      const requestData = {
        employeeId: formData.employeeId,
        initiator: formData.initiator,
        reason: formData.reason,
        hrComments: formData.hrComments,
        terminationDate: formData.terminationDate,
        contractId: employeeData.contractId || '000000000000000000000000', // Placeholder
      };

      const response = await fetch('http://localhost:3000/termination-requests', {
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
          employeeId: '',
          initiator: 'hr',
          reason: '',
          hrComments: '',
          terminationDate: '',
          contractId: '',
        });
        fetchTerminations();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to initiate termination');
      }
    } catch (error) {
      setError('Failed to initiate termination. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (terminationId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/termination-requests/${terminationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchTerminations();
      }
    } catch (error) {
      console.error('Error approving termination:', error);
    }
  };

  const handleReject = async (terminationId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/termination-requests/${terminationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        fetchTerminations();
      }
    } catch (error) {
      console.error('Error rejecting termination:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-600', text: 'Pending', icon: <Clock size={14} /> },
      under_review: { bg: 'bg-blue-600', text: 'Under Review', icon: <Eye size={14} /> },
      approved: { bg: 'bg-green-600', text: 'Approved', icon: <CheckCircle size={14} /> },
      rejected: { bg: 'bg-red-600', text: 'Rejected', icon: <XCircle size={14} /> },
      clearance_in_progress: { bg: 'bg-purple-600', text: 'Clearance In Progress', icon: <Clock size={14} /> },
      completed: { bg: 'bg-gray-600', text: 'Completed', icon: <CheckCircle size={14} /> },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getInitiatorLabel = (initiator: string) => {
    const labels = {
      employee: 'Employee',
      hr: 'HR',
      manager: 'Manager',
    };
    return labels[initiator as keyof typeof labels] || initiator;
  };

  const filteredTerminations = terminations.filter((termination) => {
    const matchesSearch =
      termination.employeeId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      termination.employeeId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      termination.employeeId.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || termination.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (user?.role !== 'HR Manager' && user?.role !== 'HR Admin') {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Termination Management"
      description="Initiate and manage employee terminations"
    >
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Initiate Termination'}
        </button>

        <div className="flex-1 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by employee name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="clearance_in_progress">Clearance In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Termination Form */}
      {showForm && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Initiate Termination</h3>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Employee *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Choose an employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initiator *
              </label>
              <select
                value={formData.initiator}
                onChange={(e) => setFormData({ ...formData, initiator: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Termination *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                rows={4}
                placeholder="Provide detailed justification..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                HR Comments (Optional)
              </label>
              <textarea
                value={formData.hrComments}
                onChange={(e) => setFormData({ ...formData, hrComments: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Additional HR notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Termination Date *
              </label>
              <input
                type="date"
                value={formData.terminationDate}
                onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Initiating...' : 'Initiate Termination'}
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

      {/* Termination List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Termination Requests ({filteredTerminations.length})
        </h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredTerminations.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <FileText className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No termination requests found</p>
          </div>
        ) : (
          filteredTerminations.map((termination) => (
            <div
              key={termination._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">
                    {termination.employeeId.firstName} {termination.employeeId.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {termination.employeeId.employeeNumber}
                    {termination.employeeId.primaryDepartmentId &&
                      ` • ${termination.employeeId.primaryDepartmentId.name}`
                    }
                  </p>
                </div>
                {getStatusBadge(termination.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Initiated By</p>
                  <p className="text-white">{getInitiatorLabel(termination.initiator)}</p>
                </div>
                {termination.terminationDate && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Termination Date</p>
                    <p className="text-white">
                      {new Date(termination.terminationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-sm mb-1">Date Initiated</p>
                  <p className="text-white">
                    {new Date(termination.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Reason</p>
                <p className="text-gray-300 text-sm">{termination.reason}</p>
              </div>

              {termination.hrComments && (
                <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">HR Comments</p>
                  <p className="text-gray-300 text-sm">{termination.hrComments}</p>
                </div>
              )}

              {termination.employeeComments && (
                <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Employee Comments</p>
                  <p className="text-gray-300 text-sm">{termination.employeeComments}</p>
                </div>
              )}

              {termination.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(termination._id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(termination._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

