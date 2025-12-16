"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, FileText, Shield, ChevronRight, Settings, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

export default function TimeManagementPoliciesPage() {
  const [activeTab, setActiveTab] = useState("overtime");

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    withCredentials: true,
  });

  type Punch = { type: "IN" | "OUT"; time: string };

  interface OvertimeRecord {
    employeeId: string;
    date: string;
    overtimeMinutes?: number;
    shortMinutes?: number;
  }
  interface OvertimeConfig {
    id?: string;
    weekendMultiplier: number;
    holidayMultiplier: number;
    requiresPreApproval: boolean;
    maxOvertimeHours: number;
  }
  interface LatenessRule {
    id: string;
    thresholdMinutes: number;
    gracePeriodMinutes: number;
    penalty: string;
    deductionAmount?: number;
  }
  interface RepeatedRecord {
    employeeId: string;
    employeeName?: string;
    count: number;
    flagged?: boolean;
  }
  interface CorrectionRequest {
    id: string;
    date: string;
    status: string;
    reason?: string;
    punches?: Punch[];
    submittedAt?: string;
  }
  interface ExceptionRecord {
    id: string;
    employeeId: string;
    type: string;
    status: string;
    reason?: string;
    createdAt: string;
    deadline?: string;
  }
  interface PermissionRequest {
    id: string;
    employeeId: string;
    type: string;
    duration?: string;
    status: string;
    reason?: string;
    date: string;
  }
  interface PermissionRule {
    id?: string;
    maxDurationHours: number;
    requiresApproval: boolean;
    affectsPayroll: boolean;
  }

  const [overtimeStartDate, setOvertimeStartDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [overtimeEndDate, setOvertimeEndDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [overtimeLoading, setOvertimeLoading] = useState(false);
  const [overtimeError, setOvertimeError] = useState<string | null>(null);

  const [latenessRules, setLatenessRules] = useState<LatenessRule[]>([]);
  const [latenessLoading, setLatenessLoading] = useState(true);
  const [latenessError, setLatenessError] = useState<string | null>(null);
  const [latenessEmployeeId, setLatenessEmployeeId] = useState<string>("");
  const [latenessDate, setLatenessDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [latenessMinutes, setLatenessMinutes] = useState<number | null>(null);
  const [latenessLoadingSingle, setLatenessLoadingSingle] = useState(false);
  const [latenessErrorSingle, setLatenessErrorSingle] = useState<string | null>(
    null
  );

  const [repeatedRecords, setRepeatedRecords] = useState<RepeatedRecord[]>([]);
  const [repeatedLoading, setRepeatedLoading] = useState(true);
  const [repeatedError, setRepeatedError] = useState<string | null>(null);
  const [repeatedDays, setRepeatedDays] = useState<number>(7);
  const [repeatedEmployeeId, setRepeatedEmployeeId] = useState<string>("");

  const [correctionRequests, setCorrectionRequests] = useState<
    CorrectionRequest[]
  >([]);
  const [correctionLoading, setCorrectionLoading] = useState(true);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [correctionDate, setCorrectionDate] = useState<string>("");
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [correctionPunches, setCorrectionPunches] = useState<
    { type: "IN" | "OUT"; time: string }[]
  >([]);

  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);
  const [exceptionsError, setExceptionsError] = useState<string | null>(null);

  const [permissionRequests, setPermissionRequests] = useState<
    PermissionRequest[]
  >([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // ─── Overtime Configuration State ───
  const [overtimeConfig, setOvertimeConfig] = useState<OvertimeConfig>({
    weekendMultiplier: 1.5,
    holidayMultiplier: 2.0,
    requiresPreApproval: true,
    maxOvertimeHours: 4,
  });
  const [overtimeConfigLoading, setOvertimeConfigLoading] = useState(false);
  const [overtimeConfigError, setOvertimeConfigError] = useState<string | null>(null);

  // ─── Permission Rules State ───
  const [permissionRules, setPermissionRules] = useState<PermissionRule>({
    maxDurationHours: 4,
    requiresApproval: true,
    affectsPayroll: true,
  });
  const [permissionRulesLoading, setPermissionRulesLoading] = useState(false);
  const [permissionRulesError, setPermissionRulesError] = useState<string | null>(null);

  // ─── Correction Punch Input State ───
  const [newPunchType, setNewPunchType] = useState<"IN" | "OUT">("IN");
  const [newPunchTime, setNewPunchTime] = useState<string>("");

  const fetchOvertime = async () => {
    setOvertimeLoading(true);
    setOvertimeError(null);
    try {
      const res = await api.get<OvertimeRecord[]>(
        `/attendance/overtime-report?start=${overtimeStartDate}&end=${overtimeEndDate}`
      );
      setOvertimeRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setOvertimeError(message || "Error fetching overtime report");
      setOvertimeRecords([]);
    } finally {
      setOvertimeLoading(false);
    }
  };

  const fetchLatenessRules = async () => {
    setLatenessLoading(true);
    setLatenessError(null);

    try {
      const res = await api.get<LatenessRule[]>("/attendance/lateness-rules");
      if (Array.isArray(res.data)) {
        setLatenessRules(res.data);
      } else {
        setLatenessRules([]);
        setLatenessError("No rules returned from server");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLatenessError(message || "Failed to fetch lateness rules");
      setLatenessRules([]);
    } finally {
      setLatenessLoading(false);
    }
  };

  const fetchLatenessByDate = async () => {
    if (!latenessEmployeeId) {
      setLatenessErrorSingle("Please provide Employee ID");
      setLatenessMinutes(null);
      return;
    }

    setLatenessLoadingSingle(true);
    setLatenessErrorSingle(null);

    try {
      const res = await api.get<{ minutesLate: number }>(
        `/attendance/${latenessEmployeeId}/lateness?date=${latenessDate}`
      );
      setLatenessMinutes(res.data.minutesLate ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLatenessErrorSingle(message || "Failed to fetch lateness");
      setLatenessMinutes(null);
    } finally {
      setLatenessLoadingSingle(false);
    }
  };

  const fetchRepeatedLateness = async () => {
    setRepeatedLoading(true);
    setRepeatedError(null);
    try {
      if (!repeatedEmployeeId) {
        setRepeatedError("Provide an Employee ID to fetch repeated lateness");
        setRepeatedRecords([]);
        return;
      }
      const res = await api.get<number>(
        `/attendance/${repeatedEmployeeId}/lateness?days=${repeatedDays}`
      );
      setRepeatedRecords([
        { employeeId: repeatedEmployeeId, employeeName: undefined, count: res.data },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setRepeatedError(message || "Failed to fetch repeated lateness data");
      setRepeatedRecords([]);
    } finally {
      setRepeatedLoading(false);
    }
  };

  const fetchCorrections = async () => {
    setCorrectionLoading(true);
    setCorrectionError(null);
    try {
      if (!employeeId) {
        setCorrectionRequests([]);
        setCorrectionError("Enter Employee ID to fetch your correction requests");
        return;
      }
      const res = await api.get<CorrectionRequest[]>(
        `/corrections/mine/${employeeId}`
      );
      setCorrectionRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCorrectionError(message || "Failed to fetch correction requests");
      setCorrectionRequests([]);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const fetchExceptions = async () => {
    setExceptionsLoading(true);
    setExceptionsError(null);
    try {
      const res = await api.get<ExceptionRecord[]>(
        "/attendance/exceptions?start=2025-01-01&end=2025-12-31"
      );
      setExceptions(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExceptionsError(message || "Failed to fetch exceptions");
      setExceptions([]);
    } finally {
      setExceptionsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get<ExceptionRecord[]>(
        `/attendance/exceptions?start=${today}&end=${today}`
      );
      const data = Array.isArray(res.data) ? res.data : [];
      const perms: PermissionRequest[] = data
        .filter(
          (ex) => ex.type === "EARLY_LEAVE" || ex.type === "OVERTIME_REQUEST"
        )
        .map((ex) => ({
          id: ex.id,
          employeeId: ex.employeeId,
          type: ex.type,
          duration: undefined,
          status: ex.status,
          reason: ex.reason,
          date: ex.createdAt.split("T")[0],
        }));
      setPermissionRequests(perms);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setPermissionsError(message || "Failed to fetch permissions");
      setPermissionRequests([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertime();
    fetchLatenessRules();
    fetchRepeatedLateness();
    fetchCorrections();
    fetchExceptions();
    fetchPermissions();
  }, [repeatedDays]);

  const handleCorrectionSubmit = async () => {
    if (!correctionDate || !correctionReason || correctionPunches.length === 0) {
      setCorrectionError("Please fill in all fields and add at least one punch time");
      return;
    }
    try {
      await api.post("/corrections/submit", {
        employeeId,
        date: correctionDate,
        punches: correctionPunches,
        reason: correctionReason,
      });
      fetchCorrections();
      setCorrectionReason("");
      setCorrectionPunches([]);
      setCorrectionDate("");
      setNewPunchTime("");
      setCorrectionError(null);
      alert("Correction request submitted successfully. It will be routed to your Line Manager for approval.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCorrectionError(message || "Failed to submit correction request");
    }
  };

  const handleApproveException = async (id: string) => {
    try {
      await api.post(`/corrections/${id}/approve`, { approvedBy: "HR123" });
      fetchExceptions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExceptionsError(message || "Approval failed");
    }
  };

  const handleRejectException = async (id: string) => {
    const reason = prompt("Enter rejection reason:") || "No reason provided";
    try {
      await api.post(`/corrections/${id}/reject`, {
        approvedBy: "HR123",
        reason,
      });
      fetchExceptions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExceptionsError(message || "Rejection failed");
    }
  };

  const handleEscalateExceptions = async () => {
    try {
      await api.post("/corrections/exceptions/escalate", {
        cutoffDate: new Date().toISOString(),
      });
      fetchExceptions();
      alert("Pending exceptions escalated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExceptionsError(message || "Escalation failed");
    }
  };

  // ─── Overtime Configuration Handlers ───
  const fetchOvertimeConfig = async () => {
    // backend endpoint not present — keep client defaults
    setOvertimeConfigLoading(false);
    setOvertimeConfigError("Using local default configuration (server API unavailable)");
  };

  const saveOvertimeConfig = async () => {
    // No backend persistence available for config in this setup.
    // Persisting locally only.
    setOvertimeConfigLoading(true);
    try {
      // simulate save
      setTimeout(() => {
        setOvertimeConfigLoading(false);
        alert("Overtime configuration updated locally");
      }, 200);
    } catch (err: unknown) {
      setOvertimeConfigLoading(false);
      setOvertimeConfigError("Failed to save configuration locally");
    }
  };

  // ─── Permission Rules Handlers ───
  const fetchPermissionRules = async () => {
    // backend endpoint not present — keep client defaults
    setPermissionRulesLoading(false);
    setPermissionRulesError("Using local default permission rules (server API unavailable)");
  };

  const savePermissionRules = async () => {
    // No backend persistence available for permission rules in this setup.
    setPermissionRulesLoading(true);
    try {
      setTimeout(() => {
        setPermissionRulesLoading(false);
        alert("Permission rules updated locally (no server persistence)");
      }, 200);
    } catch (err: unknown) {
      setPermissionRulesLoading(false);
      setPermissionRulesError("Failed to save permission rules locally");
    }
  };

  // ─── Correction Punch Handlers ───
  const addPunch = () => {
    if (!newPunchTime) {
      alert("Please enter a time for the punch");
      return;
    }
    const punch: { type: "IN" | "OUT"; time: string } = {
      type: newPunchType,
      time: newPunchTime,
    };
    setCorrectionPunches([...correctionPunches, punch]);
    setNewPunchTime("");
  };

  const removePunch = (index: number) => {
    setCorrectionPunches(correctionPunches.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: "overtime", label: "Overtime & Short Time", icon: Clock },
    { id: "lateness", label: "Lateness & Penalties", icon: AlertTriangle },
    { id: "corrections", label: "Attendance Corrections", icon: FileText },
    { id: "approvals", label: "Exception Approvals", icon: CheckCircle },
    { id: "permissions", label: "Permissions", icon: Shield },
  ];

  const renderOvertime = () => (
    <div className="space-y-6">
      {/* Overtime Configuration Section*/}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Settings className="w-6 h-6 text-blue-400" />
          Overtime & Short Time Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Weekend Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={overtimeConfig.weekendMultiplier}
              onChange={(e) =>
                setOvertimeConfig({
                  ...overtimeConfig,
                  weekendMultiplier: parseFloat(e.target.value) || 1.5,
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Holiday Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={overtimeConfig.holidayMultiplier}
              onChange={(e) =>
                setOvertimeConfig({
                  ...overtimeConfig,
                  holidayMultiplier: parseFloat(e.target.value) || 2.0,
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Overtime Hours Per Day
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={overtimeConfig.maxOvertimeHours}
              onChange={(e) =>
                setOvertimeConfig({
                  ...overtimeConfig,
                  maxOvertimeHours: parseInt(e.target.value) || 4,
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
        {overtimeConfigError && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-yellow-400 text-sm">
            {overtimeConfigError}
          </div>
        )}
        <button
          onClick={saveOvertimeConfig}
          disabled={overtimeConfigLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {overtimeConfigLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Overtime Report Section */}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Clock className="w-6 h-6 text-blue-400" />
          Overtime & Short Time Report
        </h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={overtimeStartDate}
              onChange={(e) => setOvertimeStartDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={overtimeEndDate}
              onChange={(e) => setOvertimeEndDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchOvertime}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              Fetch Report
            </button>
          </div>
        </div>
        {overtimeLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : overtimeError ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {overtimeError}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Overtime (min)
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Short Time (min)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {overtimeRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  overtimeRecords.map((r, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#1f1f1f] transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {r.employeeId}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-400">
                          {r.overtimeMinutes || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-400">
                          {r.shortMinutes || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderLateness = () => (
    <div className="space-y-6">
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          Lateness & Penalty Rules
        </h2>
        {latenessLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : latenessError ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-400">
            {latenessError}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Threshold (min)
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Grace Period (min)
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Penalty
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Deduction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {latenessRules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No rules configured
                    </td>
                  </tr>
                ) : (
                  latenessRules.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#1f1f1f] transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {r.thresholdMinutes}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {r.gracePeriodMinutes}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{r.penalty}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {r.deductionAmount ? `$${r.deductionAmount}` : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Clock className="w-6 h-6 text-blue-400" />
          Check Lateness by Date
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Employee ID
            </label>
            <input
              value={latenessEmployeeId}
              onChange={(e) => setLatenessEmployeeId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter employee ID"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input
              type="date"
              value={latenessDate}
              onChange={(e) => setLatenessDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={fetchLatenessByDate}
          disabled={latenessLoadingSingle}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {latenessLoadingSingle ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Checking...
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              Check Lateness
            </>
          )}
        </button>

        {latenessErrorSingle && (
          <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {latenessErrorSingle}
          </div>
        )}

        {latenessMinutes !== null && !latenessErrorSingle && (
          <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-gray-300">
                  Lateness for {latenessEmployeeId} on {latenessDate}:
                </p>
                <p
                  className={`mt-1 ${
                    latenessMinutes > 0 ? "text-yellow-400" : "text-green-400"
                  }`}
                >
                  {latenessMinutes > 0
                    ? `${latenessMinutes} minutes late`
                    : "On time"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Calendar className="w-6 h-6 text-purple-400" />
          Repeated Lateness Tracking
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          System flags repeated lateness for disciplinary tracking
        </p>
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            Number of days to analyze
          </label>
          <input
            type="number"
            value={repeatedDays}
            min={1}
            max={30}
            onChange={(e) => setRepeatedDays(parseInt(e.target.value))}
            className="w-full max-w-xs bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Employee ID</label>
          <input
            value={repeatedEmployeeId}
            onChange={(e) => setRepeatedEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            className="w-full max-w-xs bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={fetchRepeatedLateness}
          className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          Fetch Repeated Lateness Records
        </button>
        {repeatedLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : repeatedError ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-400">
            {repeatedError}
          </div>
        ) : repeatedRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No repeated lateness records found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Times Late
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {repeatedRecords.map((r) => (
                  <tr
                    key={r.employeeId}
                    className="hover:bg-[#1f1f1f] transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300">
                      {r.employeeName || r.employeeId}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          r.count > 5
                            ? "bg-red-900/30 text-red-400"
                            : r.count > 2
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {r.count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.count > 3 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-900/30 text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flagged
                        </span>
                      ) : (
                        <span className="text-gray-500">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderCorrections = () => (
    <div className="space-y-6">
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <FileText className="w-6 h-6 text-cyan-400" />
          Submit Attendance Correction Request
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Employee ID
            </label>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter employee ID"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input
              type="date"
              value={correctionDate}
              onChange={(e) => setCorrectionDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Reason</label>
          <textarea
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Describe the correction needed (reason + time)"
            rows={3}
          />
        </div>
        
        {/* Punch Times Section - BR-TM-15 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Add Punch Times (IN/OUT)
          </label>
          <div className="flex gap-2 mb-2">
            <select
              value={newPunchType}
              onChange={(e) => setNewPunchType(e.target.value as "IN" | "OUT")}
              className="bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <input
              type="time"
              value={newPunchTime}
              onChange={(e) => setNewPunchTime(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button
              onClick={addPunch}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {correctionPunches.length > 0 && (
            <div className="space-y-2">
              {correctionPunches.map((punch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg border border-gray-700"
                >
                  <span className="text-gray-300">
                    {punch.type}: {punch.time}
                  </span>
                  <button
                    onClick={() => removePunch(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleCorrectionSubmit}
          disabled={!correctionDate || !correctionReason || correctionPunches.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200"
        >
          Submit Request (Routed to Line Manager)
        </button>
      </div>

      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="mb-6 text-white">Attendance Corrections History</h2>
        {correctionLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : correctionError ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-400">
            {correctionError}
          </div>
        ) : correctionRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No correction requests found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-400">Reason</th>
                  <th className="px-6 py-3 text-left text-gray-400">Punches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {correctionRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#1f1f1f] transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300">{r.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          r.status === "APPROVED"
                            ? "bg-green-900/30 text-green-400"
                            : r.status === "REJECTED"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{r.reason}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {r.punches?.map((p, i) => (
                          <div key={i} className="text-sm text-gray-400">
                            {p.type}: {new Date(p.time).toLocaleTimeString()}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="flex items-center gap-3 text-white mb-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Time Exception Approval Workflow
            </h2>
            <p className="text-sm text-gray-400">
              Review, approve, or reject attendance-related requests. Unresolved requests are automatically escalated after deadlines.
            </p>
          </div>
          <button
            onClick={handleEscalateExceptions}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Escalate Pending
          </button>
        </div>
        {exceptionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : exceptionsError ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {exceptionsError}
          </div>
        ) : exceptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending exceptions
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">Type</th>
                  <th className="px-6 py-3 text-left text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-400">Reason</th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {exceptions.map((ex) => (
                  <tr
                    key={ex.id}
                    className="hover:bg-[#1f1f1f] transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300">
                      {ex.employeeId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/30 text-blue-400">
                        {ex.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          ex.status === "APPROVED"
                            ? "bg-green-900/30 text-green-400"
                            : ex.status === "REJECTED"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{ex.reason}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(ex.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {ex.status === "OPEN" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveException(ex.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectException(ex.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      {/* Permission Validation Rules*/}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Settings className="w-6 h-6 text-indigo-400" />
          Permission Validation Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Permission Duration (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={permissionRules.maxDurationHours}
              onChange={(e) =>
                setPermissionRules({
                  ...permissionRules,
                  maxDurationHours: parseInt(e.target.value) || 4,
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col justify-end gap-4"></div>
        </div>
        {permissionRulesError && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-yellow-400 text-sm">
            {permissionRulesError}
          </div>
        )}
        <button
          onClick={savePermissionRules}
          disabled={permissionRulesLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {permissionRulesLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Permission Rules
            </>
          )}
        </button>
      </div>

      {/* Permission Requests Management */}
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
        <h2 className="flex items-center gap-3 mb-6 text-white">
          <Shield className="w-6 h-6 text-indigo-400" />
          Permission Requests
        </h2>
        {permissionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : permissionsError ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {permissionsError}
          </div>
        ) : permissionRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No permission requests
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">Type</th>
                  <th className="px-6 py-3 text-left text-gray-400">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-gray-400">Reason</th>
                  <th className="px-6 py-3 text-left text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {permissionRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[#1f1f1f] transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300">
                      {req.employeeId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-400">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {req.duration || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full ${
                          req.status === "APPROVED"
                            ? "bg-green-900/30 text-green-400"
                            : req.status === "REJECTED"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {req.reason || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(req.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {req.status === "OPEN" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => alert("Approve placeholder")}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => alert("Reject placeholder")}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeTab) {
      case "overtime":
        return renderOvertime();
      case "lateness":
        return renderLateness();
      case "corrections":
        return renderCorrections();
      case "approvals":
        return renderApprovals();
      case "permissions":
        return renderPermissions();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Time Management Policies"
      description="Configure and monitor overtime, lateness, corrections, and permissions"
    >
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 p-1 bg-[#2a2a2a] rounded-xl border border-gray-700 justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-300 hover:text-white hover:bg-[#1f1f1f]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderSection()}
    </DashboardLayout>
  );
}