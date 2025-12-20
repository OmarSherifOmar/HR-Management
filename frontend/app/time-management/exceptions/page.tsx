"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { AlertTriangle, Calendar, CheckCircle, Shield, Filter } from "lucide-react";

interface AttendanceException {
  date: string;
  employeeId: string;
  employeeName?: string;
  type: string;
  status: string;
  suppressed?: boolean;
  suppressionReason?: string;
  latenessMinutes?: number;
}

interface LeaveDay {
  employeeId: string;
  employeeName?: string;
  date: string;
  endDate?: string;
  leaveType: string;
  status: string;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  hasException: boolean;
  hasLeave: boolean;
  exceptionType?: string;
  leaveType?: string;
  isToday: boolean;
}

export default function AttendanceExceptionsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  // Set default dates (last 7 days)
  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(weekAgo.toISOString().split("T")[0]);
  }, []);

  const fetchExceptions = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch exceptions
      const exceptionsResponse = await fetch(
        `${API_BASE_URL}/attendance/exceptions?start=${startDate}&end=${endDate}`,
        { credentials: "include" }
      );
      if (!exceptionsResponse.ok) {
        throw new Error("Failed to fetch attendance exceptions");
      }
      const exceptionsData = await exceptionsResponse.json();
      setExceptions(exceptionsData || []);

      // FR-TM-16: Fetch integrated attendance + leave data
      const integratedResponse = await fetch(
        `${API_BASE_URL}/attendance/integrated-view?start=${startDate}&end=${endDate}`,
        { credentials: "include" }
      );
      if (integratedResponse.ok) {
        const integratedData = await integratedResponse.json();
        setLeaveDays(integratedData.leaveDays || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-900/40 text-green-400";
      case "REJECTED":
        return "bg-red-900/40 text-red-400";
      case "PENDING":
        return "bg-yellow-900/40 text-yellow-400";
      case "OPEN":
        return "bg-blue-900/40 text-blue-400";
      case "RESOLVED":
        return "bg-gray-700 text-gray-300";
      default:
        return "bg-gray-700 text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "LATE":
        return "bg-orange-900/40 text-orange-400";
      case "MISSED_PUNCH":
        return "bg-red-900/40 text-red-400";
      case "EARLY_LEAVE":
        return "bg-purple-900/40 text-purple-400";
      case "SHORT_TIME":
        return "bg-yellow-900/40 text-yellow-400";
      case "OVERTIME_REQUEST":
        return "bg-blue-900/40 text-blue-400";
      default:
        return "bg-gray-700 text-gray-400";
    }
  };

  const suppressedExceptions = exceptions.filter((e) => e.suppressed);
  const activeExceptions = exceptions.filter((e) => !e.suppressed);

  // Calendar generation logic
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    const calendarDays: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      calendarDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        hasException: false,
        hasLeave: false,
        isToday: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayException = exceptions.find(e => e.date.startsWith(dateStr));
      const dayLeave = leaveDays.find(l => {
        const leaveStart = new Date(l.date);
        const leaveEnd = l.endDate ? new Date(l.endDate) : leaveStart;
        return date >= leaveStart && date <= leaveEnd;
      });
      
      calendarDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        hasException: !!dayException,
        hasLeave: !!dayLeave,
        exceptionType: dayException?.type,
        leaveType: dayLeave?.leaveType,
        isToday: date.getTime() === today.getTime()
      });
    }

    // Next month days to complete grid
    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        hasException: false,
        hasLeave: false,
        isToday: false
      });
    }

    return calendarDays;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();

  return (
    <DashboardLayout title="Attendance Exceptions" description="View penalty suppression and leave integration">
      <div className="p-8">

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Date Range Selector */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-white">
            <Filter className="w-5 h-5 text-blue-400" />
            Select Date Range
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={fetchExceptions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200"
            >
              {loading ? "Loading..." : "Fetch Exceptions"}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg border border-gray-700 bg-[#2a2a2a] p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {exceptions.length > 0 && viewMode === 'table' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Total Exceptions
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {exceptions.length}
              </p>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Active Penalties
              </h3>
              <p className="text-3xl font-bold text-orange-400">
                {activeExceptions.length}
              </p>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Suppressed
              </h3>
              <p className="text-3xl font-bold text-green-400">
                {suppressedExceptions.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Holiday/Leave/Rest Days
              </p>
            </div>
          </div>
        )}

        {/* Suppressed Exceptions Section */}
        {suppressedExceptions.length > 0 && viewMode === 'table' && (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 mb-8">
            <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-green-400">
              <CheckCircle className="w-5 h-5" />
              Suppressed Penalties
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              These penalties were automatically suppressed due to holidays, rest
              days, or approved leave
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-green-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Employee ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Suppression Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suppressedExceptions.map((exception, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {new Date(exception.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {exception.employeeId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(
                            exception.type
                          )}`}
                        >
                          {exception.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-green-400">
                        {exception.suppressionReason || "Holiday/Leave/Rest Day"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active Exceptions Section */}
        {activeExceptions.length > 0 && viewMode === 'table' && (
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-white">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Active Exceptions
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Lateness (mins)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeExceptions.map((exception, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(exception.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {exception.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(
                            exception.type
                          )}`}
                        >
                          {exception.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                            exception.status
                          )}`}
                        >
                          {exception.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {exception.latenessMinutes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FR-TM-16: Leave Days Section */}
        {leaveDays.length > 0 && viewMode === 'table' && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 mb-8">
            <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-blue-400">
              <Calendar className="w-5 h-5" />
              Approved Leave Days (FR-TM-16)
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              Leave periods synced from Leave Management System - penalties automatically suppressed
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-blue-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaveDays.map((leave, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {leave.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(leave.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-900/40 text-green-400">
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {leave.leaveType || 'Approved Leave'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar View - FR-TM-16 */}
        {viewMode === 'calendar' && (
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] border border-gray-700 rounded-lg text-gray-300 transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] border border-gray-700 rounded-lg text-gray-300 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-400 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`
                    min-h-[100px] p-2 border rounded-lg transition-all
                    ${day.isCurrentMonth ? 'bg-[#1a1a1a] border-gray-700' : 'bg-[#0f0f0f] border-gray-800 opacity-50'}
                    ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                    ${day.hasException && !day.hasLeave ? 'border-orange-500/50' : ''}
                    ${day.hasLeave ? 'border-green-500/50' : ''}
                    ${day.hasException && day.hasLeave ? 'border-purple-500/50' : ''}
                  `}
                >
                  <div className={`text-sm font-semibold mb-2 ${day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                    {day.dayOfMonth}
                  </div>
                  
                  <div className="space-y-1">
                    {day.hasException && (
                      <div className="text-xs px-2 py-1 rounded bg-orange-900/40 text-orange-400 border border-orange-700">
                        {day.exceptionType || 'Exception'}
                      </div>
                    )}
                    {day.hasLeave && (
                      <div className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 border border-green-700">
                        {day.leaveType || 'Leave'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
                <span className="text-gray-400">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-orange-500/50 bg-orange-900/20"></div>
                <span className="text-gray-400">Exception</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500/50 bg-green-900/20"></div>
                <span className="text-gray-400">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-purple-500/50 bg-purple-900/20"></div>
                <span className="text-gray-400">Both</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && exceptions.length === 0 && leaveDays.length === 0 && startDate && endDate && viewMode === 'table' && (
          <div className="bg-[#2a2a2a] rounded-xl p-12 text-center border border-gray-700">
            <p className="text-gray-400 text-lg">
              No attendance exceptions or leave days found for the selected period
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different date range
            </p>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-3">
            <Shield className="w-5 h-5" />
            Penalty Suppression Rules
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <CheckCircle className="inline w-4 h-4 text-green-400 mr-2" />
              <strong className="text-green-400">Holidays:</strong> All penalties suppressed on national
              and organizational holidays
            </li>
            <li>
              <CheckCircle className="inline w-4 h-4 text-green-400 mr-2" />
              <strong className="text-green-400">Rest Days:</strong> No penalties applied on weekly rest
              days configured in shift schedules
            </li>
            <li>
              <CheckCircle className="inline w-4 h-4 text-green-400 mr-2" />
              <strong className="text-green-400">Approved Leave:</strong> Lateness and penalties
              automatically suppressed during approved leave periods
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
