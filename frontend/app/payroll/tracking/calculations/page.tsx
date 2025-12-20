"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  DollarSign,
  Palmtree,
  Car,
  FileText,
  Shield,
  AlertTriangle,
  CalendarX,
  ArrowLeft,
} from "lucide-react";

interface BaseSalaryData {
  baseSalary: number;
  fullTimeBase: number | null;
  fraction: number;
  note?: string;
}

interface LeaveCompensation {
  remainingDays: number;
  encash: boolean;
  baseSalary: number;
  workingDaysPerMonth: number;
  dailyRate: number;
  compensation: number;
  note: string;
}

interface CommuteCompensation {
  monthlyTransportAllowance: number;
  annualTransportAllowance: number;
  breakdown: Array<{ name: string; amount: number; source: string }>;
  note: string;
}

interface TaxBreakdown {
  payslipId?: string;
  month?: string;
  taxableIncome: number | null;
  taxes: Array<{
    name: string;
    amount: number;
    base: number | null;
    rate: number | null;
    rule: string | null;
    source: string;
  }>;
  totalTax: number;
  note: string;
}

interface InsuranceBreakdown {
  payslipId?: string;
  month?: string;
  insurances: Array<{
    name: string;
    employeeShare: number;
    employerShare: number;
    total: number;
    base: number | null;
    rate: number | null;
    rule: string | null;
    source: string;
  }>;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  note: string;
}

interface MisconductDeductions {
  items: Array<{
    name: string;
    amount: number;
    reason?: string | null;
    rule?: string | null;
    source: string;
  }>;
  total: number;
  note: string;
}

interface UnpaidLeaveDeductions {
  payslipId?: string | null;
  month?: string | null;
  unpaidDays: number;
  baseSalary?: number;
  workingDaysPerMonth?: number;
  dailyRate: number;
  deduction: number;
  note: string;
}

