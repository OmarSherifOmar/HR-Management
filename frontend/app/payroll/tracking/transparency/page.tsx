"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TransparencySummary {
  totalPayslips: number;
  totalDisputes: number;
  totalClaims: number;
  pendingDisputes: number;
  pendingClaims: number;
  refundsProcessed: number;
}

export default function TransparencyPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TransparencySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const role: string = userStr ? JSON.parse(userStr).role || "" : "";

    // Match backend roles from Role enum (case-insensitive)
    const authorizedRoles = [
      "System Admin",
      "Payroll Manager",
      "Finance Staff",
    ];
    const hasAccess = authorizedRoles.some(
      (r) => r.toLowerCase() === role.toLowerCase()
    );
    setIsAuthorized(hasAccess);

    if (hasAccess) {
      fetchTransparencySummary();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTransparencySummary = async () => {
    try {
      setLoading(true);
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/transparency/summary`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch transparency summary");
      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-800 font-semibold mb-2">
              Access Restricted
            </h3>
            <p className="text-yellow-600">
              Transparency metrics are only available to Payroll Managers,
              Finance Staff, and System Admins.
            </p>
            <Link
              href="/payroll/tracking"
              className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transparency metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push("/payroll/tracking")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentages and metrics
  const disputeResolutionRate = summary
    ? summary.totalDisputes > 0
      ? (
          ((summary.totalDisputes - summary.pendingDisputes) /
            summary.totalDisputes) *
          100
        ).toFixed(1)
      : "N/A"
    : "N/A";

  const claimApprovalRate = summary
    ? summary.totalClaims > 0
      ? (
          ((summary.totalClaims - summary.pendingClaims) /
            summary.totalClaims) *
          100
        ).toFixed(1)
      : "N/A"
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Transparency Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Overview of payroll operations and metrics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTransparencySummary}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
            >
              🔄 Refresh
            </button>
            <Link
              href="/payroll/tracking"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {summary && (
          <>
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Total Payslips</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {summary.totalPayslips}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-full">
                    <span className="text-3xl">📄</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Total Claims</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {summary.totalClaims}
                    </p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-full">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Total Disputes</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {summary.totalDisputes}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-full">
                    <span className="text-3xl">⚖️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Items
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏳</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Pending Claims
                        </p>
                        <p className="text-sm text-gray-600">
                          Awaiting review or approval
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-yellow-600">
                      {summary.pendingClaims}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Pending Disputes
                        </p>
                        <p className="text-sm text-gray-600">
                          Under investigation
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-orange-600">
                      {summary.pendingDisputes}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resolution Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Refunds Processed
                        </p>
                        <p className="text-sm text-gray-600">
                          Successfully paid out
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {summary.refundsProcessed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Dispute Resolution Rate
                        </p>
                        <p className="text-sm text-gray-600">
                          Resolved vs. total
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">
                      {disputeResolutionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Processing Progress
              </h3>
              <div className="space-y-6">
                {/* Claims Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Claims Processing</span>
                    <span className="text-gray-600">
                      {summary.totalClaims - summary.pendingClaims} of{" "}
                      {summary.totalClaims} processed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all duration-500"
                      style={{
                        width:
                          summary.totalClaims > 0
                            ? `${
                                ((summary.totalClaims - summary.pendingClaims) /
                                  summary.totalClaims) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Disputes Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Disputes Resolution</span>
                    <span className="text-gray-600">
                      {summary.totalDisputes - summary.pendingDisputes} of{" "}
                      {summary.totalDisputes} resolved
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                      style={{
                        width:
                          summary.totalDisputes > 0
                            ? `${
                                ((summary.totalDisputes -
                                  summary.pendingDisputes) /
                                  summary.totalDisputes) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/payroll/tracking/claims"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-medium text-gray-900">Review Claims</p>
                    <p className="text-sm text-gray-600">
                      {summary.pendingClaims} pending
                    </p>
                  </div>
                </Link>

                <Link
                  href="/payroll/tracking/disputes"
                  className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <p className="font-medium text-gray-900">Review Disputes</p>
                    <p className="text-sm text-gray-600">
                      {summary.pendingDisputes} pending
                    </p>
                  </div>
                </Link>

                <Link
                  href="/payroll/tracking/refunds"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-2xl">💸</span>
                  <div>
                    <p className="font-medium text-gray-900">View Refunds</p>
                    <p className="text-sm text-gray-600">
                      {summary.refundsProcessed} processed
                    </p>
                  </div>
                </Link>

                <Link
                  href="/payroll/tracking/reports"
                  className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-600">Analytics & exports</p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
