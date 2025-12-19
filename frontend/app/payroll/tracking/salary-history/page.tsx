"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SalaryRecord {
  _id: string;
  month: string;
  year: number;
  generatedAt: string;
  paymentStatus: string;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  allowances: { name: string; amount: number }[];
  bonuses: { type: string; amount: number }[];
}

export default function SalaryHistoryPage() {
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | "all">("all");

  useEffect(() => {
    fetchSalaryHistory();
  }, []);

  const fetchSalaryHistory = async () => {
    try {
      setLoading(true);
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/salary-history`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch salary history");
      const data = await response.json();
      setSalaryHistory(data);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-500/20 text-green-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      case "PROCESSING":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Get unique years from salary history
  const availableYears = Array.from(
    new Set(salaryHistory.map((s) => s.year))
  ).sort((a, b) => b - a);

  const filteredHistory =
    filterYear === "all"
      ? salaryHistory
      : salaryHistory.filter((s) => s.year === filterYear);

  // Calculate totals for the filtered period
  const totalGross = filteredHistory.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalDeductions = filteredHistory.reduce(
    (sum, s) => sum + s.totalDeductions,
    0
  );
  const totalNet = filteredHistory.reduce((sum, s) => sum + s.netPay, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading salary history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Salary History
            </h1>
            <p className="text-gray-400">
              View your complete salary history and earnings over time
            </p>
          </div>
          <Link
            href="/payroll/tracking"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Tracking
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filter and Summary */}
        <div className="bg-[#232340] rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-gray-300 font-medium">
                Filter by Year:
              </label>
              <select
                value={filterYear}
                onChange={(e) =>
                  setFilterYear(
                    e.target.value === "all" ? "all" : parseInt(e.target.value)
                  )
                }
                className="bg-[#1a1a2e] border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredHistory.length} records
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 rounded-full p-3">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Gross Earnings</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(totalGross)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/20 rounded-full p-3">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Deductions</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(totalDeductions)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 rounded-full p-3">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Net Pay</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(totalNet)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary History Table */}
        {filteredHistory.length === 0 ? (
          <div className="bg-[#232340] rounded-xl p-12 text-center border border-gray-700/50">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Salary Records Found
            </h3>
            <p className="text-gray-500">
              {filterYear !== "all"
                ? `No salary records for ${filterYear}`
                : "You don't have any salary history yet."}
            </p>
          </div>
        ) : (
          <div className="bg-[#232340] rounded-xl overflow-hidden border border-gray-700/50">
            <table className="w-full">
              <thead className="bg-[#1a1a2e]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Month
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Base Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Gross Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Deductions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Net Pay
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredHistory.map((record) => (
                  <tr
                    key={record._id}
                    className="hover:bg-[#2a2a4a] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {record.month}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(record.generatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatCurrency(record.baseSalary)}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-medium">
                      {formatCurrency(record.grossSalary)}
                    </td>
                    <td className="px-6 py-4 text-red-400">
                      -{formatCurrency(record.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 text-blue-400 font-bold">
                      {formatCurrency(record.netPay)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                          record.paymentStatus
                        )}`}
                      >
                        {record.paymentStatus || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/payroll/tracking/payslips/${record._id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Earnings Trend (Visual) */}
        {filteredHistory.length > 1 && (
          <div className="mt-8 bg-[#232340] rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">
              Net Pay Trend
            </h3>
            <div className="flex items-end gap-2 h-40">
              {filteredHistory
                .slice()
                .reverse()
                .slice(-12)
                .map((record, idx) => {
                  const maxNet = Math.max(
                    ...filteredHistory.map((r) => r.netPay)
                  );
                  const height =
                    maxNet > 0 ? (record.netPay / maxNet) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-400"
                        style={{ height: `${height}%` }}
                        title={`${record.month}: ${formatCurrency(
                          record.netPay
                        )}`}
                      ></div>
                      <p className="text-xs text-gray-500 mt-2 -rotate-45 origin-top-left">
                        {record.month?.slice(5)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
