"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/DashboardLayout";
import { ArrowLeft, FileText, Info, Wallet, PiggyBank } from "lucide-react";

interface Payslip {
  _id: string;
  month: string;
  generatedAt: string;
  paymentStatus: string;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      const response = await fetch(
        `${URL}/payroll-tracking/me/payslips`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch payslips");
      const data = await response.json();
      setPayslips(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadPayslip = async (payslipId: string, month: string | null) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/payslips/${payslipId}/download`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to download payslip");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${month || "payslip"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download payslip");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="My Payslips"
        description="View and download your payment history"
      >
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading payslips...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Payslips"
      description="View and download your payment history"
    >
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Payslip History</h1>
              <p className="text-gray-400 mt-1">
                Explore detailed earnings, deductions, and download statements
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
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Digital Payslips</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Your payslips include a full breakdown of earnings and
                  deductions. Download PDFs when you need official statements
                  for financial records or loan applications.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {payslips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Latest Net Pay</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(payslips[0]?.netPay || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payslips[0]?.month || "Most recent payout"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Payslips</p>
                    <p className="text-2xl font-bold text-white">
                      {payslips.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payslips.length === 1
                        ? "Single record"
                        : `${payslips.length} statements on file`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <PiggyBank className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Year-To-Date Net</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(
                        payslips.reduce((sum, p) => sum + (p.netPay || 0), 0)
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Across all payslips</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payslips List */}
          {payslips.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-12 text-center border border-white/5">
              <span className="text-4xl block mb-4">🗂️</span>
              <h3 className="text-xl font-semibold text-white">
                No Payslips Yet
              </h3>
              <p className="text-gray-400 mt-2">
                Once payroll processing completes, your payslips will appear
                here.
              </p>
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#1f1f1f]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Month
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Generated
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Gross Salary
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Deductions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Net Pay
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payslips.map((payslip) => (
                      <tr
                        key={payslip._id}
                        className="hover:bg-[#333333] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {payslip.month || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatDate(payslip.generatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-medium rounded-lg ${getStatusColor(
                              payslip.paymentStatus
                            )}`}
                          >
                            {payslip.paymentStatus || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-200">
                          {formatCurrency(payslip.grossSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-400">
                          -{formatCurrency(payslip.totalDeductions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-400 font-semibold">
                          {formatCurrency(payslip.netPay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/payroll/tracking/payslips/${payslip._id}`}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              View
                            </Link>
                            <button
                              onClick={() =>
                                downloadPayslip(
                                  payslip._id,
                                  payslip.month || null
                                )
                              }
                              className="text-green-400 hover:text-green-300"
                            >
                              Download PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
