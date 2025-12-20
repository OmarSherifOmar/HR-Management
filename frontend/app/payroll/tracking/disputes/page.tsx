"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  Plus,
  ArrowLeft,
  FileWarning,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Dispute {
  _id: string;
  disputeId: string;
  description: string;
  payslipId: string;
  employeeId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolutionComment?: string;
  rejectionReason?: string;
}

export default function DisputesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchEmployeeDisputes = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      const response = await fetch(
        `${URL}/payroll-tracking/disputes/mine`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch disputes");
      const data = await response.json();
      setDisputes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDisputes = async (status?: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      const url =
        status && status !== "all"
          ? `${URL}/payroll-tracking/disputes?status=${encodeURIComponent(
              status
            )}`
          : `${URL}/payroll-tracking/disputes`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch disputes");
      const data = await response.json();
      setAllDisputes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const role = user.role || "";
    const normalizedRole = String(role).toLowerCase();
    const adminRoles = [
      "payroll manager",
      "payroll specialist",
      "system admin",
      "finance staff",
    ];

    const isAdminRole = adminRoles.includes(normalizedRole);
    setIsAdmin(isAdminRole);

    if (isAdminRole) {
      fetchAllDisputes();
    } else {
      fetchEmployeeDisputes();
    }
  }, [user]);

  const normalizeStatus = (status: string) => (status || "").toLowerCase();

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "approved":
        return "bg-green-500/20 text-green-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      case "under review":
        return "bg-yellow-500/20 text-yellow-400";
      case "pending":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const normalizedRole = String(user?.role || "").toLowerCase();
  const canReview =
    normalizedRole === "payroll manager" ||
    normalizedRole === "payroll specialist" ||
    normalizedRole === "system admin";
  const isFinanceStaff = normalizedRole === "finance staff";

  const displayedDisputes = isAdmin ? allDisputes : disputes;
  const normalizedFilter = filterStatus.toLowerCase();
  const filteredDisputes =
    normalizedFilter === "all"
      ? displayedDisputes
      : displayedDisputes.filter(
          (d) => normalizeStatus(d.status) === normalizedFilter
        );

  const disputeStats = {
    total: displayedDisputes.length,
    pending: displayedDisputes.filter(
      (d) => normalizeStatus(d.status) === "under review"
    ).length,
    approved: displayedDisputes.filter(
      (d) => normalizeStatus(d.status) === "approved"
    ).length,
    rejected: displayedDisputes.filter(
      (d) => normalizeStatus(d.status) === "rejected"
    ).length,
  };

  if (loading) {
    return (
      <DashboardLayout title="Disputes">
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading disputes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Disputes">
        <div className="min-h-screen bg-[#1a1a1a] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-500/10 rounded-lg p-6">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-red-300">{error}</p>
              <button
                onClick={() => router.push("/payroll/tracking")}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isAdmin ? "All Disputes" : "My Disputes"}
      description={
        isAdmin
          ? "Review and manage payroll disputes"
          : "Track your payroll dispute status"
      }
    >
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isAdmin ? "All Disputes" : "My Disputes"}
              </h1>
              <p className="text-gray-400">
                {isAdmin
                  ? "Review and manage payroll disputes"
                  : "Track your payroll dispute status"}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/payroll/tracking/disputes/create"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Dispute
              </Link>
              <Link
                href="/payroll/tracking"
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>

          {/* Finance Notification for Approved Disputes */}
          {isFinanceStaff && disputeStats.approved > 0 && (
            <div className="mb-6 bg-green-500/10 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-green-300 font-semibold">
                  {disputeStats.approved} approved disputes need payroll
                  adjustments.
                </p>
                <p className="text-green-200/80 text-sm">
                  Click below to focus on manager-approved disputes ready for
                  processing.
                </p>
              </div>
              <button
                onClick={() => {
                  setFilterStatus("approved");
                  if (isAdmin) {
                    fetchAllDisputes("approved");
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                View Approved Disputes
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#2a2a2a] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileWarning className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm">Total Disputes</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {disputeStats.total}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-gray-400 text-sm">Under Review</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {disputeStats.pending}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm">Resolved</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {disputeStats.approved}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-gray-400 text-sm">Rejected</p>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {disputeStats.rejected}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-300">
                Filter by Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  if (isAdmin) fetchAllDisputes(e.target.value);
                }}
                className="px-4 py-2 bg-[#1a1a1a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Disputes</option>
                <option value="under review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="text-gray-500">
                Showing {filteredDisputes.length} of {displayedDisputes.length}{" "}
                disputes
              </span>
            </div>
          </div>

          {/* Disputes List */}
          {filteredDisputes.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">
                {filterStatus === "all"
                  ? "No disputes found"
                  : `No ${filterStatus
                      .toLowerCase()
                      .replace("_", " ")} disputes`}
              </p>
              <Link
                href="/payroll/tracking/disputes/create"
                className="mt-4 inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Raise a Dispute
              </Link>
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700/50">
                  <thead className="bg-[#1a1a1a]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredDisputes.map((dispute) => (
                      <tr
                        key={dispute._id}
                        className="hover:bg-[#333333] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {dispute.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-lg ${getStatusColor(
                              dispute.status
                            )}`}
                          >
                            {dispute.status?.replace("_", " ") || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {formatDate(dispute.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/payroll/tracking/disputes/${dispute._id}`}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                          >
                            View
                          </Link>
                          {canReview &&
                            normalizeStatus(dispute.status) ===
                              "under review" && (
                              <Link
                                href={`/payroll/tracking/disputes/${dispute._id}/review`}
                                className="text-green-400 hover:text-green-300 mr-3"
                              >
                                Review
                              </Link>
                            )}
                          {isFinanceStaff &&
                            normalizeStatus(dispute.status) === "approved" && (
                              <Link
                                href={`/payroll/tracking/refunds?disputeId=${dispute.disputeId}`}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                Generate Refund
                              </Link>
                            )}
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
