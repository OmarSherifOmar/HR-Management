"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface LeaveType {
  _id: string;
  name: string;
  code: string;
}

interface AdjustmentHistory {
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
  adjustmentType: string;
  amount: number;
  reason: string;
  hrUserId: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function BalanceAdjustmentsPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [amount, setAmount] = useState("");
  const [reasonCategory, setReasonCategory] = useState("correction");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Reason categories from backend
  const reasonCategories = [
    { value: "correction", label: "Correction - Fix incorrect balance" },
    { value: "carry_over", label: "Carry Over - From previous year" },
    { value: "one_time_grant", label: "One-Time Grant - Special leave grant" },
    { value: "policy_change", label: "Policy Change - Due to policy update" },
    { value: "reinstatement", label: "Reinstatement - Restore deducted leave" },
    { value: "transfer", label: "Transfer - From another entity" },
    { value: "error_fix", label: "Error Fix - System/calculation error" },
    { value: "anniversary_bonus", label: "Anniversary Bonus - Work anniversary" },
    { value: "medical_restoration", label: "Medical Restoration - After medical review" },
    { value: "other", label: "Other - Specify in description" },
  ];

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (!isLoading && isLoggedIn) {
      fetchEmployees();
      fetchLeaveTypes();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:3000/employees/searchs", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Failed to fetch employees");
      }
      const data = await response.json();
      console.log("Employees fetched:", data);
      setEmployees(data);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      setError(`Failed to fetch employees: ${err.message}`);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch("http://localhost:3000/leaves/types", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Failed to fetch leave types");
      }
      const data = await response.json();
      console.log("Leave types fetched:", data);
      setLeaveTypes(data);
    } catch (err: any) {
      console.error("Error fetching leave types:", err);
      setError(`Failed to fetch leave types: ${err.message}`);
    }
  };

  const fetchAdjustmentHistory = async (employeeId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/leaves/balance-adjustments/history/${employeeId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setAdjustmentHistory(data);
    } catch (err: any) {
      console.error("Error fetching adjustment history:", err);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      fetchAdjustmentHistory(employeeId);
    } else {
      setAdjustmentHistory([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        employeeId: selectedEmployee,
        leaveTypeId: selectedLeaveType,
        adjustmentType,
        amount: parseFloat(amount),
        reasonCategory,
        description,
        effectiveDate: effectiveDate || undefined,
        expiryDate: expiryDate || undefined,
      };

      const response = await fetch(
        "http://localhost:3000/leaves/balance-adjustments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to adjust balance");
      }

      const result = await response.json();
      setSuccess(
        `Balance adjusted successfully! Previous: ${result.previousBalance}, New: ${result.newBalance}`
      );
      
      // Reset form
      setAmount("");
      setDescription("");
      setEffectiveDate("");
      setExpiryDate("");

      // Refresh history
      if (selectedEmployee) {
        fetchAdjustmentHistory(selectedEmployee);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Balance Adjustments" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  return (
    <DashboardLayout
      title="Manual Balance Adjustments"
      description="Adjust employee leave balances for corrections, carry-overs, or one-time grants. All adjustments are tracked with full audit trail."
    >
      {/* Adjustment Form */}
      <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">New Adjustment</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Employee *
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Leave Type *
              </label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Adjustment Type *
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="add">Add Days</option>
                <option value="deduct">Deduct Days</option>
                <option value="encashment">Encashment</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount (Days) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            {/* Reason Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reason Category *
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reasonCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed reason for this adjustment..."
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Effective Date (Optional)
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              {loading ? "Processing..." : "Submit Adjustment"}
            </button>
          </div>
        </form>
      </div>

      {/* Adjustment History */}
      {selectedEmployee && (
        <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Adjustment History</h2>
          
          {adjustmentHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No adjustment history for this employee
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Adjusted By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {adjustmentHistory.map((adj) => (
                    <tr key={adj._id} className="hover:bg-[#333333]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(adj.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {adj.leaveTypeId.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            adj.adjustmentType === "add"
                              ? "bg-green-900/50 text-green-200"
                              : adj.adjustmentType === "deduct"
                              ? "bg-red-900/50 text-red-200"
                              : "bg-yellow-900/50 text-yellow-200"
                          }`}
                        >
                          {adj.adjustmentType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                        {adj.adjustmentType === "add" ? "+" : "-"}
                        {adj.amount} days
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {adj.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {adj.hrUserId.firstName} {adj.hrUserId.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
