"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

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

  const fetchEmployeeDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/disputes/mine`,
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
      setLoading(true);
      const url =
        status && status !== "all"
          ? `http://localhost:3000/payroll-tracking/disputes?status=${status}`
          : "http://localhost:3000/payroll-tracking/disputes";
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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      case "PENDING":
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

  const displayedDisputes = isAdmin ? allDisputes : disputes;
  const filteredDisputes =
    filterStatus === "all"
      ? displayedDisputes
      : displayedDisputes.filter((d) => d.status === filterStatus);

  const disputeStats = {
    total: displayedDisputes.length,
    pending: displayedDisputes.filter((d) => d.status === "UNDER_REVIEW")
      .length,
    approved: displayedDisputes.filter((d) => d.status === "APPROVED").length,
    rejected: displayedDisputes.filter((d) => d.status === "REJECTED").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
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
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
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
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              + New Dispute
            </Link>
            <Link
              href="/payroll/tracking"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Disputes</p>
            <p className="text-2xl font-bold text-white">
              {disputeStats.total}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Under Review</p>
            <p className="text-2xl font-bold text-yellow-400">
              {disputeStats.pending}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-400">
              {disputeStats.approved}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-400">
              {disputeStats.rejected}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-[#232340] rounded-xl p-4 mb-6 border border-gray-700/50">
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
              className="px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Disputes</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span className="text-gray-500">
              Showing {filteredDisputes.length} of {displayedDisputes.length}{" "}
              disputes
            </span>
          </div>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-[#232340] rounded-xl p-12 text-center border border-gray-700/50">
            <p className="text-gray-400 text-lg">
              {filterStatus === "all"
                ? "No disputes found"
                : `No ${filterStatus.toLowerCase().replace("_", " ")} disputes`}
            </p>
            <Link
              href="/payroll/tracking/disputes/create"
              className="mt-4 inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Raise a Dispute
            </Link>
          </div>
        ) : (
          <div className="bg-[#232340] rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-[#1a1a2e]">
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
                      className="hover:bg-[#2a2a4a] transition-colors"
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
                        {isAdmin && dispute.status === "UNDER_REVIEW" && (
                          <Link
                            href={`/payroll/tracking/disputes/${dispute._id}/review`}
                            className="text-green-400 hover:text-green-300"
                          >
                            Review
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
  );
}
