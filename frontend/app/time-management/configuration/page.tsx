"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Calendar, Settings, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Holiday {
  _id: string;
  type: "NATIONAL" | "ORGANIZATIONAL" | "WEEKLY_REST";
  startDate: string;
  endDate?: string;
  name?: string;
  active: boolean;
}

export default function TimeManagementConfigurationPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new holiday
  const [newHoliday, setNewHoliday] = useState({
    type: "NATIONAL" as "NATIONAL" | "ORGANIZATIONAL" | "WEEKLY_REST",
    startDate: "",
    endDate: "",
    name: "",
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Holiday>>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/time-management/holidays`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch holidays");
      const data = await response.json();
      setHolidays(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch holidays");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newHoliday.startDate || !newHoliday.name) {
      setError("Please provide at least start date and name");
      return;
    }

    try {
      // Build payload with only non-empty fields
      const payload: any = {
        type: newHoliday.type,
        startDate: newHoliday.startDate,
        name: newHoliday.name,
      };
      
      // Only include endDate if it's not empty
      if (newHoliday.endDate && newHoliday.endDate.trim() !== "") {
        payload.endDate = newHoliday.endDate;
      }

      console.log('Sending payload:', payload);
      console.log('Stringified:', JSON.stringify(payload));

      const response = await fetch(`${API_BASE_URL}/time-management/holidays`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create holiday");
      }
      setSuccess("Holiday created successfully");
      setNewHoliday({
        type: "NATIONAL",
        startDate: "",
        endDate: "",
        name: "",
      });
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || "Failed to create holiday");
    }
  };

  const handleUpdateHoliday = async (id: string) => {
    try {
      // Build payload, excluding empty strings
      const payload: any = {};
      if (editForm.type) payload.type = editForm.type;
      if (editForm.startDate) payload.startDate = editForm.startDate;
      if (editForm.endDate && editForm.endDate.trim() !== "") payload.endDate = editForm.endDate;
      if (editForm.name) payload.name = editForm.name;
      if (editForm.active !== undefined) payload.active = editForm.active;

      const response = await fetch(`${API_BASE_URL}/time-management/holidays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update holiday");
      }
      setSuccess("Holiday updated successfully");
      setEditingId(null);
      setEditForm({});
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || "Failed to update holiday");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/time-management/holidays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: !currentActive }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update holiday status");
      }
      setSuccess(`Holiday ${!currentActive ? "activated" : "deactivated"}`);
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || "Failed to update holiday status");
    }
  };

  const startEdit = (holiday: Holiday) => {
    setEditingId(holiday._id);
    setEditForm({
      type: holiday.type,
      startDate: holiday.startDate.split("T")[0],
      endDate: holiday.endDate ? holiday.endDate.split("T")[0] : "",
      name: holiday.name,
      active: holiday.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <DashboardLayout title="Holiday & Rest Day Configuration" description="Manage holidays, rest days, and penalty suppression rules">
      <div className="p-8">

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Create Holiday Form */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-white">
            <Plus className="w-5 h-5 text-blue-400" />
            Add New Holiday
          </h2>
        <form onSubmit={handleCreateHoliday} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Type
              </label>
              <select
                value={newHoliday.type}
                onChange={(e) =>
                  setNewHoliday({
                    ...newHoliday,
                    type: e.target.value as any,
                  })
                }
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NATIONAL">National Holiday</option>
                <option value="ORGANIZATIONAL">Organizational Holiday</option>
                <option value="WEEKLY_REST">Weekly Rest Day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Holiday Name
              </label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) =>
                  setNewHoliday({ ...newHoliday, name: e.target.value })
                }
                placeholder="e.g., Christmas Day"
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={newHoliday.startDate}
                onChange={(e) =>
                  setNewHoliday({ ...newHoliday, startDate: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={newHoliday.endDate}
                onChange={(e) =>
                  setNewHoliday({ ...newHoliday, endDate: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Holiday
          </button>
        </form>
        </div>

        {/* Holidays List */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-700">
          <h2 className="flex items-center gap-3 text-xl font-semibold mb-4 text-white">
            <Calendar className="w-5 h-5 text-purple-400" />
            Configured Holidays
          </h2>

          {loading ? (
            <p className="text-center text-gray-400">Loading holidays...</p>
          ) : holidays.length === 0 ? (
            <p className="text-center text-gray-400">
              No holidays configured yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday._id} className="border-b border-gray-700 hover:bg-[#1f1f1f] transition-colors">
                      {editingId === holiday._id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editForm.type}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  type: e.target.value as any,
                                })
                              }
                              className="p-2 bg-[#1a1a1a] border border-gray-600 rounded text-gray-100"
                            >
                            <option value="NATIONAL">National</option>
                            <option value="ORGANIZATIONAL">
                              Organizational
                            </option>
                            <option value="WEEKLY_REST">Weekly Rest</option>
                          </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editForm.name || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              className="p-2 bg-[#1a1a1a] border border-gray-600 rounded w-full text-gray-100"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={editForm.startDate || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  startDate: e.target.value,
                                })
                              }
                              className="p-2 bg-[#1a1a1a] border border-gray-600 rounded text-gray-100"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="date"
                              value={editForm.endDate || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  endDate: e.target.value,
                                })
                              }
                              className="p-2 bg-[#1a1a1a] border border-gray-600 rounded text-gray-100"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                holiday.active
                                  ? "bg-green-900/40 text-green-400"
                                  : "bg-red-900/40 text-red-400"
                              }`}
                            >
                              {holiday.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleUpdateHoliday(holiday._id)}
                              className="text-green-400 hover:text-green-300 mr-3 flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-400 hover:text-gray-300 flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          </td>
                      </>
                    ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-400 rounded">
                              {holiday.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {holiday.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(holiday.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {holiday.endDate
                              ? new Date(holiday.endDate).toLocaleDateString()
                              : "Same day"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                holiday.active
                                  ? "bg-green-900/40 text-green-400"
                                  : "bg-red-900/40 text-red-400"
                              }`}
                            >
                              {holiday.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                            <button
                              onClick={() => startEdit(holiday)}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleToggleActive(holiday._id, holiday.active)
                              }
                              className={`flex items-center gap-1 ${
                                holiday.active
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-green-400 hover:text-green-300"
                              }`}
                            >
                              {holiday.active ? (
                                <><XCircle className="w-4 h-4" />Deactivate</>
                              ) : (
                                <><CheckCircle className="w-4 h-4" />Activate</>
                              )}
                            </button>
                          </td>
                      </>
                    )}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-3">
            <Settings className="w-5 h-5" />
            Holiday Configuration Guide
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-blue-400">National Holiday:</strong> Country-wide holidays that apply
              to all employees
            </li>
            <li>
              <strong className="text-blue-400">Organizational Holiday:</strong> Company-specific holidays
              or closures
            </li>
            <li>
              <strong className="text-blue-400">Weekly Rest Day:</strong> Regular weekly off days (e.g.,
              Fridays, Sundays)
            </li>
            <li className="mt-4 pt-4 border-t border-gray-700">
              <strong className="text-green-400"></strong> Penalties are automatically suppressed on
              holidays, rest days, and approved leave days
            </li>
            <li>
              <strong className="text-green-400"></strong> Holidays are linked to shift schedules
              and affect overtime calculations
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
