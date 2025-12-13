"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiFileText,
  FiTrendingUp,
  FiHome,
  FiGrid,
  FiDollarSign,
  FiAlertTriangle,
  FiCreditCard,
  FiFile,
  FiPieChart,
  FiSearch,
} from "react-icons/fi";

interface Stats {
  totalPayslips: number;
  activeClaims: number;
  pendingDisputes: number;
  processedRefunds: number;
}

export default function TrackingPage() {
  const [stats, setStats] = useState<Stats>({
    totalPayslips: 0,
    activeClaims: 0,
    pendingDisputes: 0,
    processedRefunds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const payslipsRes = await fetch(
        "http://localhost:3000/payroll-tracking/me/payslips",
        { credentials: "include" }
      );
      const payslips = payslipsRes.ok ? await payslipsRes.json() : [];

      const claimsRes = await fetch(
        "http://localhost:3000/payroll-tracking/claims/mine",
        { credentials: "include" }
      );
      const claims = claimsRes.ok ? await claimsRes.json() : [];
      const activeClaims = claims.filter(
        (c: { status: string }) =>
          c.status !== "APPROVED" && c.status !== "REJECTED"
      );

      const disputesRes = await fetch(
        "http://localhost:3000/payroll-tracking/disputes/mine",
        { credentials: "include" }
      );
      const disputes = disputesRes.ok ? await disputesRes.json() : [];
      const pendingDisputes = disputes.filter(
        (d: { status: string }) =>
          d.status !== "APPROVED" && d.status !== "REJECTED"
      );

      setStats({
        totalPayslips: payslips.length,
        activeClaims: activeClaims.length,
        pendingDisputes: pendingDisputes.length,
        processedRefunds: 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackingFeatures = [
    {
      title: "Payslips",
      description: "View and download your monthly payslips",
      href: "/payroll/tracking/payslips",
      icon: FiFileText,
    },
    {
      title: "Salary History",
      description: "View your complete salary history over time",
      href: "/payroll/tracking/salary-history",
      icon: FiTrendingUp,
    },
    {
      title: "Employer Contributions",
      description: "View benefits paid by your employer",
      href: "/payroll/tracking/employer-contributions",
      icon: FiHome,
    },
    {
      title: "Calculations",
      description: "View salary breakdowns and deductions",
      href: "/payroll/tracking/calculations",
      icon: FiGrid,
    },
    {
      title: "Claims",
      description: "Submit and track expense reimbursements",
      href: "/payroll/tracking/claims",
      icon: FiDollarSign,
    },
    {
      title: "Disputes",
      description: "Raise and track payroll disputes",
      href: "/payroll/tracking/disputes",
      icon: FiAlertTriangle,
    },
    {
      title: "Refunds",
      description: "Track refund processing status",
      href: "/payroll/tracking/refunds",
      icon: FiCreditCard,
    },
    {
      title: "Tax Documents",
      description: "Access and download tax documents",
      href: "/payroll/tracking/tax-documents",
      icon: FiFile,
    },
    {
      title: "Reports",
      description: "Generate and view payroll reports",
      href: "/payroll/tracking/reports",
      icon: FiPieChart,
    },
    {
      title: "Transparency",
      description: "View summary metrics and insights",
      href: "/payroll/tracking/transparency",
      icon: FiSearch,
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Payroll Tracking
          </h1>
          <p className="text-gray-400">
            Manage your payroll, claims, disputes, and financial documents
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Payslips</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {stats.totalPayslips}
                  </p>
                )}
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3">
                <FiFileText className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Claims</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {stats.activeClaims}
                  </p>
                )}
              </div>
              <div className="bg-green-500/20 rounded-lg p-3">
                <FiDollarSign className="text-green-400 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Disputes</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {stats.pendingDisputes}
                  </p>
                )}
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3">
                <FiAlertTriangle className="text-yellow-400 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-[#232340] rounded-xl p-5 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Refunds</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">
                    {stats.processedRefunds}
                  </p>
                )}
              </div>
              <div className="bg-purple-500/20 rounded-lg p-3">
                <FiCreditCard className="text-purple-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {trackingFeatures.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group block"
              >
                <div className="bg-[#232340] rounded-xl p-4 h-full border border-gray-700/50 hover:border-gray-600 hover:bg-[#2a2a4a] transition-all duration-200">
                  <div className="bg-gray-700/50 rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                    <feature.icon className="text-gray-300 group-hover:text-blue-400 text-lg" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-xs line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="bg-[#232340] rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Create New</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/payroll/tracking/claims/create"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiDollarSign className="text-lg" />
              New Claim
            </Link>
            <Link
              href="/payroll/tracking/disputes/create"
              className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiAlertTriangle className="text-lg" />
              New Dispute
            </Link>
            <Link
              href="/payroll/tracking/payslips"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiFileText className="text-lg" />
              View Payslips
            </Link>
            <Link
              href="/payroll/tracking/calculations"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiGrid className="text-lg" />
              View Calculations
            </Link>
            <Link
              href="/payroll/tracking/tax-documents"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiFile className="text-lg" />
              Tax Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