export default function CalculationsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("salary");

  // Data states
  const [baseSalary, setBaseSalary] = useState<BaseSalaryData | null>(null);
  const [leaveCompensation, setLeaveCompensation] =
    useState<LeaveCompensation | null>(null);
  const [commuteCompensation, setCommuteCompensation] =
    useState<CommuteCompensation | null>(null);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null);
  const [insuranceBreakdown, setInsuranceBreakdown] =
    useState<InsuranceBreakdown | null>(null);
  const [misconductDeductions, setMisconductDeductions] =
    useState<MisconductDeductions | null>(null);
  const [unpaidLeaveDeductions, setUnpaidLeaveDeductions] =
    useState<UnpaidLeaveDeductions | null>(null);

  // Leave calculation inputs
  const [remainingDays, setRemainingDays] = useState<string>("5");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBaseSalary(),
          fetchCommuteCompensation(),
          fetchTaxBreakdown(),
          fetchInsuranceBreakdown(),
          fetchMisconductDeductions(),
          fetchUnpaidLeaveDeductions(),
        ]);
      } catch (err) {
        console.error("Failed to fetch calculations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchBaseSalary = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/base-salary`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setBaseSalary(data);
      }
    } catch (err) {
      console.error("Error fetching base salary:", err);
    }
  };

  const fetchLeaveCompensation = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const days = parseInt(remainingDays) || 0;
      const response = await fetch(
        `${URL}/payroll-tracking/me/leave-compensation?remainingDays=${days}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaveCompensation(data);
      }
    } catch (err) {
      console.error("Error fetching leave compensation:", err);
    }
  };

  const fetchCommuteCompensation = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/commute-compensation`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setCommuteCompensation(data);
      }
    } catch (err) {
      console.error("Error fetching commute compensation:", err);
    }
  };

  const fetchTaxBreakdown = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/tax-deductions`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setTaxBreakdown(data);
      }
    } catch (err) {
      console.error("Error fetching tax breakdown:", err);
    }
  };

  const fetchInsuranceBreakdown = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/insurance-deductions`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setInsuranceBreakdown(data);
      }
    } catch (err) {
      console.error("Error fetching insurance breakdown:", err);
    }
  };

  const fetchMisconductDeductions = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/misconduct-deductions`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setMisconductDeductions(data);
      }
    } catch (err) {
      console.error("Error fetching misconduct deductions:", err);
    }
  };

  const fetchUnpaidLeaveDeductions = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${URL}/payroll-tracking/me/unpaid-leave-deductions`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setUnpaidLeaveDeductions(data);
      }
    } catch (err) {
      console.error("Error fetching unpaid leave deductions:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const tabs = [
    { id: "salary", label: "Base Salary", icon: <DollarSign size={18} /> },
    { id: "leave", label: "Leave Compensation", icon: <Palmtree size={18} /> },
    { id: "commute", label: "Transport Allowance", icon: <Car size={18} /> },
    { id: "taxes", label: "Tax Deductions", icon: <FileText size={18} /> },
    { id: "insurance", label: "Insurance", icon: <Shield size={18} /> },
    {
      id: "misconduct",
      label: "Misconduct Deductions",
      icon: <AlertTriangle size={18} />,
    },
    { id: "unpaid", label: "Unpaid Leave", icon: <CalendarX size={18} /> },
  ];

  if (loading) {
    return (
      <DashboardLayout
        title="Salary Calculations"
        description="View detailed breakdowns of your salary and deductions"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading calculations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Salary Calculations"
      description="View detailed breakdowns of your salary and deductions"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/payroll/tracking"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333333] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Tracking
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-[#2a2a2a] rounded-lg mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-5 py-3.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-[#333333] hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#2a2a2a] rounded-lg p-6">
        {/* Base Salary Tab */}
        {activeTab === "salary" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Base Salary Information
            </h2>
            {baseSalary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-600/20 rounded-lg p-5">
                  <p className="text-sm text-blue-400 mb-1">Your Base Salary</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(baseSalary.baseSalary)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">Full-Time Base</p>
                  <p className="text-2xl font-bold text-white">
                    {baseSalary.fullTimeBase
                      ? formatCurrency(baseSalary.fullTimeBase)
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">Work Fraction</p>
                  <p className="text-2xl font-bold text-white">
                    {(baseSalary.fraction * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">
                Base salary information not available.
              </p>
            )}
            {baseSalary?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {baseSalary.note}
              </p>
            )}
          </div>
        )}

        {/* Leave Compensation Tab */}
        {activeTab === "leave" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Leave Compensation Calculator
            </h2>
            <div className="mb-6 flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Remaining Leave Days
                </label>
                <input
                  type="number"
                  value={remainingDays}
                  onChange={(e) => setRemainingDays(e.target.value)}
                  min="0"
                  className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchLeaveCompensation}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Calculate
              </button>
            </div>
            {leaveCompensation && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-600/20 rounded-lg p-5">
                  <p className="text-sm text-green-400 mb-1">
                    Estimated Compensation
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(leaveCompensation.compensation)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">Daily Rate</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(leaveCompensation.dailyRate)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">
                    Working Days/Month
                  </p>
                  <p className="text-xl font-bold text-white">
                    {leaveCompensation.workingDaysPerMonth}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">Base Salary</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(leaveCompensation.baseSalary)}
                  </p>
                </div>
              </div>
            )}
            {leaveCompensation?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {leaveCompensation.note}
              </p>
            )}
          </div>
        )}

        {/* Transport Allowance Tab */}
        {activeTab === "commute" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Transport Allowance
            </h2>
            {commuteCompensation ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-600/20 rounded-lg p-5">
                    <p className="text-sm text-blue-400 mb-1">
                      Monthly Allowance
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        commuteCompensation.monthlyTransportAllowance
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-600/20 rounded-lg p-5">
                    <p className="text-sm text-blue-400 mb-1">
                      Annual Allowance
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        commuteCompensation.annualTransportAllowance
                      )}
                    </p>
                  </div>
                </div>
                {commuteCompensation.breakdown.length > 0 && (
                  <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead className="bg-[#1a1a1a]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {commuteCompensation.breakdown.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#333333] transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-white">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {item.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">
                Transport allowance information not available.
              </p>
            )}
            {commuteCompensation?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {commuteCompensation.note}
              </p>
            )}
          </div>
        )}

        {/* Tax Deductions Tab */}
        {activeTab === "taxes" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Tax Deductions
            </h2>
            {taxBreakdown ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-600/20 rounded-lg p-5">
                    <p className="text-sm text-red-400 mb-1">Total Tax</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(taxBreakdown.totalTax)}
                    </p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-5">
                    <p className="text-sm text-gray-400 mb-1">Taxable Income</p>
                    <p className="text-2xl font-bold text-white">
                      {taxBreakdown.taxableIncome
                        ? formatCurrency(taxBreakdown.taxableIncome)
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {taxBreakdown.taxes.length > 0 && (
                  <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead className="bg-[#1a1a1a]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Tax Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Rate
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Rule/Reference
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {taxBreakdown.taxes.map((tax, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#333333] transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-white">
                              {tax.name}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-red-400">
                              {formatCurrency(tax.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {tax.rate ? `${tax.rate}%` : "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                              {tax.rule || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">
                Tax breakdown information not available.
              </p>
            )}
            {taxBreakdown?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {taxBreakdown.note}
              </p>
            )}
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === "insurance" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Insurance Contributions
            </h2>
            {insuranceBreakdown ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-teal-600/20 rounded-lg p-5">
                    <p className="text-sm text-teal-400 mb-1">
                      Your Contributions
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        insuranceBreakdown.totalEmployeeContributions
                      )}
                    </p>
                  </div>
                  <div className="bg-teal-600/20 rounded-lg p-5">
                    <p className="text-sm text-teal-400 mb-1">
                      Employer Contributions
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        insuranceBreakdown.totalEmployerContributions
                      )}
                    </p>
                  </div>
                </div>
                {insuranceBreakdown.insurances.length > 0 && (
                  <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead className="bg-[#1a1a1a]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Insurance Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Employee Share
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Employer Share
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {insuranceBreakdown.insurances.map((ins, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#333333] transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-white">
                              {ins.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {formatCurrency(ins.employeeShare)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {formatCurrency(ins.employerShare)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-white">
                              {formatCurrency(ins.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">
                Insurance breakdown information not available.
              </p>
            )}
            {insuranceBreakdown?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {insuranceBreakdown.note}
              </p>
            )}
          </div>
        )}

        {/* Misconduct Deductions Tab */}
        {activeTab === "misconduct" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Misconduct Deductions
            </h2>
            {misconductDeductions ? (
              <>
                <div className="bg-orange-600/20 rounded-lg p-5 mb-6">
                  <p className="text-sm text-orange-400 mb-1">
                    Total Deductions
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(misconductDeductions.total)}
                  </p>
                </div>
                {misconductDeductions.items.length > 0 ? (
                  <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead className="bg-[#1a1a1a]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {misconductDeductions.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#333333] transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-white">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-orange-400">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {item.reason || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">
                    No misconduct deductions found.
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-400">
                Misconduct deductions information not available.
              </p>
            )}
            {misconductDeductions?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {misconductDeductions.note}
              </p>
            )}
          </div>
        )}

        {/* Unpaid Leave Tab */}
        {activeTab === "unpaid" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Unpaid Leave Deductions
            </h2>
            {unpaidLeaveDeductions ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-600/20 rounded-lg p-5">
                  <p className="text-sm text-purple-400 mb-1">
                    Total Deduction
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(unpaidLeaveDeductions.deduction)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">
                    Unpaid Leave Days
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {unpaidLeaveDeductions.unpaidDays}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-5">
                  <p className="text-sm text-gray-400 mb-1">Daily Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(unpaidLeaveDeductions.dailyRate)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">
                Unpaid leave deductions information not available.
              </p>
            )}
            {unpaidLeaveDeductions?.note && (
              <p className="mt-4 text-sm text-gray-500 italic">
                {unpaidLeaveDeductions.note}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
