"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";

interface AdjustmentLog {
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
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AuditLogPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AdjustmentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdjustmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchEmployee, setSearchEmployee] = useState("");
  const [filterAdjustmentType, setFilterAdjustmentType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
      fetchAllAdjustments();
    }
  }, [isLoading, isLoggedIn, user, router]);

  useEffect(() => {
    applyFilters();
  }, [searchEmployee, filterAdjustmentType, fromDate, toDate, logs]);

  const fetchAllAdjustments = async () => {
    try {
      setLoading(true);
      // Note: This endpoint would need to be created in the backend
      // For now, we'll use a placeholder approach
      const response = await fetch(
        "http://localhost:3000/leaves/balance-adjustments/all",
        {
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch adjustment logs");
      }
      
      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);
    } catch (err: any) {
      setError(err.message);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by employee name/number
    if (searchEmployee) {
      filtered = filtered.filter(
        (log) =>
          log.employeeId.firstName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
          log.employeeId.lastName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
          log.employeeId.employeeNumber.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    // Filter by adjustment type
    if (filterAdjustmentType) {
      filtered = filtered.filter((log) => log.adjustmentType === filterAdjustmentType);
    }

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter(
        (log) => new Date(log.createdAt) >= new Date(fromDate)
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (log) => new Date(log.createdAt) <= new Date(toDate)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Date & Time",
      "Employee",
      "Employee Number",
      "Leave Type",
      "Adjustment Type",
      "Amount (Days)",
      "Reason",
      "Adjusted By",
      "HR ID",
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      `${log.employeeId.firstName} ${log.employeeId.lastName}`,
      log.employeeId.employeeNumber,
      log.leaveTypeId.name,
      log.adjustmentType,
      log.amount,
      log.reason,
      `${log.hrUserId.firstName} ${log.hrUserId.lastName}`,
      log.hrUserId.employeeNumber,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-adjustment-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const clearFilters = () => {
    setSearchEmployee("");
    setFilterAdjustmentType("");
    setFromDate("");
    setToDate("");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Audit Log" description="Loading...">
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
      title="Balance Adjustment Audit Log"
      description="Complete audit trail of all manual leave balance adjustments with timestamp, HR user ID, and reason for each modification."
    >
      {/* Filters */}
      <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              placeholder="Name or Employee #"
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Adjustment Type
            </label>
            <select
              value={filterAdjustmentType}
              onChange={(e) => setFilterAdjustmentType(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="add">Add</option>
              <option value="deduct">Deduct</option>
              <option value="encashment">Encashment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-400">
            Showing {filteredLogs.length} of {logs.length} records
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#2a2a2a] rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-400">Loading audit log...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchAllAdjustments}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No adjustment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Employee
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
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#333333]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        {log.employeeId.firstName} {log.employeeId.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.employeeId.employeeNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {log.leaveTypeId.name}
                      <span className="ml-1 text-gray-500">
                        ({log.leaveTypeId.code})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          log.adjustmentType === "add"
                            ? "bg-green-900/50 text-green-200"
                            : log.adjustmentType === "deduct"
                            ? "bg-red-900/50 text-red-200"
                            : "bg-yellow-900/50 text-yellow-200"
                        }`}
                      >
                        {log.adjustmentType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {log.adjustmentType === "add" ? "+" : "-"}
                      {log.amount} days
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        {log.hrUserId.firstName} {log.hrUserId.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.hrUserId.employeeNumber}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics */}
      {!loading && filteredLogs.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#2a2a2a] rounded-lg shadow p-4">
            <div className="text-sm text-gray-400">Total Adjustments</div>
            <div className="text-2xl font-bold text-white">
              {filteredLogs.length}
            </div>
          </div>
          <div className="bg-[#2a2a2a] rounded-lg shadow p-4">
            <div className="text-sm text-gray-400">Additions</div>
            <div className="text-2xl font-bold text-green-400">
              {filteredLogs.filter((log) => log.adjustmentType === "add").length}
            </div>
          </div>
          <div className="bg-[#2a2a2a] rounded-lg shadow p-4">
            <div className="text-sm text-gray-400">Deductions</div>
            <div className="text-2xl font-bold text-red-400">
              {
                filteredLogs.filter(
                  (log) =>
                    log.adjustmentType === "deduct" ||
                    log.adjustmentType === "encashment"
                ).length
              }
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}