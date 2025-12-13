"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiSend, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";

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

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PENDING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error || "Claim not found"}</p>
            <Link
              href="/payroll/tracking/claims"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Claims
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Claim Details
            </h1>
            <p className="text-lg text-gray-600">Claim ID: {claim.claimId}</p>
          </div>
          <Link
            href="/payroll/tracking/claims"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Claims
          </Link>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-lg shadow p-6 mb-6 border-2 ${getStatusColor(
            claim.status
          )}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Current Status</p>
              <p className="text-2xl font-bold">
                {claim.status.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm mb-1">Last Updated</p>
              <p className="text-sm font-medium">
                {formatDate(claim.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Claim Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Claim Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Claim Type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {claim.claimType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Submitted Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(claim.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Claimed Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(claim.amount)}
              </p>
            </div>
            {claim.approvedAmount !== null && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved Amount</p>
                <p className="text-2xl font-bold text-green-600">
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <div className="bg-gray-50 rounded p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {claim.description}
            </p>
          </div>
        </div>

        {/* Resolution Details */}
        {claim.status === "APPROVED" && claim.resolutionComment && (
          <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-green-900 mb-4">
              Approval Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Resolution Comment
                </p>
                <p className="text-green-800 whitespace-pre-wrap">
                  {claim.resolutionComment}
                </p>
              </div>
              {claim.approvedAmount !== null && (
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Approved Amount
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(claim.approvedAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {claim.status === "REJECTED" && claim.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-red-900 mb-4">
              Rejection Details
            </h2>
            <div>
              <p className="text-sm font-medium text-red-900 mb-2">
                Reason for Rejection
              </p>
              <p className="text-red-800 whitespace-pre-wrap">
                {claim.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <FiSend className="text-lg" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-gray-900">Claim Submitted</p>
                <p className="text-sm text-gray-600">
                  {formatDate(claim.createdAt)}
                </p>
              </div>
            </div>

            {claim.status !== "PENDING" && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                  <FiEye className="text-lg" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Under Review</p>
                  <p className="text-sm text-gray-600">Being processed</p>
                </div>
              </div>
            )}

            {["APPROVED", "REJECTED"].includes(claim.status) && (
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-10 h-10 ${
                    claim.status === "APPROVED" ? "bg-green-500" : "bg-red-500"
                  } rounded-full flex items-center justify-center text-white`}
                >
                  {claim.status === "APPROVED" ? (
                    <FiCheckCircle className="text-lg" />
                  ) : (
                    <FiXCircle className="text-lg" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">
                    {claim.status === "APPROVED"
                      ? "Claim Approved"
                      : "Claim Rejected"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(claim.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {claim.status === "UNDER_REVIEW" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Claim Under Review
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Your claim is currently being reviewed by the payroll team. You
              will be notified once a decision has been made.
            </p>
            <p className="text-sm text-blue-700">
              Expected processing time: 3-5 business days
            </p>
          </div>
        )}

        {claim.status === "APPROVED" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Next Steps</h3>
            <p className="text-sm text-green-800">
              Your approved claim will be processed in the next payroll cycle.
              The refund will appear in your upcoming payslip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
