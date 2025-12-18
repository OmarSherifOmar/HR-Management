"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/DashboardLayout";
import { ArrowLeft } from "lucide-react";

export default function CreateClaimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    claimType: "general",
    description: "",
    amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/claims",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            claimType: formData.claimType,
            description: formData.description,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create claim");
      }

      const data = await response.json();
      alert("Claim submitted successfully!");
      router.push(`/payroll/tracking/claims/${data._id}`);
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
      title="Submit New Claim"
      description="Request reimbursement for work-related expenses"
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-600/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-[#2a2a2a] rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claim Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Claim Type <span className="text-red-400">*</span>
            </label>
            <select
              name="claimType"
              value={formData.claimType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="general">General</option>
              <option value="expense">Expense Reimbursement</option>
              <option value="travel">Travel</option>
              <option value="medical">Medical</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select the category that best describes your claim
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (USD) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the total amount you are claiming
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Provide detailed information about your claim, including dates, purpose, and any relevant details..."
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide as much detail as possible to help process your claim
              quickly
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-600/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">
              Claim Guidelines
            </h3>
            <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
              <li>Ensure all expenses are work-related and approved</li>
              <li>Attach receipts or supporting documents when possible</li>
              <li>Claims are typically reviewed within 3-5 business days</li>
              <li>
                You will be notified via email when your claim is processed
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Submitting..." : "Submit Claim"}
            </button>
            <Link
              href="/payroll/tracking/claims"
              className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333333] transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Additional Info */}
      <div className="mt-6 bg-[#2a2a2a] rounded-lg p-6">
        <h3 className="font-semibold text-white mb-3">Need Help?</h3>
        <p className="text-sm text-gray-300 mb-2">
          If you have questions about claim eligibility or the reimbursement
          process, please contact:
        </p>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>📧 Email: payroll@company.com</li>
          <li>📞 Phone: (555) 123-4567</li>
          <li>⏰ Hours: Monday-Friday, 9 AM - 5 PM</li>
        </ul>
      </div>
    </DashboardLayout>
  );
}
