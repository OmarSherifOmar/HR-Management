"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, Eye, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";

interface Claim {
  _id: string;
  claimId: string;
  description: string;
  claimType: string;
  employeeId: string;
  amount: number;
  approvedAmount: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolutionComment?: string;
  rejectionReason?: string;
  payrollSpecialistId?: string;
  payrollManagerId?: string;
}

export default function ClaimDetailPage() {
  const params = useParams();
  const claimId = params?.claimId as string;

  const { user } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (claimId) {
      fetchClaimDetail(claimId);
    } else {
      setLoading(false);
      setError("Missing claim ID");
    }
  }, [claimId]);

  const fetchClaimDetail = async (cId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/claims/${cId}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch claim details");
      const data = await response.json();
      setClaim(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status: string) => (status || "").toLowerCase();

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "approved":
        return "bg-green-600/20 text-green-400";
      case "rejected":
        return "bg-red-600/20 text-red-400";
      case "under review":
        return "bg-yellow-600/20 text-yellow-400";
      case "pending payroll manager approval":
        return "bg-blue-600/20 text-blue-400";
      default:
        return "bg-gray-600/20 text-gray-400";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizedRole = String(user?.role || "").toLowerCase();
  const isSpecialist = normalizedRole === "payroll specialist";
  const isManager = normalizedRole === "payroll manager";
  const isFinanceStaff = normalizedRole === "finance staff";
  const isAdminReviewer = isSpecialist || isManager;

  if (loading) {
    return (
      <DashboardLayout
        title="Claim Details"
        description="View claim information and status"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading claim details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !claim) {
    return (
      <DashboardLayout
        title="Claim Details"
        description="View claim information and status"
      >
        <div className="bg-red-600/20 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300">{error || "Claim not found"}</p>
          <Link
            href="/payroll/tracking/claims"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Claims
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Claim Details"
      description="View claim information and status"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/payroll/tracking/claims"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333333] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Claims
        </Link>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg p-6 mb-6 ${getStatusColor(claim.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-1">Current Status</p>
            <p className="text-2xl font-bold">
              {normalizeStatus(claim.status) ===
              "pending payroll manager approval"
                ? "Pending Payroll Manager Approval"
                : claim.status.replace("_", " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm mb-1">Last Updated</p>
            <p className="text-sm font-medium">{formatDate(claim.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Claim Information */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Claim Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Claim Type</p>
            <p className="text-lg font-semibold text-white capitalize">
              {claim.claimType}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Submitted Date</p>
            <p className="text-lg font-semibold text-white">
              {formatDate(claim.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Claimed Amount</p>
            <p className="text-2xl font-bold text-blue-400">
              {formatCurrency(claim.amount)}
            </p>
          </div>
          {claim.approvedAmount !== null && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Approved Amount</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(claim.approvedAmount)}
              </p>
              {claim.approvedAmount !== claim.amount && (
                <p className="text-xs text-gray-500 mt-1">
                  Adjusted from original claim amount
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <p className="text-gray-300 whitespace-pre-wrap">
            {claim.description}
          </p>
        </div>
      </div>

      {/* Resolution Details */}
      {normalizeStatus(claim.status) === "approved" &&
        claim.resolutionComment && (
          <div className="bg-green-600/20 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-400 mb-4">
              Approval Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-green-400 mb-1">
                  Resolution Comment
                </p>
                <p className="text-green-300 whitespace-pre-wrap">
                  {claim.resolutionComment}
                </p>
              </div>
              {claim.approvedAmount !== null && (
                <div>
                  <p className="text-sm font-medium text-green-400 mb-1">
                    Approved Amount
                  </p>
                  <p className="text-2xl font-bold text-green-300">
                    {formatCurrency(claim.approvedAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {normalizeStatus(claim.status) === "rejected" &&
        claim.rejectionReason && (
          <div className="bg-red-600/20 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4">
              Rejection Details
            </h2>
            <div>
              <p className="text-sm font-medium text-red-400 mb-2">
                Reason for Rejection
              </p>
              <p className="text-red-300 whitespace-pre-wrap">
                {claim.rejectionReason}
              </p>
            </div>
          </div>
        )}

      {/* Timeline */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <Send size={18} />
            </div>
            <div className="ml-4 flex-1">
              <p className="font-semibold text-white">Claim Submitted</p>
              <p className="text-sm text-gray-400">
                {formatDate(claim.createdAt)}
              </p>
            </div>
          </div>

          {normalizeStatus(claim.status) !== "pending" && (
            <div className="flex items-start">
              <div className="shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white">
                <Eye size={18} />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-white">Under Review</p>
                <p className="text-sm text-gray-400">Being processed</p>
              </div>
            </div>
          )}

          {["approved", "rejected"].includes(normalizeStatus(claim.status)) && (
            <div className="flex items-start">
              <div
                className={`shrink-0 w-10 h-10 ${
                  normalizeStatus(claim.status) === "approved"
                    ? "bg-green-600"
                    : "bg-red-600"
                } rounded-full flex items-center justify-center text-white`}
              >
                {claim.status === "APPROVED" ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-white">
                  {normalizeStatus(claim.status) === "approved"
                    ? "Claim Approved"
                    : "Claim Rejected"}
                </p>
                <p className="text-sm text-gray-400">
                  {formatDate(claim.updatedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {normalizeStatus(claim.status) === "under review" && (
        <div className="bg-blue-600/20 rounded-lg p-6">
          <h3 className="font-semibold text-blue-400 mb-2">
            Claim Under Review
          </h3>
          <p className="text-sm text-blue-300 mb-4">
            Your claim is currently being reviewed by the payroll team. You will
            be notified once a decision has been made.
          </p>
          <p className="text-sm text-blue-300">
            Expected processing time: 3-5 business days
          </p>
        </div>
      )}

      {normalizeStatus(claim.status) === "approved" && (
        <div className="bg-green-600/20 rounded-lg p-6">
          <h3 className="font-semibold text-green-400 mb-2">Next Steps</h3>
          <p className="text-sm text-green-300">
            Your approved claim will be processed in the next payroll cycle. The
            refund will appear in your upcoming payslip.
          </p>
        </div>
      )}

      {/* Finance Staff Actions - Generate Refund for Approved Claims */}
      {isFinanceStaff && normalizeStatus(claim.status) === "approved" && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Finance Actions
          </h2>
          <p className="text-gray-400 mb-4">
            This {claim.claimType} claim has been approved. Generate a refund to
            include it in the next payroll cycle.
          </p>
          <Link
            href={`/payroll/tracking/refunds?claimId=${claim.claimId}`}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
          >
            Generate Refund
          </Link>
        </div>
      )}

      {/* Specialist / Manager Review Actions */}
      {claim && isAdminReviewer && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {isSpecialist
              ? "Payroll Specialist Decision"
              : "Payroll Manager Decision"}
          </h2>

          {/* Only allow specialist on under review, manager on pending manager approval */}
          {isSpecialist && normalizeStatus(claim.status) !== "under review" && (
            <p className="text-sm text-gray-400">
              This claim is no longer awaiting specialist review.
            </p>
          )}
          {isManager &&
            normalizeStatus(claim.status) !==
              "pending payroll manager approval" && (
              <p className="text-sm text-gray-400">
                This claim is not pending payroll manager approval.
              </p>
            )}

          {((isSpecialist &&
            normalizeStatus(claim.status) === "under review") ||
            (isManager &&
              normalizeStatus(claim.status) ===
                "pending payroll manager approval")) && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!claim) return;
                setSubmitting(true);
                setSubmitError(null);
                try {
                  const isManagerFlow = isManager;
                  const url = isManagerFlow
                    ? `http://localhost:3000/payroll-tracking/claims/${claim.claimId}/manager-decision`
                    : `http://localhost:3000/payroll-tracking/claims/${claim.claimId}/specialist-decision`;

                  const payload: {
                    action: "approve" | "reject";
                    comment?: string;
                    approvedAmount?: number;
                  } = {
                    action,
                  };
                  if (comment.trim()) payload.comment = comment.trim();

                  // Allow specialist to set approved amount for expense claims
                  if (
                    !isManagerFlow &&
                    action === "approve" &&
                    claim.claimType.toLowerCase() === "expense" &&
                    approvedAmountInput.trim()
                  ) {
                    const parsed = Number(approvedAmountInput);
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      payload.approvedAmount = parsed;
                    }
                  }

                  const resp = await fetch(url, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                  });

                  if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(txt || "Failed to submit decision");
                  }

                  await fetchClaimDetail(claim._id);
                } catch (err) {
                  setSubmitError(
                    err instanceof Error
                      ? err.message
                      : "Failed to submit decision"
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-6 mt-4"
            >
              {submitError && (
                <div className="bg-red-600/20 rounded-lg p-3 text-sm text-red-400">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Decision
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="action"
                      value="approve"
                      checked={action === "approve"}
                      onChange={() => setAction("approve")}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="ml-2 text-gray-300">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="action"
                      value="reject"
                      checked={action === "reject"}
                      onChange={() => setAction("reject")}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="ml-2 text-gray-300">Reject</span>
                  </label>
                </div>
              </div>

              {/* Approved amount for expense claims (specialist only) */}
              {!isManager && claim.claimType.toLowerCase() === "expense" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Approved Amount (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={approvedAmountInput}
                    onChange={(e) => setApprovedAmountInput(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to use claimed amount"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {action === "approve"
                    ? "Resolution Comment"
                    : "Rejection Reason"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder={
                    action === "approve"
                      ? "Describe the resolution and any adjustments made..."
                      : "Explain why this claim is being rejected..."
                  }
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium ${
                    action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submitting
                    ? "Processing..."
                    : action === "approve"
                    ? isSpecialist
                      ? "Approve & Escalate"
                      : "Approve Claim"
                    : "Reject Claim"}
                </button>
                <Link
                  href="/payroll/tracking/claims"
                  className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333333] transition-colors font-medium"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
