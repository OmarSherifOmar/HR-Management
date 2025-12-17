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
   averageNetPerEmployee: number;
}

interface FinanceTaxBenefitsReport {
  period: {
    year: string | null;
    month: string | null;
  };
  totalPayslips: number;
  totals: {
    totalTax: number;
    totalInsuranceEmployee: number;
    totalInsuranceEmployer: number;
    totalBenefits: number;
  };
  taxesByType: { name: string; totalAmount: number }[];
  insuranceByType: {
    name: string;
    employeeShare: number;
    employerShare: number;
    total: number;
  }[];
  benefitsByType: { name: string; totalAmount: number }[];
  note?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [departmentReports, setDepartmentReports] = useState<
    DepartmentReport[]
  >([]);
  const [financeReport, setFinanceReport] =
    useState<FinanceTaxBenefitsReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("payroll");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const role: string = userStr ? JSON.parse(userStr).role || "" : "";

    // Match backend roles from Role enum (case-insensitive)
    const allowedRoles = [
      "System Admin",
      "Payroll Manager",
      "Payroll Specialist",
      "Finance Staff",
      "HR Admin",
    ];

    setIsAdmin(
      allowedRoles.some((r) => r.toLowerCase() === role.toLowerCase())
    );
    fetchPayrollReports();
    fetchFinanceReport();
  }, []);

  const fetchPayrollReports = async () => {
    try {
      // Basic UI validation: if year is provided, ensure it's a 4-digit number in a sane range
      if (selectedYear) {
        const yearNum = Number(selectedYear);
        if (!Number.isFinite(yearNum) || selectedYear.length !== 4 || yearNum < 2000 || yearNum > 2100) {
          setError("Please enter a valid year between 2000 and 2100.");
          return;
        }
      }

      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);

      const url = params.toString()
        ? `http://localhost:3000/payroll-tracking/reports/payroll?${params.toString()}`
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

  const fetchFinanceReport = async () => {
    try {
      // Reuse the same basic year validation
      if (selectedYear) {
        const yearNum = Number(selectedYear);
        if (
          !Number.isFinite(yearNum) ||
          selectedYear.length !== 4 ||
          yearNum < 2000 ||
          yearNum > 2100
        ) {
          setError("Please enter a valid year between 2000 and 2100.");
          return;
        }
      }

      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);

      const url = params.toString()
        ? `http://localhost:3000/payroll-tracking/reports/finance/tax-benefits?${params.toString()}`
        : "http://localhost:3000/payroll-tracking/reports/finance/tax-benefits";

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok)
        throw new Error("Failed to fetch tax & benefits finance report");
      const data = await response.json();
      setFinanceReport(data);
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

  const exportCsv = async () => {
    try {
      if (selectedYear) {
        const yearNum = Number(selectedYear);
        if (!Number.isFinite(yearNum) || selectedYear.length !== 4 || yearNum < 2000 || yearNum > 2100) {
          alert("Please enter a valid year between 2000 and 2100 before exporting.");
          return;
        }
      }

      const params = new URLSearchParams();
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);

      const url = params.toString()
        ? `http://localhost:3000/payroll-tracking/reports/payroll/export/csv?${params.toString()}`
        : "http://localhost:3000/payroll-tracking/reports/payroll/export/csv";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to export CSV");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      let suffix = "";
      if (selectedYear) suffix += `_${selectedYear}`;
      if (selectedMonth) suffix += `_${selectedMonth}`;
      link.download = `payroll_report${suffix}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV report");
    }
  };

  const exportPdf = async () => {
    try {
      if (selectedYear) {
        const yearNum = Number(selectedYear);
        if (!Number.isFinite(yearNum) || selectedYear.length !== 4 || yearNum < 2000 || yearNum > 2100) {
          alert("Please enter a valid year between 2000 and 2100 before exporting.");
          return;
        }
      }

      let url = "";
      let filename = "report.pdf";

      if (activeTab === "payroll") {
        const params = new URLSearchParams();
        if (selectedMonth) params.append("month", selectedMonth);
        if (selectedYear) params.append("year", selectedYear);

        url = params.toString()
          ? `http://localhost:3000/payroll-tracking/reports/payroll/export/pdf?${params.toString()}`
          : "http://localhost:3000/payroll-tracking/reports/payroll/export/pdf";

        let suffix = "";
        if (selectedYear) suffix += `_${selectedYear}`;
        if (selectedMonth) suffix += `_${selectedMonth}`;
        filename = `payroll_report${suffix}.pdf`;
      } else if (activeTab === "finance") {
        const params = new URLSearchParams();
        if (selectedMonth) params.append("month", selectedMonth);
        if (selectedYear) params.append("year", selectedYear);

        url = params.toString()
          ? `http://localhost:3000/payroll-tracking/reports/finance/tax-benefits/export/pdf?${params.toString()}`
          : "http://localhost:3000/payroll-tracking/reports/finance/tax-benefits/export/pdf";

        let suffix = "";
        if (selectedYear) suffix += `_${selectedYear}`;
        if (selectedMonth) suffix += `_${selectedMonth}`;
        filename = `finance_tax_benefits_report${suffix}.pdf`;
      } else if (activeTab === "department") {
        if (!selectedDepartment) {
          alert("Please enter a department ID before exporting.");
          return;
        }
        url = `http://localhost:3000/payroll-tracking/reports/department/${selectedDepartment}/export/pdf`;
        filename = `department_${selectedDepartment}_report.pdf`;
      }

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to export PDF");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export PDF report");
    }
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
              onClick={() => setActiveTab("finance")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "finance"
                  ? "bg-teal-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a4a]"
              }`}
            >
              🧾 Taxes & Contributions
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
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  placeholder="Year (e.g. 2025)"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-28"
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

        {/* Finance: Taxes & Contributions Tab */}
        {activeTab === "finance" && (
          <div className="bg-[#232340] rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Taxes, Insurance & Benefits
                </h2>
                <p className="text-gray-400 text-sm">
                  Aggregated deductions and contributions for the selected
                  period to support accounting and compliance.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  placeholder="Year (e.g. 2025)"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-28"
                />
                <button
                  onClick={fetchFinanceReport}
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

            {financeReport ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4">
                    <p className="text-xs text-red-300 mb-1">
                      Total Tax Withheld
                    </p>
                    <p className="text-2xl font-bold text-red-200">
                      {formatCurrency(financeReport.totals.totalTax)}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/40 rounded-xl p-4">
                    <p className="text-xs text-blue-300 mb-1">
                      Employee Insurance Contributions
                    </p>
                    <p className="text-2xl font-bold text-blue-200">
                      {formatCurrency(
                        financeReport.totals.totalInsuranceEmployee
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4">
                    <p className="text-xs text-emerald-300 mb-1">
                      Employer Insurance Contributions
                    </p>
                    <p className="text-2xl font-bold text-emerald-200">
                      {formatCurrency(
                        financeReport.totals.totalInsuranceEmployer
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/40 rounded-xl p-4">
                    <p className="text-xs text-purple-300 mb-1">
                      Benefits & Allowances
                    </p>
                    <p className="text-2xl font-bold text-purple-200">
                      {formatCurrency(financeReport.totals.totalBenefits)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Taxes by type */}
                  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700/50">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Taxes by Type
                    </h3>
                    {financeReport.taxesByType.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-2">Tax Type</th>
                            <th className="text-right pb-2">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/60">
                          {financeReport.taxesByType.map((t) => (
                            <tr key={t.name}>
                              <td className="py-2 text-gray-200">{t.name}</td>
                              <td className="py-2 text-right text-red-300">
                                {formatCurrency(t.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No tax deductions found for this period.
                      </p>
                    )}
                  </div>

                  {/* Insurance by type */}
                  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700/50">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Insurance Contributions by Type
                    </h3>
                    {financeReport.insuranceByType.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-2">Insurance</th>
                            <th className="text-right pb-2">Employee</th>
                            <th className="text-right pb-2">Employer</th>
                            <th className="text-right pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/60">
                          {financeReport.insuranceByType.map((i) => (
                            <tr key={i.name}>
                              <td className="py-2 text-gray-200">{i.name}</td>
                              <td className="py-2 text-right text-blue-300">
                                {formatCurrency(i.employeeShare)}
                              </td>
                              <td className="py-2 text-right text-emerald-300">
                                {formatCurrency(i.employerShare)}
                              </td>
                              <td className="py-2 text-right text-gray-200">
                                {formatCurrency(i.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No insurance contributions found for this period.
                      </p>
                    )}
                  </div>

                  {/* Benefits by type */}
                  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700/50">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Benefits & Allowances by Type
                    </h3>
                    {financeReport.benefitsByType.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-2">Benefit</th>
                            <th className="text-right pb-2">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/60">
                          {financeReport.benefitsByType.map((b) => (
                            <tr key={b.name}>
                              <td className="py-2 text-gray-200">{b.name}</td>
                              <td className="py-2 text-right text-purple-300">
                                {formatCurrency(b.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No benefit or allowance records found for this period.
                      </p>
                    )}
                  </div>
                </div>

                {financeReport.note && (
                  <p className="mt-4 text-xs text-gray-500 italic">
                    {financeReport.note}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧾</div>
                <p className="text-gray-400 text-lg">
                  No finance report data yet.
                </p>
                <p className="text-gray-500 mt-2">
                  Adjust the period above and click Filter to
                  regenerate.
                </p>
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
                      <div className="flex justify-between border-t border-gray-700/50 pt-3">
                        <span className="text-white font-semibold">
                          Avg Net per Employee
                        </span>
                        <span className="font-bold text-blue-400">
                          {formatCurrency(report.averageNetPerEmployee)}
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
              onClick={exportCsv}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              Export as CSV
            </button>
            <button
              onClick={exportPdf}
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
