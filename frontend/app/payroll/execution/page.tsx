'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Eye, Play, Lock, Unlock, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAPIUrl } from '../../utils/apiClient';

// Action buttons updated - View, Edit, Approve, Reject

interface Compensation {
  _id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  processedDate: string;
  effectiveDate: string;
}

export default function PayrollExecutionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    type: 'Signing Bonus',
    amount: '',
    currency: 'USD',
    processedDate: '',
    effectiveDate: '',
    overrideEligibility: false,
    overridePrerequisites: false
  });

  useEffect(() => {
    // Fetch employees first so we can lookup names when fetching compensations
    fetchEmployees().then((employeeList) => {
      fetchCompensations(employeeList);
    });
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      processedDate: today,
      effectiveDate: today
    }));
  }, []);

  const fetchCompensations = async (currentEmployees: any[] | null = null) => {
    const empList = currentEmployees || employees;
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching compensations...');
      const API_URL = getAPIUrl();
      // Fetch both signing bonuses and termination/resignation benefits
      const [signingResponse, terminationResponse] = await Promise.all([
        fetch(`${API_URL}/payroll-execution/signing-bonus/pending`, {
          method: 'GET',
          credentials: 'include',
        }),
        fetch(`${API_URL}/payroll-execution/termination-resignation/pending`, {
          method: 'GET',
          credentials: 'include',
        })
      ]);

      let allCompensations: Compensation[] = [];

      // Process Signing Bonuses
      if (signingResponse.ok) {
        const data = await signingResponse.json();
        let dataArray = data.bonuses || data.data || (Array.isArray(data) ? data : []);
        if (!Array.isArray(dataArray)) dataArray = [];

        const signingBonuses = dataArray.map((item: any) => {
          const employeeData = item.employeeId || item.employee;
          const employeeIdStr = typeof employeeData === 'string' ? employeeData : (employeeData?._id || item.employeeId || 'N/A');
          let employeeName = item.employeeName || employeeData?.name || employeeData?.firstName;
          let displayEmployeeId = typeof employeeIdStr === 'string' ? employeeIdStr : employeeIdStr._id || 'N/A';

          // Try to find employee in the list to get proper name and employeeNumber
          const foundEmployee = empList.find(emp => emp._id === employeeIdStr);
          if (foundEmployee) {
            if (!employeeName || employeeName === 'Unknown Employee') {
              employeeName = foundEmployee.name || `${foundEmployee.firstName || ''} ${foundEmployee.lastName || ''}`.trim();
            }
            if (foundEmployee.employeeNumber) {
              displayEmployeeId = foundEmployee.employeeNumber;
            }
          }

          if (!employeeName) employeeName = employeeData?.email || 'Unknown Employee';

          const amount = item.givenAmount || item.bonusAmount || item.amount || item.totalAmount || 0;

          // Look up type from localStorage or default to Signing Bonus
          const typeMapping = JSON.parse(localStorage.getItem('compensationTypes') || '{}');
          const compensationType = typeMapping[item._id] || item.type || 'Signing Bonus';

          return {
            _id: item._id,
            employeeId: displayEmployeeId,
            employeeName,
            type: compensationType,
            status: item.status === 'auto_processed' ? 'System Processed' :
              item.status === 'pending' ? 'Pending Approval' :
                item.status || 'Pending',
            amount,
            currency: item.currency || 'USD',
            processedDate: item.paymentDate || item.processedDate || item.createdAt || new Date().toISOString().split('T')[0],
            effectiveDate: item.effectiveDate || item.paymentDate || new Date().toISOString().split('T')[0]
          };
        });
        allCompensations = [...allCompensations, ...signingBonuses];
      }

      // Process Termination/Resignation Benefits
      if (terminationResponse.ok) {
        const data = await terminationResponse.json();
        let dataArray = data.benefits || data.data || (Array.isArray(data) ? data : []);
        if (!Array.isArray(dataArray)) dataArray = [];

        const terminationBenefits = dataArray.map((item: any) => {
          const employeeData = item.employeeId;
          const employeeIdStr = typeof employeeData === 'string' ? employeeData : (employeeData?._id || 'N/A');
          let employeeName = employeeData?.name || employeeData?.firstName;
          let displayEmployeeId = typeof employeeIdStr === 'string' ? employeeIdStr : employeeIdStr._id || 'N/A';

          const foundEmployee = empList.find(emp => emp._id === employeeIdStr);
          if (foundEmployee) {
            if (!employeeName) {
              employeeName = foundEmployee.name || `${foundEmployee.firstName || ''} ${foundEmployee.lastName || ''}`.trim();
            }
            if (foundEmployee.employeeNumber) {
              displayEmployeeId = foundEmployee.employeeNumber;
            }
          }

          if (!employeeName) employeeName = 'Unknown Employee';

          // Determine type based on benefit config or fallback
          let type = 'Termination';
          if (item.benefitId && item.benefitId.type) {
            type = item.benefitId.type;
          } else {
            // Fallback to localStorage or guess based on context if available
            const typeMapping = JSON.parse(localStorage.getItem('compensationTypes') || '{}');
            type = typeMapping[item._id] || 'Termination';
          }

          return {
            _id: item._id,
            employeeId: displayEmployeeId,
            employeeName,
            type: type,
            status: item.status === 'auto_processed' ? 'System Processed' :
              item.status === 'pending' ? 'Pending Approval' :
                item.status || 'Pending',
            amount: item.givenAmount || item.benefitAmount || 0,
            currency: 'USD', // Default as schema might not have it
            processedDate: item.createdAt || new Date().toISOString().split('T')[0],
            effectiveDate: item.createdAt || new Date().toISOString().split('T')[0]
          };
        });
        allCompensations = [...allCompensations, ...terminationBenefits];
      }

      setCompensations(allCompensations);
    } catch (err) {
      console.error('Error fetching compensations:', err);
      setError('Failed to load compensations. Make sure you are logged in and the backend is running.');
      // Fallback to empty array on error
      setCompensations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const API_URL = getAPIUrl();
      const response = await fetch(`${API_URL}/employees/list`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const employeeList = data.employees || data.data || (Array.isArray(data) ? data : []);
        setEmployees(employeeList);
        return employeeList;
      } else {
        console.error('Failed to fetch employees:', response.status, response.statusText);
        setEmployees([]);
        return [];
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
      return [];
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this compensation record? This action cannot be undone.`)) {
      return;
    }

    try {
      const API_URL = getAPIUrl();
      const comp = compensations.find(c => c._id === id);
      const endpoint = comp?.type === 'Signing Bonus'
        ? `/payroll-execution/signing-bonus/${id}`
        : `/payroll-execution/termination-resignation/${id}`; // Note: Delete might not be implemented for termination yet, assume standard REST

      // Check if delete endpoint exists for termination, if not we might need to implement it or warn user
      // For now, let's assume standard REST pattern or just try.
      // Actually, looking at controller, there is NO delete endpoint for termination/resignation.
      // We should probably block delete for now or implement it. 
      // Given the user request "fix that", I should probably implement it or at least handle the error gracefully.

      if (comp?.type !== 'Signing Bonus') {
        alert('Deletion of Termination/Resignation records is not yet supported by the backend.');
        return;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete compensation');
      }

      // Remove from state after successful deletion
      setCompensations(prev => prev.filter(c => c._id !== id));
      alert('Compensation deleted successfully');
    } catch (err) {
      console.error('Error deleting compensation:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete compensation');
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this compensation?')) {
      return;
    }

    try {
      const API_URL = getAPIUrl();
      const comp = compensations.find(c => c._id === id);
      const endpoint = comp?.type === 'Signing Bonus'
        ? `/payroll-execution/signing-bonus/${id}/approve`
        : `/payroll-execution/termination-resignation/${id}/approve`;

      const body = comp?.type === 'Signing Bonus'
        ? { bonusId: id, approverComments: `Approved by ${user?.email || 'system'}` }
        : { benefitId: id, approverComments: `Approved by ${user?.email || 'system'}` };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve compensation');
      }

      alert('Compensation approved successfully');
      // Refresh the list
      fetchCompensations();
    } catch (err) {
      console.error('Error approving compensation:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve compensation');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Please enter rejection reason (at least 10 characters):');
    if (!reason || reason.length < 10) {
      alert('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      const API_URL = getAPIUrl();
      const comp = compensations.find(c => c._id === id);
      const endpoint = comp?.type === 'Signing Bonus'
        ? `/payroll-execution/signing-bonus/${id}/reject`
        : `/payroll-execution/termination-resignation/${id}/reject`;

      const body = comp?.type === 'Signing Bonus'
        ? { bonusId: id, rejectionReason: reason }
        : { benefitId: id, rejectionReason: reason };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject compensation');
      }

      alert('Compensation rejected successfully');
      // Refresh the list
      fetchCompensations();
    } catch (err) {
      console.error('Error rejecting compensation:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject compensation');
    }
  };

  const handleEdit = (comp: Compensation) => {
    // Load compensation data into form for editing
    setEditingId(comp._id);
    setFormData({
      employeeName: comp.employeeName,
      employeeId: comp.employeeId,
      type: comp.type,
      amount: comp.amount.toString(),
      currency: comp.currency,
      processedDate: comp.processedDate,
      effectiveDate: comp.effectiveDate,
      overrideEligibility: false,
      overridePrerequisites: false
    });
    setShowCreateModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    // Validate form
    if (!formData.employeeName || !formData.employeeId || !formData.amount || !formData.processedDate || !formData.effectiveDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const API_URL = getAPIUrl();

      // Determine endpoint based on type
      const isSigningBonus = formData.type === 'Signing Bonus';
      const endpoint = isSigningBonus
        ? `/payroll-execution/signing-bonus/${editingId}/edit`
        : `/payroll-execution/termination-resignation/${editingId}/edit`;

      const body = isSigningBonus
        ? {
          bonusId: editingId,
          adjustedAmount: parseFloat(formData.amount),
          editReason: 'Manual edit via UI',
          notes: `Edited by ${user?.email || 'system'}`,
          paymentDate: formData.effectiveDate,
          currency: formData.currency
        }
        : {
          benefitId: editingId,
          adjustedAmount: parseFloat(formData.amount),
          editReason: 'Manual edit via UI',
          notes: `Edited by ${user?.email || 'system'}`,
          paymentDate: formData.effectiveDate,
          currency: formData.currency
        };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update compensation');
      }

      // Update the type in localStorage
      const typeMapping = JSON.parse(localStorage.getItem('compensationTypes') || '{}');
      typeMapping[editingId] = formData.type;
      localStorage.setItem('compensationTypes', JSON.stringify(typeMapping));

      // Reset form
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        employeeName: '',
        employeeId: '',
        type: 'Signing Bonus',
        amount: '',
        currency: 'USD',
        processedDate: today,
        effectiveDate: today,
        overrideEligibility: false,
        overridePrerequisites: false
      });

      setEditingId(null);
      setShowCreateModal(false);
      alert('Compensation record updated successfully');

      // Refresh the list
      fetchCompensations();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update compensation record';
      setError(errorMsg);
      console.error('Error updating compensation:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePayrollRun = async () => {
    // If editing, use save edit function instead
    if (editingId) {
      return handleSaveEdit();
    }

    // Validate form
    if (!formData.employeeName || !formData.employeeId || !formData.amount || !formData.processedDate || !formData.effectiveDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const API_URL = getAPIUrl();

      // Determine endpoint and body based on type
      const isSigningBonus = formData.type === 'Signing Bonus';
      const endpoint = isSigningBonus
        ? '/payroll-execution/signing-bonus'
        : '/payroll-execution/termination-resignation';

      const body = {
        employeeId: formData.employeeId,
        givenAmount: parseFloat(formData.amount),
        currency: formData.currency,
        paymentDate: formData.effectiveDate,
        type: formData.type,
        overrideEligibility: formData.overrideEligibility,
        overridePrerequisites: formData.overridePrerequisites,
      };

      // Create compensation via API
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create compensation');
      }

      const result = await response.json();

      // Store the type in localStorage keyed by ID
      const newId = result.bonus?._id || result.benefit?._id;
      if (newId) {
        const typeMapping = JSON.parse(localStorage.getItem('compensationTypes') || '{}');
        typeMapping[newId] = formData.type;
        localStorage.setItem('compensationTypes', JSON.stringify(typeMapping));
      }

      // Reset form
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        employeeName: '',
        employeeId: '',
        type: 'Signing Bonus',
        amount: '',
        currency: 'USD',
        processedDate: today,
        effectiveDate: today,
        overrideEligibility: false,
        overridePrerequisites: false
      });

      setShowCreateModal(false);
      setEditingId(null);
      alert('Compensation record created successfully');

      // Refresh the list from backend
      fetchCompensations();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create compensation record';
      setError(errorMsg);
      console.error('Error creating compensation:', err);
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
    });
  };

  const formatAmount = (amount: number) => {
    return `USD ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'In Review':
        return 'bg-blue-100 text-blue-700';
      case 'Pending Manager Approval':
        return 'bg-yellow-100 text-yellow-700';
      case 'Manager Approved':
        return 'bg-green-100 text-green-700';
      case 'Pending Finance Approval':
        return 'bg-orange-100 text-orange-700';
      case 'Finance Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Locked':
        return 'bg-purple-100 text-purple-700';
      case 'Finalized':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Processing':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout title="Payroll Execution">
      <div className="space-y-6 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#2a2a2a] rounded-lg p-6 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Payroll Runs</h2>
                <p className="text-sm text-gray-400 mt-1">Manage and review payroll execution</p>
              </div>
              <div className="flex gap-3">
                {/* Only show Add Compensation and View Runs buttons for authorized roles */}
                {user && (user.role === 'Payroll Specialist' || user.role === 'HR Manager' || user.role === 'Payroll Manager' || user.role === 'Finance Staff') && (
                  <>
                    <button
                      onClick={() => router.push('/payroll/execution/review')}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      <Eye size={18} />
                      View Runs
                    </button>

                    <button
                      onClick={() => setShowCreateModal(true)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      <span>+</span>
                      Add Compensation
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="text-white">Loading payroll runs...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Add Compensation Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {editingId ? 'Edit Compensation Record' : 'Add Compensation Record'}
                  </h3>

                  <div className="space-y-4">
                    {/* Employee Selection Dropdown */}
                    {!editingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Employee <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.employeeId}
                          onChange={(e) => {
                            const selectedEmployee = employees.find(emp => emp._id === e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              employeeId: e.target.value,
                              employeeName: selectedEmployee ? selectedEmployee.name : ''
                            }));
                          }}
                          onFocus={() => {
                            // Fetch employees when dropdown is opened
                            if (employees.length === 0) {
                              fetchEmployees();
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={creating || loadingEmployees}
                        >
                          <option value="">
                            {loadingEmployees ? 'Loading employees...' : 'Select an employee'}
                          </option>
                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.name} - {employee.email || employee.personalEmail || 'No email'}
                            </option>
                          ))}
                        </select>
                        {employees.length === 0 && !loadingEmployees && (
                          <p className="mt-1 text-sm text-gray-500">No employees found</p>
                        )}
                      </div>
                    )}

                    {/* Show employee info when editing */}
                    {editingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee
                        </label>
                        <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">{formData.employeeName}</div>
                          <div className="text-sm text-gray-500">{formData.employeeId}</div>
                        </div>
                      </div>
                    )}

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={creating}
                      >
                        <option value="Signing Bonus">Signing Bonus</option>
                        <option value="Termination">Termination</option>
                        <option value="Resignation">Resignation</option>
                      </select>
                    </div>

                    {/* Amount and Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10000"
                          min="0"
                          step="0.01"
                          disabled={creating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={creating}
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Processed Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.processedDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, processedDate: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={creating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Effective Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.effectiveDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={creating}
                        />
                      </div>
                    </div>
                    {/* Override Eligibility Checkbox */}
                    {!editingId && formData.type === 'Signing Bonus' && (
                      <div className="flex items-center mt-4">
                        <input
                          id="overrideEligibility"
                          type="checkbox"
                          checked={formData.overrideEligibility}
                          onChange={(e) => setFormData(prev => ({ ...prev, overrideEligibility: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={creating}
                        />
                        <label htmlFor="overrideEligibility" className="ml-2 block text-sm text-gray-900">
                          Override Contract Eligibility Check
                        </label>
                      </div>
                    )}

                    {/* Override Prerequisites Checkbox for Termination/Resignation */}
                    {!editingId && (formData.type === 'Termination' || formData.type === 'Resignation') && (
                      <div className="flex items-center mt-4">
                        <input
                          id="overridePrerequisites"
                          type="checkbox"
                          checked={formData.overridePrerequisites}
                          onChange={(e) => setFormData(prev => ({ ...prev, overridePrerequisites: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={creating}
                        />
                        <label htmlFor="overridePrerequisites" className="ml-2 block text-sm text-gray-900">
                          Override HR Clearance & Approval Checks
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingId(null);
                        setError(null);
                        // Reset form
                        const today = new Date().toISOString().split('T')[0];
                        setFormData({
                          employeeName: '',
                          employeeId: '',
                          type: 'Signing Bonus',
                          amount: '',
                          currency: 'USD',
                          processedDate: today,
                          effectiveDate: today,
                          overrideEligibility: false,
                          overridePrerequisites: false
                        });
                      }}
                      disabled={creating}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePayrollRun}
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all"
                    >
                      {creating ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1a1a1a] border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Processed Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Effective Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-700">
                      {compensations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                            No compensation records found
                          </td>
                        </tr>
                      ) : (
                        compensations.map((comp) => (
                          <tr key={comp._id} className="hover:bg-[#333333] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-100">
                                {comp.employeeName}
                              </div>
                              <div className="text-sm text-gray-400">
                                {comp.employeeId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${comp.type === 'Signing Bonus' ? 'bg-purple-100 text-purple-700' :
                                  comp.type === 'Termination' ? 'bg-red-100 text-red-700' :
                                    comp.type === 'Resignation' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {comp.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${comp.status === 'System Processed' ? 'bg-blue-100 text-blue-700' :
                                  comp.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' :
                                    comp.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                      comp.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {comp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                              {comp.currency} {comp.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                              {new Date(comp.processedDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                              {new Date(comp.effectiveDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              <div className="flex items-center gap-3">
                                {/* View button - always visible */}
                                <button
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={20} />
                                </button>

                                {/* Edit, Approve, Reject buttons - only for active statuses */}
                                {(comp.status.toLowerCase() !== 'approved' && comp.status.toLowerCase() !== 'rejected') && (
                                  <>
                                    {/* Edit button */}
                                    <button
                                      onClick={() => handleEdit(comp)}
                                      className="text-gray-600 hover:text-gray-800 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={20} />
                                    </button>

                                    {/* Approve/Check button */}
                                    <button
                                      onClick={() => {
                                        handleApprove(comp._id);
                                      }}
                                      className="text-green-600 hover:text-green-800 transition-colors"
                                      title="Approve"
                                    >
                                      <Check size={20} />
                                    </button>

                                    {/* Reject/Delete button */}
                                    <button
                                      onClick={() => {
                                        handleReject(comp._id);
                                      }}
                                      className="text-red-600 hover:text-red-800 transition-colors"
                                      title="Reject"
                                    >
                                      <X size={20} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

