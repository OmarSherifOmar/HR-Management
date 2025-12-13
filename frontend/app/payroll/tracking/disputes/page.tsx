"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const isAdminRole = [
      "admin",
      "payroll_manager",
      "payroll_specialist",
    ].includes(role.toLowerCase());
    setIsAdmin(isAdminRole);

    if (
      isAdminRole ||
      role.toLowerCase().includes("admin") ||
      role.toLowerCase().includes("manager")
    ) {
      fetchAllDisputes();
    } else {
      fetchEmployeeDisputes();
    }
  }, []);

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
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {isAdmin ? "All Disputes" : "My Disputes"}
            </h1>
            <p className="text-lg text-gray-600">
              {isAdmin
                ? "Review and manage payroll disputes"
                : "Track your payroll dispute status"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/payroll/tracking/disputes/create"
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              + New Dispute
            </Link>
            <Link
              href="/payroll/tracking"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Disputes</p>
            <p className="text-3xl font-bold text-gray-900">
              {disputeStats.total}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Under Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {disputeStats.pending}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Resolved</p>
            <p className="text-3xl font-bold text-green-600">
              {disputeStats.approved}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {disputeStats.rejected}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">
              Filter by Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                if (isAdmin) fetchAllDisputes(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Disputes</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span className="text-gray-600">
              Showing {filteredDisputes.length} of {displayedDisputes.length}{" "}
              disputes
            </span>
          </div>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              {filterStatus === "all"
                ? "No disputes found"
                : `No ${filterStatus.toLowerCase().replace("_", " ")} disputes`}
            </p>
            <Link
              href="/payroll/tracking/disputes/create"
              className="mt-4 inline-block px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Raise a Dispute
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payslip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.disputeId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {dispute.payslipId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {dispute.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            dispute.status
                          )}`}
                        >
                          {dispute.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(dispute.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/payroll/tracking/disputes/${dispute._id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </Link>
                        {isAdmin && dispute.status === "UNDER_REVIEW" && (
                          <Link
                            href={`/payroll/tracking/disputes/${dispute._id}/review`}
                            className="text-green-600 hover:text-green-800"
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
