"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { Plus, ArrowLeft } from "lucide-react";

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
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFinanceStaff, setIsFinanceStaff] = useState(false);

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
    setIsFinanceStaff(normalizedRole === "finance staff");

    if (isAdminRole) {
      fetchAllClaims();
    } else {
      fetchMyClaims();
    }
  }, [user]);

  const fetchMyClaims = async () => {
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

  const fetchAllClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/claims`,
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
      month: "short",
      day: "numeric",
    });
  };
  ///
  const normalizeStatus = (status: string) =>
    status?.toString().trim().toUpperCase().replace(/\s+/g, "_");

  const filteredClaims =
    filterStatus === "all"
      ? claims
      : claims.filter(
          (c) => normalizeStatus(c.status) === normalizeStatus(filterStatus)
        );

  const claimStats = {
    total: claims.length,
    pending: claims.filter((c) => normalizeStatus(c.status) === "UNDER_REVIEW")
      .length,
    approved: claims.filter((c) => normalizeStatus(c.status) === "APPROVED")
      .length,
    rejected: claims.filter((c) => normalizeStatus(c.status) === "REJECTED")
      .length,
    approvedAmount: claims
      .filter((c) => normalizeStatus(c.status) === "APPROVED")
      .reduce((sum, c) => sum + (c.approvedAmount || c.amount), 0),
  };
  ////

  if (loading) {
    return (
      <DashboardLayout
        title={isAdmin ? "All Claims" : "My Claims"}
        description={
          isAdmin
            ? "Review and manage employee reimbursement claims"
            : "Submit and track your reimbursement claims"
        }
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading claims...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Claims"
        description="Submit and track your reimbursement claims"
      >
        <div className="bg-red-600/20 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => router.push("/payroll/tracking")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isAdmin ? "All Claims" : "My Claims"}
      description={
        isAdmin
          ? "Review and manage employee reimbursement claims"
          : "Submit and track your reimbursement claims"
      }
    >
      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/payroll/tracking"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333333] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Tracking
        </Link>
        <Link
          href="/payroll/tracking/claims/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          New Claim
        </Link>
      </div>

      {/* Finance Notification for Approved Claims */}
      {isFinanceStaff && claimStats.approved > 0 && (
        <div className="mb-6 bg-green-600/20 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-green-300 font-semibold">
              {claimStats.approved} approved claims need refunds to be
              processed.
            </p>
            <p className="text-green-200/80 text-sm">
              Click below to filter approved claims ready for refund generation.
            </p>
          </div>
          <button
            onClick={() => setFilterStatus("APPROVED")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            View Approved Claims
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Total Claims</p>
          <p className="text-2xl font-bold text-white">{claimStats.total}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Under Review</p>
          <p className="text-2xl font-bold text-yellow-400">
            {claimStats.pending}
          </p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-400">
            {claimStats.approved}
          </p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-5">
          <p className="text-gray-400 text-sm mb-1">Total Approved</p>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(claimStats.approvedAmount)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-300">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Claims</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <span className="text-gray-500">
            Showing {filteredClaims.length} of {claims.length} claims
          </span>
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="bg-[#2a2a2a] rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">
            {filterStatus === "all"
              ? "No claims found"
              : `No ${filterStatus.toLowerCase().replace("_", " ")} claims`}
          </p>
          <Link
            href="/payroll/tracking/claims/create"
            className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit Your First Claim
          </Link>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
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
              <tbody className="divide-y divide-gray-800">
                {filteredClaims.map((claim) => (
                  <tr
                    key={claim._id}
                    className="hover:bg-[#333333] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 capitalize">
                        {claim.claimType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 max-w-xs truncate">
                        {claim.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(claim.amount)}
                      </div>
                      {claim.approvedAmount !== null &&
                        claim.approvedAmount !== claim.amount && (
                          <div className="text-xs text-green-400">
                            Approved: {formatCurrency(claim.approvedAmount)}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${getStatusColor(
                          claim.status
                        )}`}
                      >
                        {claim.status?.replace("_", " ") || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {formatDate(claim.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/payroll/tracking/claims/${claim._id}`}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        View Details
                      </Link>
                      {isFinanceStaff &&
                        normalizeStatus(claim.status) === "APPROVED" && (
                          <Link
                            href={`/payroll/tracking/refunds?claimId=${claim.claimId}`}
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
    </DashboardLayout>
  );
}
