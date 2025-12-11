'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, TrendingUp, TrendingDown, DollarSign, RotateCcw, Search } from 'lucide-react';

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

  useEffect(() => {
    fetchLeaveTypes();
    fetchEmployees();
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Personalized Entitlements</h1>
        <p className="text-gray-400">
          Assign and manage individual employee leave entitlements and adjustments
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
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
    </div>
  );
}
