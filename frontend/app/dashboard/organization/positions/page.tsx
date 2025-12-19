'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Loader, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  getPositions,
  getDepartments,
  Position,
  Department,
} from '@/app/lib/api/organizationService';

export default function PositionsPage() {
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load positions and departments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token') || undefined;
        const [positionsData, deptsData] = await Promise.all([
          getPositions(token, { active: undefined }),
          getDepartments(token, undefined),
        ]);
        setPositions(Array.isArray(positionsData) ? positionsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load positions');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getDepartmentName = (deptId: string | undefined) => {
    if (!deptId) return 'N/A';
    const dept = departments.find((d) => d._id === deptId);
    return dept ? dept.name : 'N/A';
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const data = await getPositions(token, { active: undefined });
      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh positions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Positions"
      description="Manage your organization's job positions"
    >
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex items-center justify-end">
        <button
          onClick={() => router.push('/dashboard/organization/positions/create')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
        >
          <Plus size={20} />
          Create Position
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">All Positions</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={40} className="animate-spin text-blue-500" />
          </div>
        ) : positions && positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/50">
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Position Title</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Code</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Department</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                  <th className="text-center py-4 px-6 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr
                    key={position._id}
                    className="border-b border-gray-700 hover:bg-[#222222] transition-colors"
                  >
                    <td className="py-4 px-6 text-white font-medium">{position.title}</td>
                    <td className="py-4 px-6 text-gray-400 font-mono">{position.code}</td>
                    <td className="py-4 px-6 text-gray-300">{getDepartmentName(position.departmentId)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          position.isActive !== false
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : 'bg-red-900/30 text-red-400 border border-red-700'
                        }`}
                      >
                        {position.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/organization/positions/${position._id}`)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No positions found</p>
            <p className="text-gray-500 text-sm mt-2">Create your first position to get started</p>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
