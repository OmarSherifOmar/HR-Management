'use client';

import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, Loader, Users } from 'lucide-react';

interface SendReminderProps {
  userRole: string | null;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function SendReminder({ userRole, onNotify }: SendReminderProps) {
  const [cycles, setCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [reminderType, setReminderType] = useState<string>('CYCLE_ENDING_SOON');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<any | null>(null);

  useEffect(() => {
    fetchCycles();
    fetchDepartments();
  }, []);

  const fetchCycles = async () => {
    try {
      console.log('[SendReminder] Fetching ACTIVE cycles...');
      const response = await fetch('/api/performance/cycles?status=ACTIVE', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SendReminder] Backend error:', response.status, errorText);
        throw new Error(`Failed to fetch cycles: ${response.status}`);
      }
      const data = await response.json();
      console.log('[SendReminder] Fetched cycles:', data);
      setCycles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[SendReminder] Error fetching cycles:', error);
      setCycles([]);
      onNotify?.('Failed to fetch cycles', 'error');
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('[SendReminder] Fetching departments...');
      const response = await fetch('/api/org/departments', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SendReminder] Backend error:', response.status, errorText);
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }
      const data = await response.json();
      console.log('[SendReminder] Fetched departments:', data);
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[SendReminder] Error fetching departments:', error);
      setDepartments([]);
      onNotify?.('Failed to fetch departments', 'error');
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSendReminder = async () => {
    if (!selectedCycleId) {
      onNotify?.('Please select a cycle', 'error');
      return;
    }

    if (selectedDepartmentIds.length === 0) {
      onNotify?.('Please select at least one department', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/performance/assignments/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cycleId: selectedCycleId,
          reminderType,
          departmentIds: selectedDepartmentIds,
          customMessage: customMessage || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        throw new Error(`Failed to send reminder: ${response.status}`);
      }
      const result = await response.json();
      setReminderResult(result);
      onNotify?.(`Reminders sent to ${result.remindersCount} manager(s)`, 'success');
    } catch (error) {
      console.error('Error sending reminder:', error);
      onNotify?.('Failed to send reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Send Appraisal Reminders</h2>
        <p className="mt-1 text-sm text-gray-400">Send reminders to managers for pending appraisals</p>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 space-y-6">
        {/* Cycle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Cycle *</label>
          <select
            value={selectedCycleId}
            onChange={(e) => {
              console.log('[SendReminder] Cycle selected:', e.target.value);
              setSelectedCycleId(e.target.value);
              setSelectedDepartmentIds([]);
              setReminderResult(null);
            }}
            className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">Choose a cycle...</option>
            {cycles && cycles.length > 0 ? (
              cycles.map((cycle) => (
                <option key={cycle._id || cycle.id} value={cycle._id || cycle.id}>
                  {cycle.name} ({cycle.status}) - Ends: {new Date(cycle.endDate).toLocaleDateString()}
                </option>
              ))
            ) : (
              <option disabled>No active cycles available</option>
            )}
          </select>
        </div>

        {/* Reminder Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Reminder Type *</label>
          <select
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="CYCLE_ENDING_SOON">Cycle Ending Soon</option>
            <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
            <option value="OVERDUE_ASSIGNMENT">Overdue Assignment</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
          </p>
        </div>

        {/* Department Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Departments *</label>
          <div className="space-y-2 bg-gray-700/50 p-3 rounded max-h-48 overflow-y-auto">
            {departments.length === 0 ? (
              <p className="text-xs text-gray-400">No departments available</p>
            ) : (
              departments.map((dept) => (
                <label key={dept._id || dept.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDepartmentIds.includes(dept._id || dept.id)}
                    onChange={() => toggleDepartment(dept._id || dept.id)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-200">{dept.name}</span>
                </label>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Selected: {selectedDepartmentIds.length} department(s)
          </p>
        </div>

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Custom Message (Optional)</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to include in the reminder..."
            className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-400">Leave empty to use default message for the reminder type.</p>
        </div>

        {/* Send Button */}
        <div>
          <button
            onClick={handleSendReminder}
            disabled={loading || !selectedCycleId || selectedDepartmentIds.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Reminder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Summary */}
      {reminderResult && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/30 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-300">Reminders Sent Successfully</p>
              <p className="mt-1 text-sm text-green-200">{reminderResult.remindersCount} reminder(s) sent to manager(s)</p>
            </div>
          </div>

          {/* Message Sent */}
          <div className="bg-gray-700/50 p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Message Sent:</p>
            <p className="text-sm text-gray-200 italic">"{reminderResult.message}"</p>
          </div>

          {/* Managers Notified */}
          <div className="bg-gray-700/50 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Users size={14} /> Managers Notified ({reminderResult.remindedManagers.length})
            </p>
            <div className="space-y-2">
              {reminderResult.remindedManagers.map((mgr: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-300 pl-2 border-l-2 border-green-600">
                  <p className="font-medium">{mgr.managerName}</p>
                  <p className="text-xs text-gray-400">{mgr.pendingAssignments} pending assignment(s)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-700/50 p-2 rounded">
              <p className="text-xs text-gray-400">Total Pending</p>
              <p className="text-lg font-bold text-blue-400">{reminderResult.totalPendingAssignments}</p>
            </div>
            <div className="bg-gray-700/50 p-2 rounded">
              <p className="text-xs text-gray-400">Reminder Type</p>
              <p className="text-lg font-bold text-purple-400">{reminderResult.reminderType.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium">Reminder Tips</p>
          <ul className="mt-2 space-y-1 text-xs ml-2 list-disc">
            <li>Reminders are sent only to managers with pending assignments</li>
            <li>Managers will receive notifications in their notification center</li>
            <li>You can customize the message or use the default for the reminder type</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
