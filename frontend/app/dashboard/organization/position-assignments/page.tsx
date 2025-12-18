'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { getPositionAssignments } from '../../../lib/api/organizationService';

export default function PositionAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPositionAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Position Assignments"
      description="View all position assignments"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={loadAssignments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Loader size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">All Position Assignments</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size={40} className="animate-spin text-blue-500" />
            </div>
          ) : assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Employee</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Position</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Department</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Start Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment._id} className="border-b border-gray-700 hover:bg-[#222222] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {assignment.employeeProfileId?.firstName} {assignment.employeeProfileId?.lastName}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {assignment.positionId?.title} ({assignment.positionId?.code})
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {assignment.departmentId?.name}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(assignment.startDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No assignments found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
