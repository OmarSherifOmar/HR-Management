"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  unpaidLeaveDays: number;
  dailyRate: number;
  totalDeduction: number;
  note: string;
}

export default function CalculationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    fetchAllData();
  }, []);

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseSalary = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/base-salary",
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
      const days = parseInt(remainingDays) || 0;
      const response = await fetch(
        `http://localhost:3000/payroll-tracking/me/leave-compensation?remainingDays=${days}`,
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
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/commute-compensation",
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
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/tax-deductions",
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
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/insurance-deductions",
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
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/misconduct-deductions",
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
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/me/unpaid-leave-deductions",
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
    { id: "salary", label: "Base Salary", icon: "💰" },
    { id: "leave", label: "Leave Compensation", icon: "🏖️" },
    { id: "commute", label: "Transport Allowance", icon: "🚗" },
    { id: "taxes", label: "Tax Deductions", icon: "📋" },
    { id: "insurance", label: "Insurance", icon: "🏥" },
    { id: "misconduct", label: "Misconduct Deductions", icon: "⚠️" },
    { id: "unpaid", label: "Unpaid Leave", icon: "📅" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calculations...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Salary Calculations
            </h1>
            <p className="text-lg text-gray-600">
              View detailed breakdowns of your salary and deductions
            </p>
          </div>
          <Link
            href="/payroll/tracking"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Tracking
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Base Salary Tab */}
          {activeTab === "salary" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Base Salary Information
              </h2>
              {baseSalary ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-indigo-50 rounded-lg p-6">
                    <p className="text-sm text-indigo-600 mb-2">
                      Your Base Salary
                    </p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {formatCurrency(baseSalary.baseSalary)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Full-Time Base</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {baseSalary.fullTimeBase
                        ? formatCurrency(baseSalary.fullTimeBase)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Work Fraction</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(baseSalary.fraction * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Leave Compensation Calculator
              </h2>
              <div className="mb-6 flex items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remaining Leave Days
                  </label>
                  <input
                    type="number"
                    value={remainingDays}
                    onChange={(e) => setRemainingDays(e.target.value)}
                    min="0"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={fetchLeaveCompensation}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Calculate
                </button>
              </div>
              {leaveCompensation && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <p className="text-sm text-green-600 mb-2">
                      Estimated Compensation
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatCurrency(leaveCompensation.compensation)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Daily Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(leaveCompensation.dailyRate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">
                      Working Days/Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {leaveCompensation.workingDaysPerMonth}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Base Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Transport Allowance
              </h2>
              {commuteCompensation ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <p className="text-sm text-blue-600 mb-2">
                        Monthly Allowance
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatCurrency(
                          commuteCompensation.monthlyTransportAllowance
                        )}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <p className="text-sm text-blue-600 mb-2">
                        Annual Allowance
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatCurrency(
                          commuteCompensation.annualTransportAllowance
                        )}
                      </p>
                    </div>
                  </div>
                  {commuteCompensation.breakdown.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {commuteCompensation.breakdown.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
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
                <p className="text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tax Deductions
              </h2>
              {taxBreakdown ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-red-50 rounded-lg p-6">
                      <p className="text-sm text-red-600 mb-2">Total Tax</p>
                      <p className="text-3xl font-bold text-red-900">
                        {formatCurrency(taxBreakdown.totalTax)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600 mb-2">
                        Taxable Income
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {taxBreakdown.taxableIncome
                          ? formatCurrency(taxBreakdown.taxableIncome)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {taxBreakdown.taxes.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tax Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Rule/Reference
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {taxBreakdown.taxes.map((tax, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {tax.name}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-red-600">
                                {formatCurrency(tax.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {tax.rate ? `${tax.rate}%` : "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
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
                <p className="text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Insurance Contributions
              </h2>
              {insuranceBreakdown ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-teal-50 rounded-lg p-6">
                      <p className="text-sm text-teal-600 mb-2">
                        Your Contributions
                      </p>
                      <p className="text-3xl font-bold text-teal-900">
                        {formatCurrency(
                          insuranceBreakdown.totalEmployeeContributions
                        )}
                      </p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-6">
                      <p className="text-sm text-teal-600 mb-2">
                        Employer Contributions
                      </p>
                      <p className="text-3xl font-bold text-teal-900">
                        {formatCurrency(
                          insuranceBreakdown.totalEmployerContributions
                        )}
                      </p>
                    </div>
                  </div>
                  {insuranceBreakdown.insurances.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Insurance Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Employee Share
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Employer Share
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {insuranceBreakdown.insurances.map((ins, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {ins.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatCurrency(ins.employeeShare)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatCurrency(ins.employerShare)}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
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
                <p className="text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Misconduct Deductions
              </h2>
              {misconductDeductions ? (
                <>
                  <div className="bg-orange-50 rounded-lg p-6 mb-6">
                    <p className="text-sm text-orange-600 mb-2">
                      Total Deductions
                    </p>
                    <p className="text-3xl font-bold text-orange-900">
                      {formatCurrency(misconductDeductions.total)}
                    </p>
                  </div>
                  {misconductDeductions.items.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {misconductDeductions.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-orange-600">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {item.reason || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No misconduct deductions found.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Unpaid Leave Deductions
              </h2>
              {unpaidLeaveDeductions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-lg p-6">
                    <p className="text-sm text-purple-600 mb-2">
                      Total Deduction
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {formatCurrency(unpaidLeaveDeductions.totalDeduction)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">
                      Unpaid Leave Days
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {unpaidLeaveDeductions.unpaidLeaveDays}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Daily Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(unpaidLeaveDeductions.dailyRate)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
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
      </div>
    </div>
  );
}
