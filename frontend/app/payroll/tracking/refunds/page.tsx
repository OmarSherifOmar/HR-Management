"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

interface Refund {
  _id: string;
  claimId?: any;
  disputeId?: any;
  employeeId?: any;
  financeStaffId?: string;
  refundDetails: {
    description: string;
    amount: number;
  };
  status: string;
  paidInPayrollRunId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RefundsPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <RefundsPageContent />
    </Suspense>
  );
}

function RefundsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prefilledDisputeId = searchParams.get("disputeId");
  const prefilledClaimId = searchParams.get("claimId");

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProcessForm, setShowProcessForm] = useState(
    !!prefilledDisputeId || !!prefilledClaimId
  );

  const [processForm, setProcessForm] = useState({
    linkedId: prefilledDisputeId || prefilledClaimId || "",
    amount: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const role = user?.role || "";
    const normalizedRole = String(role).toLowerCase();
    const isAdminRole = normalizedRole === "finance staff";
    setIsAdmin(isAdminRole);
    fetchRefunds(isAdminRole);
  }, [user]);

  const fetchRefunds = async (adminOverride?: boolean) => {
    try {
      setLoading(true);
      const role = user?.role || "";
      const normalizedRole = String(role).toLowerCase();
      const isAdminRole =
        adminOverride !== undefined ? adminOverride : normalizedRole === "finance staff";

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const url = isAdminRole
        ? `${URL}/payroll-tracking/refunds/pending`
        : `${URL}/payroll-tracking/me/refunds`;

      const response = await fetch(
        url,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch refunds");
      const data = await response.json();
      setRefunds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!processForm.linkedId) {
      setError("Please provide a claim or dispute ID");
      return;
    }

    const amount = parseFloat(processForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/refunds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            linkedId: processForm.linkedId,
            amount,
            reason: processForm.reason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process refund");
      }

      alert("Refund processed successfully!");
      setShowProcessForm(false);
      setProcessForm({ linkedId: "", amount: "", reason: "" });
      fetchRefunds(isAdmin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsPaid = async (refundId: string) => {
    const payrollRunId = prompt("Enter Payroll Run ID:");
    if (!payrollRunId) return;

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/refunds/${refundId}/mark-paid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ payrollRunId }),
        }
      );

      if (!response.ok) throw new Error("Failed to mark as paid");
      alert("Refund marked as paid!");
      fetchRefunds(isAdmin);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error marking as paid");
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-green-500/20 text-green-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading refunds...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Refunds</h1>
            <p className="text-gray-400">
              {isAdmin
                ? "Process and manage payroll refunds"
                : "Track your refund status"}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowProcessForm(!showProcessForm)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showProcessForm ? "Cancel" : "+ Process Refund"}
              </button>
            )}
            <Link
              href="/payroll/tracking"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Process Refund Form */}
        {showProcessForm && isAdmin && (
          <div className="bg-[#232340] rounded-xl p-6 mb-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">
              Process New Refund
            </h2>
            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Claim/Dispute ID
                  </label>
                  <input
                    type="text"
                    value={processForm.linkedId}
                    onChange={(e) =>
                      setProcessForm({
                        ...processForm,
                        linkedId: e.target.value,
                      })
                    }
                    placeholder="Enter ID"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={processForm.amount}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={processForm.reason}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, reason: e.target.value })
                    }
                    placeholder="Enter reason"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors"
              >
                {submitting ? "Processing..." : "Process Refund"}
              </button>
            </form>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Pending Refunds</p>
            <p className="text-2xl font-bold text-yellow-400">
              {refunds.filter((r) => r.status === "PENDING").length}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Pending Amount</p>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(
                refunds
                  .filter((r) => r.status === "PENDING")
                  .reduce((sum, r) => sum + (r.refundDetails?.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-1">Total Refunds</p>
            <p className="text-2xl font-bold text-white">{refunds.length}</p>
          </div>
        </div>

        {/* Refunds List */}
        {refunds.length === 0 ? (
          <div className="bg-[#232340] rounded-xl p-12 text-center border border-gray-700/50">
            <p className="text-gray-400 text-lg">No pending refunds</p>
          </div>
        ) : (
          <div className="bg-[#232340] rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-[#1a1a2e]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Refund ID
                    </th>
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
                      Created
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {refunds.map((refund) => (
                    <tr
                      key={refund._id}
                      className="hover:bg-[#2a2a4a] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {refund._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {refund.claimId ? "Claim" : "Dispute"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 max-w-xs truncate">
                          {refund.refundDetails?.description || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-400">
                          {formatCurrency(refund.refundDetails?.amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-lg ${getStatusColor(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {formatDate(refund.createdAt)}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {refund.status === "PENDING" && (
                            <button
                              onClick={() => markAsPaid(refund._id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      )}
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
