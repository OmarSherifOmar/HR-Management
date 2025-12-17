"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface PayslipDetail {
  _id: string;
  month: string;
  generatedAt: string;
  paymentStatus: string;
  contractType: string | null;
  workType: string | null;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  allowances: any[];
  bonuses: any[];
  benefits: any[];
  refunds: any[];
  taxes: any[];
  insurances: any[];
  penalties: any;
  unpaidLeaveDays: number;
  dispute: {
    disputeId: string;
    status: string;
    description: string;
    resolutionComment: string | null;
    rejectionReason: string | null;
    updatedAt: string | null;
  } | null;
}

export default function PayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slipId = params?.slipId as string;

  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");

  useEffect(() => {
    const storedEmployeeId = localStorage.getItem("employeeId") || "";
    setEmployeeId(storedEmployeeId);
    if (slipId) {
      fetchPayslipDetail(slipId);
    } else {
      setLoading(false);
      setError("Missing payslip ID");
    }
  }, [slipId]);

  const fetchPayslipDetail = async (slip: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/me/payslips/${slip}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch payslip details");
      const data = await response.json();
      setPayslip(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/me/payslips/${slipId}/download`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to download payslip");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${payslip?.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download payslip");
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
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payslip...</p>
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error || "Payslip not found"}</p>
            <Link
              href="/payroll/tracking/payslips"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Payslips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Payslip for {payslip.month}
            </h1>
            <p className="text-white">
              Generated on {formatDate(payslip.generatedAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadPayslip}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              📄 Download PDF
            </button>
            <Link
              href="/payroll/tracking/payslips"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Status and Employment Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {payslip.paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {payslip.contractType || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Work Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {payslip.workType || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Salary Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Salary Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-700">Base Salary</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payslip.baseSalary)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-700 font-medium">Gross Salary</span>
              <span className="font-bold text-blue-600 text-lg">
                {formatCurrency(payslip.grossSalary)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-700 font-medium">
                Total Deductions
              </span>
              <span className="font-bold text-red-600 text-lg">
                -{formatCurrency(payslip.totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 bg-green-50 p-4 rounded">
              <span className="text-gray-900 font-bold text-lg">Net Pay</span>
              <span className="font-bold text-green-600 text-2xl">
                {formatCurrency(payslip.netPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings</h2>

          {payslip.allowances.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Allowances</h3>
              <div className="space-y-2">
                {payslip.allowances.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name || "Allowance"}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payslip.bonuses.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Bonuses</h3>
              <div className="space-y-2">
                {payslip.bonuses.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name || "Bonus"}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payslip.benefits.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Benefits</h3>
              <div className="space-y-2">
                {payslip.benefits.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name || "Benefit"}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payslip.refunds.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Refunds</h3>
              <div className="space-y-2">
                {payslip.refunds.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.description || "Refund"}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Deductions Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deductions</h2>

          {payslip.taxes.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Taxes</h3>
              <div className="space-y-2">
                {payslip.taxes.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name || "Tax"}</span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payslip.insurances.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Insurance</h3>
              <div className="space-y-2">
                {payslip.insurances.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-900">
                      {item.name || "Insurance"}
                    </span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(item.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payslip.unpaidLeaveDays > 0 && (
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Unpaid Leave Days:</span>{" "}
                {payslip.unpaidLeaveDays} days
              </p>
            </div>
          )}
        </div>

        {/* Dispute Information */}
        {payslip.dispute && (
          <div className="bg-white rounded-lg  p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Dispute Information
            </h2>
            <div className="text-gray-900 space-y-2">
              <p>
                <span className="font-bold text-gray-900">Status:</span>{" "}
                {payslip.dispute.status}
              </p>
              <p>
                <span className="font-bold text-gray-900">Description:</span>{" "}
                {payslip.dispute.description}
              </p>
              {payslip.dispute.resolutionComment && (
                <p>
                  <span className="font-bold text-gray-900">Resolution:</span>{" "}
                  {payslip.dispute.resolutionComment}
                </p>
              )}
              {payslip.dispute.rejectionReason && (
                <p className="text-red-600">
                  <span className="font-bold text-gray-900">
                    Rejection Reason:
                  </span>{" "}
                  {payslip.dispute.rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="flex gap-3">
            <Link
              href={`/payroll/tracking/disputes/create?payslipId=${payslip._id}`}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Raise a Dispute
            </Link>
            <Link
              href={`/payroll/tracking/claims/create`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Submit a Claim
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
