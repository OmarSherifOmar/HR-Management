"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ContributionItem {
  name: string;
  employeeShare: number;
  employerShare: number;
  employerRate: number;
  employeeRate: number;
}

interface MonthlyContributions {
  payslipId: string;
  month: string;
  year: number;
  contributions: ContributionItem[];
  totalEmployerContributions: number;
}

interface EmployerContributionsData {
  history: MonthlyContributions[];
  latestMonth: string | null;
  totalEmployerContributions: number;
  note: string;
}

export default function EmployerContributionsPage() {
  const [data, setData] = useState<EmployerContributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployerContributions();
  }, []);

  const fetchEmployerContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/employer-contributions",
        { credentials: "include" }
      );
      if (!response.ok)
        throw new Error("Failed to fetch employer contributions");
      const result = await response.json();
      setData(result);
      if (result.history?.length > 0) {
        setSelectedMonth(result.history[0].month);
      }
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

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  const selectedData = data?.history.find((h) => h.month === selectedMonth);

  // Calculate totals across all history
  const totalEmployerAll =
    data?.history.reduce((sum, h) => sum + h.totalEmployerContributions, 0) ??
    0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading employer contributions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Employer Contributions
            </h1>
            <p className="text-lg text-white">
              View contributions made by your employer on your behalf
            </p>
          </div>
          <Link
            href="/payroll/tracking"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Tracking
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900">
                What are Employer Contributions?
              </h4>
              <p className="text-blue-700 text-sm mt-1">
                These are amounts your employer pays on your behalf for
                insurance, retirement, and other benefits. They are not deducted
                from your salary but are provided as additional benefits.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Latest Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.totalEmployerContributions ?? 0)}
                </p>
                <p className="text-xs text-gray-400">{data?.latestMonth}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total All Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalEmployerAll)}
                </p>
                <p className="text-xs text-gray-400">
                  {data?.history.length ?? 0} months
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Monthly Average</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    data?.history.length
                      ? totalEmployerAll / data.history.length
                      : 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        {data?.history && data.history.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-black font-medium mb-2">
              Select Month to View Details:
            </label>
            <select
              value={selectedMonth ?? ""}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-2.5
             text-gray-900 shadow-sm focus:border-blue-200 focus:ring-2 focus:ring-blue-500
             transition"
            >
              {data.history.map((h) => (
                <option key={h.month} value={h.month}>
                  {h.month} - {formatCurrency(h.totalEmployerContributions)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contributions Detail */}
        {selectedData ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Contributions for {selectedData.month}
              </h3>
              <p className="text-sm text-gray-500">
                Total employer contribution:{" "}
                <span className="font-bold text-green-600">
                  {formatCurrency(selectedData.totalEmployerContributions)}
                </span>
              </p>
            </div>

            {selectedData.contributions.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-gray-500">
                  No contribution details available for this month.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Contribution Type
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Your Rate
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Employer Rate
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Your Share
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Employer Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedData.contributions.map((contrib, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏥</span>
                          <span className="font-medium text-gray-900">
                            {contrib.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatPercentage(contrib.employeeRate)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatPercentage(contrib.employerRate)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600">
                        {formatCurrency(contrib.employeeShare)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-bold">
                        {formatCurrency(contrib.employerShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right font-semibold text-gray-700"
                    >
                      Total:
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-bold">
                      {formatCurrency(
                        selectedData.contributions.reduce(
                          (sum, c) => sum + c.employeeShare,
                          0
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">
                      {formatCurrency(selectedData.totalEmployerContributions)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">🏢</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Contribution Data
            </h3>
            <p className="text-gray-500">
              {data?.note || "No employer contribution records found."}
            </p>
          </div>
        )}

        {/* Historical Chart */}
        {data?.history && data.history.length > 1 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Employer Contributions Over Time
            </h3>
            <div className="flex items-end gap-2 h-40">
              {data.history
                .slice()
                .reverse()
                .slice(-12)
                .map((record, idx) => {
                  const maxContrib = Math.max(
                    ...data.history.map((h) => h.totalEmployerContributions)
                  );
                  const height =
                    maxContrib > 0
                      ? (record.totalEmployerContributions / maxContrib) * 100
                      : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 cursor-pointer ${
                          record.month === selectedMonth
                            ? "bg-green-600"
                            : "bg-green-400 hover:bg-green-500"
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${record.month}: ${formatCurrency(
                          record.totalEmployerContributions
                        )}`}
                        onClick={() => setSelectedMonth(record.month)}
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
