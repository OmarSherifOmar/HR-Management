'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, TrendingUp, TrendingDown, DollarSign, RotateCcw, Search } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

interface LeaveType {
  _id: string;
  name: string;
  code: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
}

interface Entitlement {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  leaveTypeId: {
    _id: string;
    name: string;
    code: string;
  };
  yearlyEntitlement: number;
  remaining: number;
  taken: number;
  pending: number;
}

export default function PersonalizedEntitlementsPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Eligibility options from database
  const [eligibilityOptions, setEligibilityOptions] = useState<{
    departments: Array<{ code: string; name: string }>;
    positions: Array<{ code: string; title: string }>;
    contractTypes: string[];
    employeeStatuses: string[];
  }>({ departments: [], positions: [], contractTypes: [], employeeStatuses: [] });
  
  // Assignment form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    yearlyEntitlement: 0,
    reason: '',
  });

  // Bulk assignment form
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    employeeIds: '',
    leaveTypeId: '',
    yearlyEntitlement: 0,
    reason: '',
  });

  // Adjustment form
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    adjustmentType: 'BONUS',
    amount: 0,
    reason: '',
  });

  // Add Entitlement with Eligibility form
  const [showAddEntitlementModal, setShowAddEntitlementModal] = useState(false);
  const [addEntitlementForm, setAddEntitlementForm] = useState({
    leaveTypeId: '',
    yearlyEntitlement: 0,
    reason: '',
    eligibilityRules: {
      minTenureMonths: 0,
      positionsAllowed: [] as string[],
      contractTypesAllowed: [] as string[],
      allPositionsAllowed: false,
      allContractTypesAllowed: false,
    },
  });

  useEffect(() => {
    fetchLeaveTypes();
    fetchEmployees();
    fetchEligibilityOptions();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/types', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data);
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:3000/employees/searchs', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchEligibilityOptions = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/personalized-entitlements/eligibility-options', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEligibilityOptions(data);
      }
    } catch (err) {
      console.error('Error fetching eligibility options:', err);
    }
  };

  const fetchEntitlements = async (employeeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/leaves/personalized-entitlements/employee/${employeeId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch entitlements');
      }

      const data = await response.json();
      setEntitlements(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setEntitlements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      fetchEntitlements(employeeId);
    } else {
      setEntitlements([]);
    }
  };

  const assignEntitlement = async () => {
    try {
      // Validate all required fields
      if (!assignForm.employeeId || !assignForm.leaveTypeId || !assignForm.yearlyEntitlement) {
        alert('Please fill in all required fields');
        return;
      }

      if (assignForm.yearlyEntitlement <= 0) {
        alert('Yearly entitlement must be greater than 0');
        return;
      }

      const response = await fetch('http://localhost:3000/leaves/personalized-entitlements/assign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign entitlement');
      }

      alert('Entitlement assigned successfully');
      setShowAssignModal(false);
      setAssignForm({ employeeId: '', leaveTypeId: '', yearlyEntitlement: 0, reason: '' });
      if (selectedEmployee) fetchEntitlements(selectedEmployee);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const bulkAssign = async () => {
    try {
      const employeeIds = bulkForm.employeeIds.split(',').map(id => id.trim()).filter(Boolean);
      
      // Validate all required fields
      if (employeeIds.length === 0) {
        alert('Please enter at least one employee ID');
        return;
      }

      if (!bulkForm.leaveTypeId) {
        alert('Please select a leave type');
        return;
      }

      if (bulkForm.yearlyEntitlement <= 0) {
        alert('Yearly entitlement must be greater than 0');
        return;
      }

      if (!bulkForm.reason) {
        alert('Please provide a reason');
        return;
      }
      
      const response = await fetch('http://localhost:3000/leaves/personalized-entitlements/bulk-assign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds,
          leaveTypeId: bulkForm.leaveTypeId,
          yearlyEntitlement: bulkForm.yearlyEntitlement,
          reason: bulkForm.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk assign');
      }

      const result = await response.json();
      alert(`Successfully assigned to ${result.assigned || employeeIds.length} employees`);
      setShowBulkModal(false);
      setBulkForm({ employeeIds: '', leaveTypeId: '', yearlyEntitlement: 0, reason: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addAdjustment = async () => {
    try {
      // Validate all required fields
      if (!adjustmentForm.employeeId || !adjustmentForm.leaveTypeId) {
        alert('Please select employee and leave type');
        return;
      }

      if (adjustmentForm.amount <= 0) {
        alert('Amount must be greater than 0');
        return;
      }

      if (!adjustmentForm.reason) {
        alert('Please provide a reason');
        return;
      }

      const response = await fetch('http://localhost:3000/leaves/personalized-entitlements/adjustment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add adjustment');
      }

      alert('Adjustment added successfully');
      setShowAdjustmentModal(false);
      setAdjustmentForm({ employeeId: '', leaveTypeId: '', adjustmentType: 'BONUS', amount: 0, reason: '' });
      if (selectedEmployee) fetchEntitlements(selectedEmployee);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetEntitlement = async (employeeId: string, leaveTypeId: string) => {
    if (!confirm('Reset this entitlement to policy default?')) return;

    try {
      const response = await fetch(`http://localhost:3000/leaves/personalized-entitlements/reset/${employeeId}/${leaveTypeId}`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset entitlement');
      }

      alert('Entitlement reset to default');
      fetchEntitlements(employeeId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addEntitlementWithEligibility = async () => {
    try {
      // Validate required fields
      if (!addEntitlementForm.leaveTypeId) {
        alert('Please select a leave type');
        return;
      }

      if (addEntitlementForm.yearlyEntitlement <= 0) {
        alert('Yearly entitlement must be greater than 0');
        return;
      }

      // Validate at least one eligibility criterion is defined
      const rules = addEntitlementForm.eligibilityRules;
      const hasAnyCriteria =
        rules.minTenureMonths > 0 ||
        rules.positionsAllowed.length > 0 ||
        rules.contractTypesAllowed.length > 0 ||
        rules.allPositionsAllowed ||
        rules.allContractTypesAllowed;

      if (!hasAnyCriteria) {
        alert('Please define at least one eligibility criterion (minimum tenure, positions, contract types, or select "All" options)');
        return;
      }

      const response = await fetch('http://localhost:3000/leaves/personalized-entitlements/add-with-eligibility', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addEntitlementForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add entitlement');
      }

      const result = await response.json();
      alert(`Successfully added entitlement to ${result.assignedCount || 0} eligible employees`);
      setShowAddEntitlementModal(false);
      setAddEntitlementForm({
        leaveTypeId: '',
        yearlyEntitlement: 0,
        reason: '',
        eligibilityRules: {
          minTenureMonths: 0,
          positionsAllowed: [],
          contractTypesAllowed: [],
          allPositionsAllowed: false,
          allContractTypesAllowed: false,
        },
      });
      if (selectedEmployee) fetchEntitlements(selectedEmployee);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleEligibilityArray = (field: keyof typeof addEntitlementForm.eligibilityRules, value: string) => {
    const currentArray = addEntitlementForm.eligibilityRules[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setAddEntitlementForm({
      ...addEntitlementForm,
      eligibilityRules: {
        ...addEntitlementForm.eligibilityRules,
        [field]: newArray,
      },
    });
  };

  return (
    <DashboardLayout 
      title="Personalized Entitlements" 
      description="Assign and manage individual employee leave entitlements and adjustments"
    >
      <div className="max-w-7xl mx-auto">

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddEntitlementModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Add Entitlement (with Eligibility)
        </button>
        <button
          onClick={() => setShowAssignModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Assign Entitlement
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Users size={20} />
          Bulk Assign
        </button>
        <button
          onClick={() => setShowAdjustmentModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <TrendingUp size={20} />
          Add Adjustment
        </button>
      </div>

      {/* Employee Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Search className="inline mr-2" size={16} />
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
        >
          <option value="">-- Select an employee --</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.employeeNumber} - {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Entitlements List */}
      {loading && <div className="text-center text-gray-400">Loading...</div>}
      {error && <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-500">{error}</div>}
      
      {selectedEmployee && entitlements.length > 0 && (
        <div className="grid gap-4">
          {entitlements.filter(ent => ent.leaveTypeId).map((ent) => (
            <div key={ent._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{ent.leaveTypeId?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-400">Code: {ent.leaveTypeId?.code || 'N/A'}</p>
                </div>
                <button
                  onClick={() => resetEntitlement(ent.employeeId._id, ent.leaveTypeId._id)}
                  className="text-gray-400 hover:text-blue-400 flex items-center gap-1"
                >
                  <RotateCcw size={16} />
                  Reset to Default
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Yearly Entitlement</div>
                  <div className="text-2xl font-bold text-white">{ent.yearlyEntitlement}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-green-400">{ent.remaining}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Taken</div>
                  <div className="text-2xl font-bold text-red-400">{ent.taken}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-400">{ent.pending}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEmployee && entitlements.length === 0 && !loading && !error && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No entitlements found for this employee</p>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Assign Entitlement</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employee</label>
                <select
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeNumber} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                <select
                  value={assignForm.leaveTypeId}
                  onChange={(e) => setAssignForm({ ...assignForm, leaveTypeId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yearly Entitlement (days)</label>
                <input
                  type="number"
                  value={assignForm.yearlyEntitlement}
                  onChange={(e) => setAssignForm({ ...assignForm, yearlyEntitlement: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
                <textarea
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={assignEntitlement}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Assign
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Bulk Assign Entitlements</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Employee IDs (comma-separated)
                </label>
                <textarea
                  value={bulkForm.employeeIds}
                  onChange={(e) => setBulkForm({ ...bulkForm, employeeIds: e.target.value })}
                  placeholder="e.g., 674bd123..., 674bd456..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                <select
                  value={bulkForm.leaveTypeId}
                  onChange={(e) => setBulkForm({ ...bulkForm, leaveTypeId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yearly Entitlement (days)</label>
                <input
                  type="number"
                  value={bulkForm.yearlyEntitlement}
                  onChange={(e) => setBulkForm({ ...bulkForm, yearlyEntitlement: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <textarea
                  value={bulkForm.reason}
                  onChange={(e) => setBulkForm({ ...bulkForm, reason: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={bulkAssign}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
              >
                Bulk Assign
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Leave Adjustment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employee</label>
                <select
                  value={adjustmentForm.employeeId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, employeeId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeNumber} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                <select
                  value={adjustmentForm.leaveTypeId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, leaveTypeId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adjustment Type</label>
                <select
                  value={adjustmentForm.adjustmentType}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="BONUS">Bonus (Add days)</option>
                  <option value="DEDUCTION">Deduction (Remove days)</option>
                  <option value="ENCASHMENT">Encashment (Convert to cash)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (days)</label>
                <input
                  type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <textarea
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addAdjustment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              >
                Add Adjustment
              </button>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entitlement with Eligibility Modal */}
      {showAddEntitlementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Add Entitlement with Eligibility Rules</h2>
            
            <div className="space-y-6">
              {/* Leave Type and Entitlement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type *</label>
                  <select
                    value={addEntitlementForm.leaveTypeId}
                    onChange={(e) => setAddEntitlementForm({ ...addEntitlementForm, leaveTypeId: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name} ({type.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yearly Entitlement (days) *</label>
                  <input
                    type="number"
                    value={addEntitlementForm.yearlyEntitlement}
                    onChange={(e) => setAddEntitlementForm({ ...addEntitlementForm, yearlyEntitlement: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <textarea
                  value={addEntitlementForm.reason}
                  onChange={(e) => setAddEntitlementForm({ ...addEntitlementForm, reason: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={2}
                  placeholder="Optional reason for this entitlement"
                />
              </div>

              {/* Eligibility Rules Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-4">Eligibility Rules (At least one required)</h3>
                
                {/* Minimum Tenure */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Tenure (months)</label>
                  <input
                    type="number"
                    value={addEntitlementForm.eligibilityRules.minTenureMonths}
                    onChange={(e) => setAddEntitlementForm({
                      ...addEntitlementForm,
                      eligibilityRules: { ...addEntitlementForm.eligibilityRules, minTenureMonths: Number(e.target.value) }
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    min="0"
                    placeholder="Enter minimum months of service required (e.g., 6)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Employees must have worked this many months to be eligible</p>
                </div>

                {/* Positions Allowed */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Positions Allowed</label>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2 text-green-400 font-semibold">
                      <input
                        type="checkbox"
                        checked={addEntitlementForm.eligibilityRules.allPositionsAllowed}
                        onChange={(e) => setAddEntitlementForm({
                          ...addEntitlementForm,
                          eligibilityRules: {
                            ...addEntitlementForm.eligibilityRules,
                            allPositionsAllowed: e.target.checked,
                            positionsAllowed: e.target.checked ? [] : addEntitlementForm.eligibilityRules.positionsAllowed
                          }
                        })}
                        className="rounded"
                      />
                      <span>✓ All Positions Allowed (No Restriction)</span>
                    </label>
                  </div>
                  {!addEntitlementForm.eligibilityRules.allPositionsAllowed && eligibilityOptions.positions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-gray-700/50 p-3 rounded-lg">
                      {eligibilityOptions.positions.map(pos => (
                        <label key={pos.code} className="flex items-center space-x-2 text-gray-300">
                          <input
                            type="checkbox"
                            checked={addEntitlementForm.eligibilityRules.positionsAllowed.includes(pos.title)}
                            onChange={() => toggleEligibilityArray('positionsAllowed', pos.title)}
                            className="rounded"
                          />
                          <span className="text-sm">{pos.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {!addEntitlementForm.eligibilityRules.allPositionsAllowed && eligibilityOptions.positions.length === 0 && (
                    <p className="text-sm text-gray-400">Loading positions...</p>
                  )}
                </div>

                {/* Contract Types Allowed */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contract Types Allowed</label>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2 text-green-400 font-semibold">
                      <input
                        type="checkbox"
                        checked={addEntitlementForm.eligibilityRules.allContractTypesAllowed}
                        onChange={(e) => setAddEntitlementForm({
                          ...addEntitlementForm,
                          eligibilityRules: {
                            ...addEntitlementForm.eligibilityRules,
                            allContractTypesAllowed: e.target.checked,
                            contractTypesAllowed: e.target.checked ? [] : addEntitlementForm.eligibilityRules.contractTypesAllowed
                          }
                        })}
                        className="rounded"
                      />
                      <span>✓ All Contract Types Allowed (No Restriction)</span>
                    </label>
                  </div>
                  {!addEntitlementForm.eligibilityRules.allContractTypesAllowed && eligibilityOptions.contractTypes.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {eligibilityOptions.contractTypes.map(type => (
                        <label key={type} className="flex items-center space-x-2 text-gray-300">
                          <input
                            type="checkbox"
                            checked={addEntitlementForm.eligibilityRules.contractTypesAllowed.includes(type)}
                            onChange={() => toggleEligibilityArray('contractTypesAllowed', type)}
                            className="rounded"
                          />
                          <span>{type.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {!addEntitlementForm.eligibilityRules.allContractTypesAllowed && eligibilityOptions.contractTypes.length === 0 && (
                    <p className="text-sm text-gray-400">Loading contract types...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addEntitlementWithEligibility}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
              >
                Add Entitlement to Eligible Employees
              </button>
              <button
                onClick={() => setShowAddEntitlementModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
