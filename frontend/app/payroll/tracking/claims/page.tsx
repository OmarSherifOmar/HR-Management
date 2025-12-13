"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Claim {
  _id: string;
  claimId: string;
  description: string;
  claimType: string;
  amount: number;
  approvedAmount: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolutionComment?: string;
  rejectionReason?: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const storedEmployeeId = localStorage.getItem("employeeId") || "";
    setEmployeeId(storedEmployeeId);
    if (storedEmployeeId) {
      fetchClaims(storedEmployeeId);
    } else {
      setLoading(false);
      setError("Employee ID not found. Please log in.");
    }
  }, []);

  const fetchClaims = async (empId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/claims/mine`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data = await response.json();
      setClaims(data);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredClaims =
    filterStatus === "all"
      ? claims
      : claims.filter((c) => c.status === filterStatus);

  const claimStats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "UNDER_REVIEW").length,
    approved: claims.filter((c) => c.status === "APPROVED").length,
    rejected: claims.filter((c) => c.status === "REJECTED").length,
    totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
    approvedAmount: claims
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + (c.approvedAmount || c.amount), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Claims</h1>
            <p className="text-lg text-gray-600">
              Submit and track your reimbursement claims
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/payroll/tracking/claims/create"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              + New Claim
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
            <p className="text-gray-600 text-sm mb-2">Total Claims</p>
            <p className="text-3xl font-bold text-gray-900">
              {claimStats.total}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Under Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {claimStats.pending}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {claimStats.approved}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Approved Amount</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(claimStats.approvedAmount)}
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Claims</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span className="text-gray-600">
              Showing {filteredClaims.length} of {claims.length} claims
            </span>
          </div>
        </div>

        {/* Claims List */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              {filterStatus === "all"
                ? "No claims found"
                : `No ${filterStatus.toLowerCase().replace("_", " ")} claims`}
            </p>
            <Link
              href="/payroll/tracking/claims/create"
              className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Your First Claim
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {filteredClaims.map((claim) => (
                    <tr key={claim._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {claim.claimId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 capitalize">
                          {claim.claimType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {claim.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(claim.amount)}
                        </div>
                        {claim.approvedAmount !== null &&
                          claim.approvedAmount !== claim.amount && (
                            <div className="text-xs text-green-600">
                              Approved: {formatCurrency(claim.approvedAmount)}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            claim.status
                          )}`}
                        >
                          {claim.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(claim.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/payroll/tracking/claims/${claim._id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
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
