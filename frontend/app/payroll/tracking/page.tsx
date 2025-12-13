"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TrackingPage() {
  const router = useRouter();

  const trackingFeatures = [
    {
      title: "Payslips",
      description: "View and download your payslips",
      href: "/payroll/tracking/payslips",
      icon: "📄",
      color: "bg-blue-500",
    },
    {
      title: "Claims",
      description: "Submit and track reimbursement claims",
      href: "/payroll/tracking/claims",
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Disputes",
      description: "Raise disputes about payroll discrepancies",
      href: "/payroll/tracking/disputes",
      icon: "⚖️",
      color: "bg-yellow-500",
    },
    {
      title: "Refunds",
      description: "Track refund processing status",
      href: "/payroll/tracking/refunds",
      icon: "💸",
      color: "bg-purple-500",
    },
    {
      title: "Calculations",
      description: "View detailed salary and deduction breakdowns",
      href: "/payroll/tracking/calculations",
      icon: "🧮",
      color: "bg-indigo-500",
    },
    {
      title: "Tax Documents",
      description: "Access tax withholding documents",
      href: "/payroll/tracking/tax-documents",
      icon: "📑",
      color: "bg-red-500",
    },
    {
      title: "Reports",
      description: "Generate and view payroll reports",
      href: "/payroll/tracking/reports",
      icon: "📊",
      color: "bg-teal-500",
    },
    {
      title: "Transparency",
      description: "View transparency and summary metrics",
      href: "/payroll/tracking/transparency",
      icon: "🔍",
      color: "bg-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payroll Tracking
          </h1>
          <p className="text-lg text-gray-600">
            Manage your payroll, claims, disputes, and financial transparency
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trackingFeatures.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group block"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`${feature.color} text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl`}
                  >
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-gray-600 mt-2">Total Payslips</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">3</p>
              <p className="text-gray-600 mt-2">Active Claims</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">1</p>
              <p className="text-gray-600 mt-2">Pending Disputes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">2</p>
              <p className="text-gray-600 mt-2">Processed Refunds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
