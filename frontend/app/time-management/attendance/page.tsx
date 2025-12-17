"use client";

import React, { useState, useEffect } from 'react';
import { Clock, LogOut, LogIn, AlertCircle, Calendar, FileText, BarChart3, ArrowRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AttendancePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('history');
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState('0h 0m');

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
  }, []);

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
          <div className="text-center text-gray-500 py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Attendance history will appear here</p>
          </div>
        )}
        {activeTab === 'corrections' && (
          <div className="text-center text-gray-500 py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No pending correction requests</p>
          </div>
        )}
        {activeTab === 'summary' && (
          <div className="text-center text-gray-500 py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Monthly summary visualization</p>
          </div>
        )}
      </div>
    </div>
  );
}
