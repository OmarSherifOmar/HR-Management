"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/DashboardLayout";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface Payslip {
  _id: string;
  month: string;
  netPay: number;
}

export default function CreateDisputePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <CreateDisputeContent />
    </Suspense>
  );
}

function CreateDisputeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledPayslipId = searchParams.get("payslipId") || "";

  const [loading, setLoading] = useState(false);
  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const [formData, setFormData] = useState({
    payslipId: prefilledPayslipId,
    reason: "",
    amount: "",
  });

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoadingPayslips(true);
      const response = await fetch(`${URL}/payroll-tracking/me/payslips`, {
        credentials: "include",
      });
      console.log("Payslips response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch payslips:", errorText);
        throw new Error("Failed to fetch payslips");
      }
      const data = await response.json();
      console.log("Fetched payslips:", data);
      setPayslips(data);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      setError("Failed to load payslips. Please make sure you are logged in.");
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.payslipId) {
      setError("Please select a payslip");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please provide a reason for the dispute");
      return;
    }

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      const response = await fetch(`${URL}/payroll-tracking/disputes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          payslipId: formData.payslipId,
          reason: formData.reason,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create dispute");
      }

      const data = await response.json();
      alert("Dispute submitted successfully!");
      router.push(`/payroll/tracking/disputes/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <DashboardLayout
      title="Raise a Dispute"
      description="Report discrepancies in your payroll"
    >
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Raise a Dispute
            </h1>
            <p className="text-lg text-gray-300">
              Report discrepancies in your payroll
            </p>
          </div>

          {/* Warning Message */}
          <div className="mb-6 bg-yellow-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-300 mb-1">
                  Before You Submit
                </h3>
                <p className="text-sm text-yellow-200">
                  Please ensure you have reviewed your payslip carefully.
                  Disputes should only be raised for genuine discrepancies such
                  as incorrect calculations, missing allowances, or unauthorized
                  deductions.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-[#2a2a2a] rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Select Payslip */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Payslip <span className="text-red-500">*</span>
                </label>
                {loadingPayslips ? (
                  <p className="text-gray-400">Loading payslips...</p>
                ) : payslips.length === 0 ? (
                  <div className="bg-yellow-500/10 rounded-lg p-4">
                    <p className="text-yellow-300">
                      No payslips found. You need at least one payslip to create
                      a dispute.
                    </p>
                    <Link
                      href="/payroll/tracking/payslips"
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                    >
                      Go to Payslips
                    </Link>
                  </div>
                ) : (
                  <select
                    name="payslipId"
                    value={formData.payslipId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select a payslip --</option>
                    {payslips.map((slip) => (
                      <option key={slip._id} value={slip._id}>
                        {slip.month || "Unknown date"} - Net Pay: $
                        {slip.netPay?.toLocaleString() || 0}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-sm text-gray-400">
                  Select the payslip you want to dispute
                </p>
              </div>

              {/* Disputed Amount (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Disputed Amount (USD){" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Enter the amount in question if applicable
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Dispute <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Please describe the issue in detail. Include specific items, expected amounts vs actual amounts, and any supporting information..."
                  className="w-full px-4 py-2 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Be as specific as possible to help us investigate quickly
                </p>
              </div>

              {/* Common Dispute Types */}
              <div className="bg-blue-500/10 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-3">
                  Common Dispute Categories
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-300">
                  <div>- Incorrect base salary</div>
                  <div>- Missing allowances</div>
                  <div>- Wrong tax deductions</div>
                  <div>- Insurance calculation error</div>
                  <div>- Incorrect leave deductions</div>
                  <div>- Missing bonuses</div>
                  <div>- Overtime not calculated</div>
                  <div>- Other discrepancies</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {loading ? "Submitting..." : "Submit Dispute"}
                </button>
                <Link
                  href="/payroll/tracking/disputes"
                  className="flex items-center gap-2 px-6 py-3 bg-[#333333] text-white rounded-lg hover:bg-[#404040] transition-colors font-medium shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Process Timeline */}
          <div className="mt-6 bg-[#2a2a2a] rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-white mb-4">
              Dispute Resolution Process
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Submit Dispute</p>
                  <p className="text-sm text-gray-300">
                    Your dispute is logged in our system
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Specialist Review</p>
                  <p className="text-sm text-gray-300">
                    Payroll specialist investigates (2-3 days)
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Manager Approval</p>
                  <p className="text-sm text-gray-300">
                    Manager reviews and approves resolution
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  4
                </div>
                <div>
                  <p className="font-medium text-white">Resolution</p>
                  <p className="text-sm text-gray-300">
                    Refund processed in next payroll cycle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
