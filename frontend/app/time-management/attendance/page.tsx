"use client";

import React, { useState, useEffect } from 'react';
import { Clock, LogOut, LogIn, AlertCircle, Calendar, FileText, BarChart3, ArrowRight, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

// Default away from the Next dev port so calls hit the backend instead of the frontend app
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const CORRECTIONS_BASE = `${API_BASE_URL}/time-management/corrections`;

function AttendanceContent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('history');
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState('0h 0m');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<any | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [correctionEmployeeId, setCorrectionEmployeeId] = useState('');
  const [correctionDate, setCorrectionDate] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionPunches, setCorrectionPunches] = useState<{ type: 'IN' | 'OUT'; time: string }[]>([]);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [correctionList, setCorrectionList] = useState<any[]>([]);

  // Helper to derive status and latest times from record
  const getRecordStatus = (record: any) => {
    if (!record) return { status: 'OUT', lastIn: null, lastOut: null };
    
    // If backend provides status, use it (but fallback to punches if needed)
    if (record.status) {
        // If status is IN, we need the LATEST IN time for duration
        // If status is OUT, we might want the LATEST OUT time
        // But let's look at punches to be sure
    }

    const punches = record.punches || [];
    const sortedPunches = [...punches].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const lastPunch = sortedPunches.length > 0 ? sortedPunches[sortedPunches.length - 1] : null;
    
    const status = lastPunch ? lastPunch.type : 'OUT';
    
    // Find the last IN punch
    const lastIn = [...sortedPunches].reverse().find((p: any) => p.type === 'IN');
    // Find the last OUT punch
    const lastOut = [...sortedPunches].reverse().find((p: any) => p.type === 'OUT');

    return { status, lastIn: lastIn ? lastIn.time : null, lastOut: lastOut ? lastOut.time : null };
  };

  const { status, lastIn, lastOut } = getRecordStatus(attendanceRecord);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'corrections' && correctionEmployeeId) {
      fetchCorrections();
    }
  }, [activeTab, correctionEmployeeId]);

  useEffect(() => {
    if (status === 'IN' && lastIn) {
      const interval = setInterval(() => {
        const start = new Date(lastIn);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setDuration(`${hours}h ${minutes}m`);
      }, 60000);
      
      // Initial calculation
      const start = new Date(lastIn);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration(`${hours}h ${minutes}m`);

      return () => clearInterval(interval);
    } else if (status === 'OUT' && lastIn && lastOut) {
        // Show duration of the LAST session
        const start = new Date(lastIn);
        const end = new Date(lastOut);
        // If lastIn is AFTER lastOut (impossible if status is OUT, but safety check)
        // Actually if status is OUT, lastOut > lastIn usually.
        // But if we have multiple sessions: IN, OUT, IN, OUT.
        // lastIn is the start of the last session. lastOut is the end of the last session.
        // So this logic holds.
        
        if (new Date(lastOut).getTime() > new Date(lastIn).getTime()) {
            const diff = new Date(lastOut).getTime() - new Date(lastIn).getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setDuration(`${hours}h ${minutes}m`);
        } else {
             // Fallback if punches are weird
             setDuration('0h 0m');
        }
    } else {
        setDuration('0h 0m');
    }
  }, [attendanceRecord, currentTime, status, lastIn, lastOut]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/today`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecord(data);
      } else if (response.status === 404) {
        setAttendanceRecord(null);
      } else {
        console.error('Failed to fetch attendance');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ time: new Date().toISOString() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecord(data);
        // refresh history so today row is up to date
        fetchHistory();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to clock in');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ time: new Date().toISOString() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecord(data);
        // refresh history so today row is up to date
        fetchHistory();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to clock out');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatMinutes = (minutes?: number) => {
    if (!minutes || minutes <= 0) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const fetchMonthlySummary = async () => {
    try {
      setMonthlyLoading(true);
      setMonthlyError(null);
      const response = await fetch(`${API_BASE_URL}/attendance/monthly-summary`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMonthlySummary(data);
      } else {
        setMonthlySummary(null);
        setMonthlyError('Failed to load monthly summary');
      }
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
      setMonthlySummary(null);
      setMonthlyError('Error loading monthly summary');
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summary' && !monthlySummary && !monthlyLoading) {
      fetchMonthlySummary();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 29); // last 30 days

      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const response = await fetch(
        `${API_BASE_URL}/attendance/history?start=${startStr}&end=${endStr}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCorrections = async () => {
    if (!correctionEmployeeId) return;
    try {
      setCorrectionLoading(true);
      setCorrectionError(null);
      const res = await fetch(`${CORRECTIONS_BASE}/mine/${correctionEmployeeId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCorrectionList(Array.isArray(data) ? data : []);
      } else {
        setCorrectionList([]);
        setCorrectionError('Failed to load correction requests');
      }
    } catch (err: any) {
      setCorrectionError(err?.message || 'Failed to load correction requests');
      setCorrectionList([]);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const addCorrectionPunch = () => {
    if (!correctionDate) {
      setCorrectionError('Choose a date before adding punches');
      return;
    }
    setCorrectionPunches([...correctionPunches, { type: 'IN', time: `${correctionDate}T09:00` }]);
  };

  const updateCorrectionPunch = (idx: number, field: 'type' | 'time', value: string) => {
    const next = [...correctionPunches];
    // @ts-ignore
    next[idx][field] = value;
    setCorrectionPunches(next);
  };

  const removeCorrectionPunch = (idx: number) => {
    setCorrectionPunches(correctionPunches.filter((_, i) => i !== idx));
  };

  const submitCorrection = async () => {
    setCorrectionSuccess(null);
    setCorrectionError(null);
    if (!correctionEmployeeId || !correctionDate || !correctionReason || correctionPunches.length === 0) {
      setCorrectionError('Fill Employee ID, date, reason, and at least one punch');
      return;
    }
    try {
      setCorrectionLoading(true);
      const res = await fetch(`${CORRECTIONS_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: correctionEmployeeId,
          date: correctionDate,
          reason: correctionReason,
          punches: correctionPunches.map((p) => ({ ...p })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to submit correction');
      }
      setCorrectionSuccess('Correction request submitted');
      setCorrectionReason('');
      setCorrectionPunches([]);
      fetchCorrections();
    } catch (err: any) {
      setCorrectionError(err?.message || 'Failed to submit correction');
    } finally {
      setCorrectionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Tracking</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Clock in/out and manage your attendance records</p>
        </div>
        <div className="text-3xl font-light text-gray-700 dark:text-gray-300">
          {formatTime(currentTime)}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Main Clock In/Out Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {formatDate(currentTime)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Current Shift: Morning Shift (8:00 AM - 4:00 PM)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
          {/* Clock In Time Card */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Clock In Time</p>
            <div className={`text-3xl font-bold mb-1 ${lastIn ? 'text-green-500' : 'text-gray-400'}`}>
              {lastIn ? formatTime(new Date(lastIn)) : '--:--'}
            </div>
            <p className="text-sm text-gray-400">
              {lastIn ? 'Recorded' : 'Not clocked in yet'}
            </p>
          </div>

          {/* Current Duration Card */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Current Duration</p>
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-1">{duration}</div>
            <p className="text-sm text-gray-400">
                {status === 'IN' ? 'Still active' : (lastIn ? 'Shift Completed' : 'Inactive')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center space-y-6">
          <div className="flex gap-4">
            <button 
              onClick={handleClockIn}
              disabled={status === 'IN' || loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${status === 'IN' || loading
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20'
                }`}
            >
              <LogIn className="w-5 h-5" />
              Clock In
            </button>
            <button 
              onClick={handleClockOut}
              disabled={status !== 'IN' || loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${status !== 'IN' || loading
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                }`}
            >
              <LogOut className="w-5 h-5" />
              Clock Out
            </button>
          </div>

          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1">
            Use alternative clock method (Manual Entry)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[
          { id: 'history', label: 'Attendance History', icon: Calendar },
          { id: 'corrections', label: 'Correction Requests', icon: FileText },
          { id: 'summary', label: 'Monthly Summary', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[200px]">
        {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="text-center text-gray-500 py-12">
              <p>Loading attendance history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No attendance records found for the last 30 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Clock In</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Clock Out</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((rec) => {
                    const date = rec.date ? new Date(rec.date) : null;
                    const clockInTime = rec.clockInTime ? new Date(rec.clockInTime) : null;
                    const clockOutTime = rec.clockOutTime ? new Date(rec.clockOutTime) : null;
                    const statusLabel = rec.status === 'IN' ? 'In Progress' : 'Completed';
                    return (
                      <tr key={rec._id || `${rec.employeeId}-${rec.date}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {date ? date.toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {clockInTime ? formatTime(clockInTime) : '—'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {clockOutTime ? formatTime(clockOutTime) : '—'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5
                            ${rec.status === 'IN'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                            }`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {formatMinutes(rec.totalWorkMinutes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
        {activeTab === 'corrections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-500 dark:text-gray-300">Employee ID</label>
                <input
                  value={correctionEmployeeId}
                  onChange={(e) => setCorrectionEmployeeId(e.target.value)}
                  placeholder="EMP001"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500 dark:text-gray-300">Date</label>
                <input
                  type="date"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500 dark:text-gray-300">Reason</label>
                <input
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Missed clock-out"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Punches</p>
                <button
                  onClick={addCorrectionPunch}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white dark:bg-gray-700"
                >
                  <Plus className="w-4 h-4" /> Add Punch
                </button>
              </div>
              {correctionPunches.length === 0 ? (
                <p className="text-gray-500 text-sm">No punches added yet</p>
              ) : (
                <div className="space-y-2">
                  {correctionPunches.map((punch, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <select
                        value={punch.type}
                        onChange={(e) => updateCorrectionPunch(idx, 'type', e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                      </select>
                      <input
                        type="datetime-local"
                        value={punch.time}
                        onChange={(e) => updateCorrectionPunch(idx, 'time', e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <button
                        onClick={() => removeCorrectionPunch(idx)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {correctionError && (
                <div className="text-sm text-red-500">{correctionError}</div>
              )}
              {correctionSuccess && (
                <div className="text-sm text-green-500">{correctionSuccess}</div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={submitCorrection}
                  disabled={correctionLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  Submit Correction
                </button>
                <button
                  onClick={fetchCorrections}
                  disabled={correctionLoading || !correctionEmployeeId}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
                >
                  Refresh My Requests
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">My Correction Requests</h3>
              {correctionLoading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : correctionList.length === 0 ? (
                <p className="text-gray-500 text-sm">No correction requests found.</p>
              ) : (
                <div className="space-y-2">
                  {correctionList.map((req) => (
                    <div key={req._id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-800 dark:text-gray-100">
                        <p className="font-medium">{req.date ? new Date(req.date).toLocaleDateString() : '—'}</p>
                        <p className="text-gray-500 text-xs">{req.reason || 'No reason provided'}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                        {req.status || 'SUBMITTED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'summary' && (
          <div>
            {monthlyLoading ? (
              <div className="text-center text-gray-500 py-12">
                <p>Loading monthly summary...</p>
              </div>
            ) : monthlyError ? (
              <div className="text-center text-red-500 py-12">
                {monthlyError}
              </div>
            ) : !monthlySummary ? (
              <div className="text-center text-gray-500 py-12">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No attendance data for this month yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Days Worked</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {monthlySummary.totalDaysWorked}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">In the selected month</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Time</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatMinutes(monthlySummary.totalWorkMinutes)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total recorded work this month</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average / Day</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatMinutes(monthlySummary.averageWorkMinutes)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Average worked per working day</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overtime</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {monthlySummary.totalOvertimeMinutes} min
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Based on policy calculations</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Late Arrivals</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                    {monthlySummary.lateCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Days with recorded lateness</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Missed Punches</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {monthlySummary.missedPunchCount + monthlySummary.earlyLeaveCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Missing clock-outs or early leaves</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <DashboardLayout title="Attendance" description="Track your daily attendance and work hours">
      <AttendanceContent />
    </DashboardLayout>
  );
}
