'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';
import { Calendar as CalendarIcon, Plus, Trash2, Edit, X, Ban } from 'lucide-react';

type Holiday = {
  _id: string;
  name: string;
  startDate: string;
  endDate?: string;
  type: string;
  active: boolean;
};

type BlockedPeriod = {
  from: string;
  to: string;
  reason: string;
};

type CalendarData = {
  _id: string;
  year: number;
  holidays: Holiday[];
  blockedPeriods: BlockedPeriod[];
};

export default function CalendarPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentCalendar, setCurrentCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showBlockedPeriodModal, setShowBlockedPeriodModal] = useState(false);

  const [holidayForm, setHolidayForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'ORGANIZATIONAL',
  });

  const [blockedPeriodForm, setBlockedPeriodForm] = useState({
    from: '',
    to: '',
    reason: '',
  });

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (isLoggedIn && user?.role === 'HR Admin') {
      fetchCalendars();
    }
  }, [isLoading, isLoggedIn, user, router]);

  useEffect(() => {
    if (selectedYear) {
      fetchCalendarByYear(selectedYear);
    }
  }, [selectedYear]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/calendar/years', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCalendars(data);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarByYear = async (year: number) => {
    try {
      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${year}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentCalendar(data);
      } else if (response.status === 404) {
        setCurrentCalendar(null);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setCurrentCalendar(null);
    }
  };

  const createCalendar = async () => {
    try {
      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${selectedYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        alert(`Calendar for ${selectedYear} created successfully!`);
        fetchCalendars();
        fetchCalendarByYear(selectedYear);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to create calendar';
        alert(`Error creating calendar:\n${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating calendar:', error);
      alert('Failed to create calendar');
    }
  };

  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        name: holidayForm.name,
        startDate: new Date(holidayForm.startDate).toISOString(),
        type: holidayForm.type,
      };

      if (holidayForm.endDate) {
        payload.endDate = new Date(holidayForm.endDate).toISOString();
      }

      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${selectedYear}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Holiday added successfully!');
        setShowHolidayModal(false);
        setHolidayForm({ name: '', startDate: '', endDate: '', type: 'ORGANIZATIONAL' });
        fetchCalendarByYear(selectedYear);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to add holiday';
        alert(`Error adding holiday:\n${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Failed to add holiday');
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${selectedYear}/holidays/${holidayId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Holiday deleted successfully!');
        fetchCalendarByYear(selectedYear);
      } else {
        alert('Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  const addBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${selectedYear}/blocked-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from: new Date(blockedPeriodForm.from).toISOString(),
          to: new Date(blockedPeriodForm.to).toISOString(),
          reason: blockedPeriodForm.reason,
        }),
      });

      if (response.ok) {
        alert('Blocked period added successfully!');
        setShowBlockedPeriodModal(false);
        setBlockedPeriodForm({ from: '', to: '', reason: '' });
        fetchCalendarByYear(selectedYear);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to add blocked period';
        alert(`Error adding blocked period:\n${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding blocked period:', error);
      alert('Failed to add blocked period');
    }
  };

  const deleteBlockedPeriod = async (index: number) => {
    if (!confirm('Are you sure you want to delete this blocked period?')) return;

    try {
      const response = await fetch(`http://localhost:3000/leaves/calendar/year/${selectedYear}/blocked-periods/${index}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Blocked period deleted successfully!');
        fetchCalendarByYear(selectedYear);
      } else {
        alert('Failed to delete blocked period');
      }
    } catch (error) {
      console.error('Error deleting blocked period:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Calendar & Blocked Days"
      description="Configure public holidays and blocked periods for leave requests"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar & Blocked Days</h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {!currentCalendar && (
            <button
              onClick={createCalendar}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Calendar for {selectedYear}
            </button>
          )}
        </div>
      </div>

      {currentCalendar ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Public Holidays Section */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CalendarIcon size={24} />
                Public Holidays
              </h2>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={18} />
                Add Holiday
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentCalendar.holidays && currentCalendar.holidays.length > 0 ? (
                currentCalendar.holidays.map((holiday) => (
                  <div
                    key={holiday._id}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-700"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{holiday.name}</h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(holiday.startDate)}
                        {holiday.endDate && holiday.endDate !== holiday.startDate && 
                          ` - ${formatDate(holiday.endDate)}`
                        }
                      </p>
                      <span className="text-xs text-blue-400">{holiday.type}</span>
                    </div>
                    <button
                      onClick={() => deleteHoliday(holiday._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No holidays configured</p>
                </div>
              )}
            </div>
          </div>

          {/* Blocked Periods Section */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Ban size={24} />
                Blocked Periods
              </h2>
              <button
                onClick={() => setShowBlockedPeriodModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={18} />
                Add Blocked Period
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentCalendar.blockedPeriods && currentCalendar.blockedPeriods.length > 0 ? (
                currentCalendar.blockedPeriods.map((period, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-red-700/30"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{period.reason}</h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(period.from)} - {formatDate(period.to)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBlockedPeriod(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Ban size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No blocked periods configured</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#2a2a2a] rounded-lg p-12 text-center border border-gray-700">
          <CalendarIcon size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg mb-4">No calendar found for {selectedYear}</p>
          <p className="text-gray-500 mb-6">Create a calendar to start adding holidays and blocked periods</p>
          <button
            onClick={createCalendar}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Calendar for {selectedYear}
          </button>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Public Holiday</h2>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={addHoliday} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  placeholder="e.g., New Year's Day"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={holidayForm.startDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date (for multi-day holidays)
                </label>
                <input
                  type="date"
                  value={holidayForm.endDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Holiday Type
                </label>
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                >
                  <option value="ORGANIZATIONAL">Organizational</option>
                  <option value="NATIONAL">National</option>
                  <option value="RELIGIOUS">Religious</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Blocked Period Modal */}
      {showBlockedPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Blocked Period</h2>
              <button
                onClick={() => setShowBlockedPeriodModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={addBlockedPeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={blockedPeriodForm.reason}
                  onChange={(e) => setBlockedPeriodForm({ ...blockedPeriodForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  placeholder="e.g., End-of-year closing, Exam period"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  value={blockedPeriodForm.from}
                  onChange={(e) => setBlockedPeriodForm({ ...blockedPeriodForm, from: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  value={blockedPeriodForm.to}
                  onChange={(e) => setBlockedPeriodForm({ ...blockedPeriodForm, to: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-300">
                  ⚠️ Leave requests during blocked periods will be automatically rejected or require special approval.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Add Blocked Period
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockedPeriodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
