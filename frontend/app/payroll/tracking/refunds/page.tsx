"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const role = localStorage.getItem("userRole") || "";
    setIsAdmin(
      [
        "admin",
        "payroll_manager",
        "finance_staff",
        "payroll_specialist",
      ].includes(role.toLowerCase())
    );
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/refunds/pending",
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
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("userRole");

      const response = await fetch(
        "http://localhost:3000/payroll-tracking/refunds/process",
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
      fetchRefunds();
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
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/refunds/${refundId}/mark-paid`,
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
      fetchRefunds();
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
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading refunds...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Refunds</h1>
            <p className="text-lg text-gray-600">
              {isAdmin
                ? "Process and manage payroll refunds"
                : "Track your refund status"}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowProcessForm(!showProcessForm)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                {showProcessForm ? "Cancel" : "+ Process Refund"}
              </button>
            )}
            <Link
              href="/payroll/tracking"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Process Refund Form */}
        {showProcessForm && isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Process New Refund
            </h2>
            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={processForm.reason}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, reason: e.target.value })
                    }
                    placeholder="Enter reason"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {submitting ? "Processing..." : "Process Refund"}
              </button>
            </form>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Pending Refunds</p>
            <p className="text-3xl font-bold text-yellow-600">
              {refunds.filter((r) => r.status === "PENDING").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Pending Amount</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(
                refunds
                  .filter((r) => r.status === "PENDING")
                  .reduce((sum, r) => sum + (r.refundDetails?.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Refunds</p>
            <p className="text-3xl font-bold text-gray-900">{refunds.length}</p>
          </div>
        </div>

        {/* Refunds List */}
        {refunds.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No pending refunds</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refund ID
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
                      Created
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {refund._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {refund.claimId ? "Claim" : "Dispute"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {refund.refundDetails?.description || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(refund.refundDetails?.amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(refund.createdAt)}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {refund.status === "PENDING" && (
                            <button
                              onClick={() => markAsPaid(refund._id)}
                              className="text-green-600 hover:text-green-800"
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
