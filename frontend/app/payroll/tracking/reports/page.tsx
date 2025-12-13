"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PayrollReport {
  _id: string;
  totalGross: number;
  totalNet: number;
  count: number;
}

interface DepartmentReport {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [departmentReports, setDepartmentReports] = useState<
    DepartmentReport[]
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("payroll");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const role = userStr ? JSON.parse(userStr).role || "" : "";
    const adminRoles = [
      "admin",
      "system_admin",
      "payroll_manager",
      "payroll_specialist",
      "finance_staff",
    ];
    setIsAdmin(
      adminRoles.some((r) => role.toLowerCase().includes(r.toLowerCase()))
    );
    fetchPayrollReports();
  }, []);

  const fetchPayrollReports = async () => {
    try {
      setLoading(true);
      const url = selectedMonth
        ? `http://localhost:3000/payroll-tracking/reports/payroll?month=${selectedMonth}`
        : "http://localhost:3000/payroll-tracking/reports/payroll";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch payroll reports");
      const data = await response.json();
      setPayrollReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentReport = async (departmentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/reports/department/${departmentId}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch department report");
      const data = await response.json();
      setDepartmentReports([data]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate overall totals
  const overallTotals = payrollReports.reduce(
    (acc, report) => ({
      totalGross: acc.totalGross + report.totalGross,
      totalNet: acc.totalNet + report.totalNet,
      count: acc.count + report.count,
    }),
    { totalGross: 0, totalNet: 0, count: 0 }
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-yellow-400 font-semibold mb-2">
              Access Restricted
            </h3>
            <p className="text-yellow-300">
              Payroll reports are only available to authorized personnel
              (Payroll Specialists, Managers, Finance Staff, and System Admins).
            </p>
            <Link
              href="/payroll/tracking"
              className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              ← Back to Tracking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payroll Reports
            </h1>
            <p className="text-gray-400">Generate and view payroll analytics</p>
          </div>
          <Link
            href="/payroll/tracking"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Tracking
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Gross Payroll</p>
            <p className="text-2xl font-bold text-teal-400">
              {formatCurrency(overallTotals.totalGross)}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Net Payroll</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(overallTotals.totalNet)}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Payslips</p>
            <p className="text-2xl font-bold text-white">
              {overallTotals.count}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#232340] rounded-xl mb-6 overflow-hidden border border-gray-700/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab("payroll")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "payroll"
                  ? "bg-teal-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a4a]"
              }`}
            >
              📊 Payroll Summary
            </button>
            <button
              onClick={() => setActiveTab("department")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "department"
                  ? "bg-teal-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a4a]"
              }`}
            >
              🏢 Department Reports
            </button>
          </div>
        </div>

        {/* Payroll Summary Tab */}
        {activeTab === "payroll" && (
          <div className="bg-[#232340] rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Payroll Run Summary
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={fetchPayrollReports}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {payrollReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400 text-lg">No payroll data found</p>
                <p className="text-gray-500 mt-2">
                  Payroll summaries will appear here after payroll runs are
                  processed
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700/50">
                  <thead className="bg-[#1a1a2e]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Payroll Run ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Total Gross
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Total Net
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Payslips Count
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Avg. Net Per Employee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {payrollReports.map((report) => (
                      <tr
                        key={report._id}
                        className="hover:bg-[#2a2a4a] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {report._id || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-teal-400">
                            {formatCurrency(report.totalGross)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-400">
                            {formatCurrency(report.totalNet)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {report.count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {report.count > 0
                              ? formatCurrency(report.totalNet / report.count)
                              : "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Department Reports Tab */}
        {activeTab === "department" && (
          <div className="bg-[#232340] rounded-xl p-6 border border-gray-700/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Department Payroll Report
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  placeholder="Enter Department ID"
                  className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                />
                <button
                  onClick={() => {
                    if (selectedDepartment) {
                      fetchDepartmentReport(selectedDepartment);
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  disabled={!selectedDepartment}
                >
                  Generate Report
                </button>
              </div>
            </div>

            {departmentReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departmentReports.map((report, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-700/50 rounded-xl p-6 bg-[#1a1a2e]"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {report.departmentName ||
                        `Department ${report.departmentId}`}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Employees</span>
                        <span className="font-medium text-white">
                          {report.totalEmployees}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Gross</span>
                        <span className="font-medium text-teal-400">
                          {formatCurrency(report.totalGross)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Deductions</span>
                        <span className="font-medium text-red-400">
                          {formatCurrency(report.totalDeductions)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700/50 pt-3">
                        <span className="text-white font-semibold">
                          Total Net
                        </span>
                        <span className="font-bold text-green-400">
                          {formatCurrency(report.totalNet)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <p className="text-gray-400 text-lg">
                  Enter a department ID to generate a report
                </p>
              </div>
            )}
          </div>
        )}

        {/* Export Options */}
        <div className="mt-6 bg-[#232340] rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">
            Export Options
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => alert("CSV export coming soon!")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              Export as CSV
            </button>
            <button
              onClick={() => alert("PDF export coming soon!")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span>📄</span>
              Export as PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>🖨️</span>
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
