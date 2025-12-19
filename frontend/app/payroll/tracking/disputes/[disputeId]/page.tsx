"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Dispute {
  _id: string;
  disputeId: string;
  description: string;
  payslipId: string;
  employeeId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolutionComment?: string;
  rejectionReason?: string;
  payrollSpecialistId?: string;
  payrollManagerId?: string;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeId = params?.disputeId as string;

  const { user } = useAuth();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFinanceStaff, setIsFinanceStaff] = useState(false);

  useEffect(() => {
    if (!disputeId) {
      setLoading(false);
      setError("Dispute ID not found");
      return;
    }

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

    fetchDisputeDetail(disputeId, isAdminRole);
  }, [disputeId, user]);

  const fetchDisputeDetail = async (dId: string, isAdminRole: boolean) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      setLoading(true);
      const url = isAdminRole
        ? `${URL}/payroll-tracking/disputes/${dId}`
        : `${URL}/payroll-tracking/disputes/mine/${dId}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch dispute details");
      const data = await response.json();
      setDispute(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, hasSpecialist: boolean) => {
    const normalized = status.toUpperCase();

    // Derive "pending manager" purely in UI: under review + specialist assigned
    if (
      hasSpecialist &&
      (normalized === "UNDER REVIEW" || normalized === "UNDER_REVIEW")
    ) {
      return "bg-blue-500/20 text-blue-400";
    }

    switch (normalized) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      case "UNDER REVIEW":
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
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

  if (loading) {
    return (
      <DashboardLayout title="Dispute Details">
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading dispute details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dispute) {
    return (
      <DashboardLayout title="Dispute Details">
        <div className="min-h-screen bg-[#1a1a1a] p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-500/10 rounded-lg p-6">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-red-300">{error || "Dispute not found"}</p>
              <Link
                href="/payroll/tracking/disputes"
                className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Back to Disputes
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dispute Details">
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dispute Details
              </h1>
            </div>
            <Link
              href="/payroll/tracking/disputes"
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Disputes
            </Link>
          </div>

          {/* Status Card */}
          <div
            className={`rounded-lg shadow p-6 mb-6 ${getStatusColor(
              dispute.status,
              !!dispute.payrollSpecialistId
            )}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1 opacity-80">
                  Current Status
                </p>
                <p className="text-2xl font-bold">
                  {dispute.status.toLowerCase() === "under review" &&
                  dispute.payrollSpecialistId
                    ? "Pending Payroll Manager Approval"
                    : dispute.status.replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm mb-1 opacity-80">Last Updated</p>
                <p className="text-sm font-medium">
                  {formatDate(dispute.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Information */}
          <div className="bg-[#2a2a2a] rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Dispute Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Related Payslip</p>
                <Link
                  href={`/payroll/tracking/payslips/${dispute.payslipId}`}
                  className="text-lg font-semibold text-blue-400 hover:text-blue-300"
                >
                  View Payslip →
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Submitted Date</p>
                <p className="text-lg font-semibold text-white">
                  {formatDate(dispute.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#2a2a2a] rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Dispute Reason
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-wrap">
                {dispute.description}
              </p>
            </div>
          </div>

          {/* Resolution Details */}
          {dispute.status === "APPROVED" && dispute.resolutionComment && (
            <div className="bg-green-500/10 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">
                Resolution Details
              </h2>
              <p className="text-green-300 whitespace-pre-wrap">
                {dispute.resolutionComment}
              </p>
            </div>
          )}

          {dispute.status === "REJECTED" && dispute.rejectionReason && (
            <div className="bg-red-500/10 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-red-400 mb-4">
                Rejection Details
              </h2>
              <p className="text-red-300 whitespace-pre-wrap">
                {dispute.rejectionReason}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[#2a2a2a] rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-white">Dispute Submitted</p>
                  <p className="text-sm text-gray-400">
                    {formatDate(dispute.createdAt)}
                  </p>
                </div>
              </div>

              {dispute.payrollSpecialistId && (
                <div className="flex items-start">
                  <div className="shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-white">
                      Specialist Reviewed
                    </p>
                    <p className="text-sm text-gray-400">
                      Payroll specialist completed review
                    </p>
                  </div>
                </div>
              )}

              {dispute.payrollManagerId && (
                <div className="flex items-start">
                  <div className="shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-white">Manager Decision</p>
                    <p className="text-sm text-gray-400">
                      Payroll manager completed review
                    </p>
                  </div>
                </div>
              )}

              {["APPROVED", "REJECTED"].includes(dispute.status) && (
                <div className="flex items-start">
                  <div
                    className={`shrink-0 w-10 h-10 ${
                      dispute.status === "APPROVED"
                        ? "bg-green-500"
                        : "bg-red-500"
                    } rounded-full flex items-center justify-center text-white font-bold`}
                  >
                    ✓
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-white">
                      {dispute.status === "APPROVED"
                        ? "Dispute Resolved"
                        : "Dispute Rejected"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(dispute.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && dispute.status.toLowerCase() === "under review" && (
            <div className="bg-[#2a2a2a] rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Admin Actions
              </h2>
              <div className="flex gap-3">
                <Link
                  href={`/payroll/tracking/disputes/${dispute._id}/review`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review & Make Decision
                </Link>
              </div>
            </div>
          )}

          {/* Finance Staff Actions - Generate Refund for Approved Disputes */}
          {isFinanceStaff && dispute.status === "APPROVED" && (
            <div className="bg-[#2a2a2a] rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Finance Actions
              </h2>
              <p className="text-gray-400 mb-4">
                This dispute has been approved. Generate a refund to include it
                in the next payroll cycle.
              </p>
              <Link
                href={`/payroll/tracking/refunds?disputeId=${dispute.disputeId}`}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
              >
                Generate Refund
              </Link>
            </div>
          )}

          {/* Under Review Message */}
          {!isAdmin && dispute.status.toLowerCase() === "under review" && (
            <div className="bg-blue-500/10 rounded-lg p-6">
              <h3 className="font-semibold text-blue-400 mb-2">
                Dispute Under Review
              </h3>
              <p className="text-sm text-blue-300">
                Your dispute is currently being reviewed by the payroll team.
                You will be notified once a decision has been made. Expected
                processing time: 3-5 business days.
              </p>
            </div>
          )}

          {/* Approved Next Steps */}
          {dispute.status === "APPROVED" && (
            <div className="bg-green-500/10 rounded-lg p-6">
              <h3 className="font-semibold text-green-400 mb-2">Next Steps</h3>
              <p className="text-sm text-green-300">
                Your dispute has been approved. Any adjustments will be
                processed in the next payroll cycle. Check your next payslip for
                the correction.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
