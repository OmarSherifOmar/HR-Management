"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  ArrowLeft,
  Download,
  FileText,
  Wallet,
  ShieldCheck,
  Gavel,
} from "lucide-react";

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
  const params = useParams();
  const slipId = params?.slipId as string;

  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
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
      <DashboardLayout
        title="Payslip Detail"
        description="Review a complete breakdown of this payroll cycle"
      >
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading payslip...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !payslip) {
    return (
      <DashboardLayout
        title="Payslip Detail"
        description="Review a complete breakdown of this payroll cycle"
      >
        <div className="min-h-screen bg-[#1a1a1a] p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <h3 className="text-red-400 font-semibold mb-2">
                Unable to load payslip
              </h3>
              <p className="text-red-300">{error || "Payslip not found"}</p>
              <Link
                href="/payroll/tracking/payslips"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Payslips
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusColor = () => {
    switch ((payslip.paymentStatus || "").toLowerCase()) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const sectionHasData = (items: any[]) => items && items.length > 0;

  return (
    <DashboardLayout
      title="Payslip Detail"
      description="Review a complete breakdown of this payroll cycle"
    >
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {payslip.month || "Payslip"}
              </h1>
              <p className="text-gray-400 mt-1">
                Generated on {formatDate(payslip.generatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPayslip}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <Link
                href="/payroll/tracking/payslips"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Payslips
              </Link>
            </div>
          </div>

          {/* Employment Status */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Status</p>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold mt-1 ${statusColor()}`}
                  >
                    {payslip.paymentStatus || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Contract Type</p>
                  <p className="text-white font-medium mt-1">
                    {payslip.contractType || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Work Type</p>
                  <p className="text-white font-medium mt-1">
                    {payslip.workType || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Summary */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Salary Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-gray-300">Base Salary</span>
                <span className="text-white font-medium">
                  {formatCurrency(payslip.baseSalary)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-gray-300">Gross Salary</span>
                <span className="text-blue-300 font-semibold text-lg">
                  {formatCurrency(payslip.grossSalary)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-gray-300">Total Deductions</span>
                <span className="text-red-400 font-semibold text-lg">
                  -{formatCurrency(payslip.totalDeductions)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-green-500/10 px-4 py-3 rounded-lg">
                <span className="text-white font-semibold text-lg">
                  Net Pay
                </span>
                <span className="text-green-400 font-bold text-2xl">
                  {formatCurrency(payslip.netPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Earnings</h2>
            {[
              { title: "Allowances", items: payslip.allowances },
              { title: "Bonuses", items: payslip.bonuses },
              { title: "Benefits", items: payslip.benefits },
              { title: "Refunds", items: payslip.refunds },
            ].map((section, idx) =>
              sectionHasData(section.items) ? (
                <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    {section.title}
                  </h3>
                  <div className="mt-2 divide-y divide-white/5 rounded-lg border border-white/5">
                    {section.items.map((item: any, itemIdx: number) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <span className="text-gray-300">
                          {item.name || item.description || section.title}
                        </span>
                        <span className="text-green-300 font-medium">
                          {formatCurrency(item.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {!sectionHasData(payslip.allowances) &&
              !sectionHasData(payslip.bonuses) &&
              !sectionHasData(payslip.benefits) &&
              !sectionHasData(payslip.refunds) && (
                <p className="text-gray-400 text-sm">
                  No additional earnings recorded.
                </p>
              )}
          </div>

          {/* Deductions Breakdown */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Deductions
            </h2>

            {[
              { title: "Taxes", items: payslip.taxes },
              { title: "Insurance", items: payslip.insurances },
            ].map((section, idx) =>
              sectionHasData(section.items) ? (
                <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    {section.title}
                  </h3>
                  <div className="mt-2 divide-y divide-white/5 rounded-lg border border-white/5">
                    {section.items.map((item: any, itemIdx: number) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <span className="text-gray-300">
                          {item.name || section.title}
                        </span>
                        <span className="text-red-300 font-medium">
                          -{formatCurrency(item.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {payslip.unpaidLeaveDays > 0 && (
              <div className="mt-5 bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-4 py-3">
                <p className="text-sm text-yellow-200">
                  <span className="font-semibold">Unpaid Leave Days:</span>{" "}
                  {payslip.unpaidLeaveDays} days
                </p>
              </div>
            )}

            {!sectionHasData(payslip.taxes) &&
              !sectionHasData(payslip.insurances) &&
              payslip.unpaidLeaveDays === 0 && (
                <p className="text-gray-400 text-sm">
                  No deductions applied for this payslip.
                </p>
              )}
          </div>

          {/* Dispute Information */}
          {payslip.dispute && (
            <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6 border border-purple-500/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Gavel className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Dispute Information
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Track the current status and resolution updates for this
                    dispute.
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  <span className="font-semibold text-white">Status:</span>{" "}
                  {payslip.dispute.status}
                </p>
                <p>
                  <span className="font-semibold text-white">Description:</span>{" "}
                  {payslip.dispute.description}
                </p>
                {payslip.dispute.resolutionComment && (
                  <p>
                    <span className="font-semibold text-white">
                      Resolution:
                    </span>{" "}
                    {payslip.dispute.resolutionComment}
                  </p>
                )}
                {payslip.dispute.rejectionReason && (
                  <p className="text-red-300">
                    <span className="font-semibold text-white">
                      Rejection Reason:
                    </span>{" "}
                    {payslip.dispute.rejectionReason}
                  </p>
                )}
                {payslip.dispute.updatedAt && (
                  <p className="text-xs text-gray-500">
                    Last updated {formatDate(payslip.dispute.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Next Steps
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/payroll/tracking/disputes/create?payslipId=${payslip._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                <Gavel className="w-4 h-4" /> Raise a Dispute
              </Link>
              <Link
                href={`/payroll/tracking/claims/create`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Submit a Claim
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
