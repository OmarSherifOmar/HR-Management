"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../context/AuthContext";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { ArrowLeft } from "lucide-react";

interface Claim {
  claimId: string;
  description: string;
  createdAt: string;
  status: string;
  amount?: number;
}

export default function ReviewClaimPage() {
  const router = useRouter();
  const params = useParams();
  const claimId = params?.claimId as string;

  const { user } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    if (claimId) {
      fetchClaimDetail(claimId);
    }
  }, [claimId]);

  const fetchClaimDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/claims/${id}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch claim");
      const data = await response.json();
      setClaim(data);
      setError(null); // Clear error on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setClaim(null); // Ensure claim is null if error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      const role = user?.role || "";
      const normalizedRole = String(role).toLowerCase();
      const isManager = normalizedRole.includes("manager");

      const endpoint = isManager
        ? `http://localhost:3000/payroll-tracking/claims/${claimId}/manager-decision`
        : `http://localhost:3000/payroll-tracking/claims/${claimId}/specialist-decision`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action,
          comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process decision");
      }

      alert(
        `Claim ${action === "approve" ? "approved" : "rejected"} successfully!`
      );
      router.push(`/payroll/tracking/claims/${claimId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Review Claim"
        description="Review and make a decision on this claim"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!claim) {
    return (
      <DashboardLayout
        title="Review Claim"
        description="Review and make a decision on this claim"
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
      title="Review Claim"
      description="Review and make a decision on this claim"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href={`/payroll/tracking/claims/${claimId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333333] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Claim
        </Link>
      </div>

      {/* Claim Summary */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Claim Summary</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Description</p>
            <p className="text-white">{claim.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Submitted</p>
              <p className="text-white">
                {new Date(claim.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-white">{claim.status}</p>
            </div>
          </div>

          {claim.amount !== undefined && (
            <div>
              <p className="text-sm text-gray-400">Claim Amount</p>
              <p className="text-lg font-semibold text-green-400">
                ${claim.amount.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error (only show if claim exists and error is not null) */}
      {error && !loading && (
        <div className="mb-6 bg-red-600/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Review Form */}
      <div className="bg-[#2a2a2a] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Make Decision</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Decision
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={action === "approve"}
                  onChange={() => setAction("approve")}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-gray-300">Approve</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  checked={action === "reject"}
                  onChange={() => setAction("reject")}
                  className="w-4 h-4 text-red-600"
                />
                <span className="ml-2 text-gray-300">Reject</span>
              </label>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {action === "approve" ? "Approval Comment" : "Rejection Reason"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
              placeholder={
                action === "approve"
                  ? "Describe approval details..."
                  : "Explain why this claim is rejected..."
              }
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition ${
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting
                ? "Processing..."
                : action === "approve"
                ? "Approve Claim"
                : "Reject Claim"}
            </button>

            <Link
              href={`/payroll/tracking/claims/${claimId}`}
              className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333333] font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
