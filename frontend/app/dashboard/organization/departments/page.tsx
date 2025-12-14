'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Loader, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  getDepartments,
  getPositions,
  Department,
  Position,
} from '@/app/lib/api/organizationService';

export default function DepartmentsPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load departments and positions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token') || undefined;
        const [deptsData, positionsData] = await Promise.all([
          getDepartments(token, undefined),
          getPositions(token, { active: undefined }),
        ]);
        setDepartments(deptsData);
        setPositions(positionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getPositionName = (posId: string | undefined) => {
    if (!posId) return 'N/A';
    const pos = positions.find((p) => p._id === posId);
    return pos ? `${pos.title} (${pos.code})` : 'N/A';
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const data = await getDepartments(token, undefined);
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh departments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Departments"
      description="Manage your organization's departments"
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
          onClick={() => router.push('/dashboard/organization/departments/create')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
        >
          <Plus size={20} />
          Create Department
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">All Departments</h2>
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
          <div className="flex justify-center items-center py-16">
            <Loader size={40} className="animate-spin text-blue-500" />
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No departments found</p>
            <button
              onClick={() => router.push('/dashboard/organization/departments/create')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium mx-auto"
            >
              <Plus size={18} />
              Create First Department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-[#0a0a0a]">
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Name</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Description</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Head Position</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id} className="border-b border-gray-700 hover:bg-[#222222] transition-colors">
                    <td className="py-4 px-6 text-white font-medium">{dept.name}</td>
                    <td className="py-4 px-6 text-gray-400">{dept.description || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-400">{getPositionName(dept.headPositionId)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          dept.isActive
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : 'bg-red-900/30 text-red-400 border border-red-700'
                        }`}
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => router.push(`/dashboard/organization/departments/${dept._id}`)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
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
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
