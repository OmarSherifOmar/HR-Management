"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../context/AuthContext";

interface Dispute {
  disputeId: string;
  description: string;
  createdAt: string;
  status: string;
  // Add other fields as needed based on your API response
}

export default function ReviewDisputePage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = params?.disputeId as string;

  const { user } = useAuth();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    if (disputeId) {
      fetchDisputeDetail(disputeId);
    }
  }, [disputeId]);

  const fetchDisputeDetail = async (dId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/disputes/${dId}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch dispute");
      const data = await response.json();
      setDispute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      // Determine the endpoint based on role
      const role = user?.role || "";
      const normalizedRole = String(role).toLowerCase();
      const isManager = normalizedRole.includes("manager");

      const endpoint = isManager
        ? `http://localhost:3000/payroll-tracking/disputes/${disputeId}/manager-decision`
        : `http://localhost:3000/payroll-tracking/disputes/${disputeId}/specialist-decision`;

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
        `Dispute ${
          action === "approve" ? "approved" : "rejected"
        } successfully!`
      );
      router.push(`/payroll/tracking/disputes/${disputeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error || "Dispute not found"}</p>
            <Link
              href="/payroll/tracking/disputes"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Disputes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Review Dispute</h1>
        </div>

        {/* Dispute Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dispute Summary
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-900">{dispute.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-gray-900">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-gray-900">{dispute.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Make Decision
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  <span className="ml-2 text-gray-700">Approve</span>
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
                  <span className="ml-2 text-gray-700">Reject</span>
                </label>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    : "Explain why this dispute is being rejected..."
                }
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium ${
                  action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : action === "approve"
                  ? "Approve Dispute"
                  : "Reject Dispute"}
              </button>
              <Link
                href={`/payroll/tracking/disputes/${disputeId}`}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
