"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  ArrowLeft,
  Building2,
  BarChart3,
  Briefcase,
  Info,
  Heart,
} from "lucide-react";

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
      <DashboardLayout
        title="Employer Contributions"
        description="Track your employer-funded benefits"
      >
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">
              Loading employer contributions...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Employer Contributions"
      description="Track your employer-funded benefits"
    >
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Employer Contributions
              </h1>
              <p className="text-gray-400">
                View and analyze employer-funded benefits across payroll cycles
              </p>
            </div>
            <Link
              href="/payroll/tracking"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tracking
            </Link>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">
                  What are Employer Contributions?
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  These are amounts your employer pays on your behalf for
                  insurance, retirement, and other benefits. They are additional
                  to your salary and help build long-term financial security.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Latest Month</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(data?.totalEmployerContributions ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data?.latestMonth || "No recent data"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total All Time</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalEmployerAll)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(data?.history.length ?? 0).toLocaleString()} months
                    recorded
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Monthly Average</p>
                  <p className="text-2xl font-bold text-white">
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
            <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
              <label className="block text-gray-300 font-medium mb-2">
                Select Month to View Details:
              </label>
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full max-w-sm rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
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
            <div className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-white/5">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-xl font-semibold text-white">
                  Contributions for {selectedData.month}
                </h3>
                <p className="text-sm text-gray-400">
                  Total employer contribution:{" "}
                  <span className="font-semibold text-green-400">
                    {formatCurrency(selectedData.totalEmployerContributions)}
                  </span>
                </p>
              </div>

              {selectedData.contributions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p>No contribution details available for this month.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#1f1f1f]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Contribution Type
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Your Rate
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Employer Rate
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Your Share
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Employer Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedData.contributions.map((contrib, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#333333] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <Heart className="w-4 h-4 text-purple-300" />
                            </div>
                            <span className="font-medium text-white">
                              {contrib.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {formatPercentage(contrib.employeeRate)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {formatPercentage(contrib.employerRate)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-400">
                          {formatCurrency(contrib.employeeShare)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-semibold">
                          {formatCurrency(contrib.employerShare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#1f1f1f]">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-right font-semibold text-gray-300"
                      >
                        Total:
                      </td>
                      <td className="px-6 py-4 text-right text-red-400 font-semibold">
                        {formatCurrency(
                          selectedData.contributions.reduce(
                            (sum, c) => sum + c.employeeShare,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-green-400 font-semibold">
                        {formatCurrency(
                          selectedData.totalEmployerContributions
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
              <span className="text-6xl mb-4 block">🏢</span>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Contribution Data
              </h3>
              <p className="text-gray-400">
                {data?.note || "No employer contribution records found."}
              </p>
            </div>
          )}

          {/* Historical Chart */}
          {data?.history && data.history.length > 1 && (
            <div className="mt-8 bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
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
                              ? "bg-green-500"
                              : "bg-green-500/70 hover:bg-green-500"
                          }`}
                          style={{ height: `${height}%` }}
                          title={`${record.month}: ${formatCurrency(
                            record.totalEmployerContributions
                          )}`}
                          onClick={() => setSelectedMonth(record.month)}
                        ></div>
                        <p className="text-xs text-gray-400 mt-2 -rotate-45 origin-top-left">
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
    </DashboardLayout>
  );
}
