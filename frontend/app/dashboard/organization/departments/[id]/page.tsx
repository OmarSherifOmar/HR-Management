'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Ban, Trash2, Briefcase, AlertCircle, Loader } from 'lucide-react';
import {
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
  deleteDepartment,
  getPositions,
} from '@/app/lib/api/organizationService';

interface Department {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  headPositionId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
}

interface Position {
  _id?: string;
  id?: string;
  title: string;
  code: string;
  departmentId?: string;
  isActive?: boolean;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deptId = params?.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departmentPositions, setDepartmentPositions] = useState<Position[]>([]);

  const [loading, setLoading] = useState(true);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    headPositionId: '',
  });

  // Load department details
  useEffect(() => {
    if (!deptId) return;

    const loadDepartment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDepartmentById(deptId);
        setDepartment(data);
        setEditFormData({
          name: data.name,
          description: data.description || '',
          headPositionId: data.headPositionId || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
  }, [deptId]);

  // Load positions and active assignments
  useEffect(() => {
    if (!deptId) return;

    const loadData = async () => {
      try {
        setPositionsLoading(true);

        // Load all positions
        const positionsData = await getPositions();
        setPositions(positionsData);

        // Filter positions for this department
        const deptPositions = positionsData.filter(
          (p: Position) => p.departmentId === deptId || p.departmentId === department?._id
        );
        setDepartmentPositions(deptPositions);
      } catch (err) {
        // Handle error silently
      } finally {
        setPositionsLoading(false);
      }
    };

    loadData();
  }, [deptId, department?._id]);

  const getPositionName = (posId: string | undefined) => {
    if (!posId) return 'N/A';
    const pos = positions.find((p) => p._id === posId || p.id === posId);
    return pos ? `${pos.title} (${pos.code})` : 'N/A';
  };

  // EDIT DEPARTMENT
  const handleEditClick = () => {
    setIsEditingModal(true);
  };

  const handleSaveEdit = async () => {
    if (!department?._id) return;

    try {
      setActionLoading('edit');
      await updateDepartment(department._id, editFormData);
      alert('Department updated successfully!');

      // Refresh department data
      const updated = await getDepartmentById(deptId);
      setDepartment(updated);
      setIsEditingModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setActionLoading(null);
    }
  };

  // DEACTIVATE DEPARTMENT
  const handleDeactivate = async () => {
    if (!department?._id) return;
    if (!confirm('Are you sure you want to deactivate this department?')) return;

    try {
      setActionLoading('deactivate');
      await deactivateDepartment(department._id);
      alert('Department deactivated successfully!');

      // Refresh department data
      const updated = await getDepartmentById(deptId);
      setDepartment(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate department');
    } finally {
      setActionLoading(null);
    }
  };

  // DELETE DEPARTMENT
  const handleDelete = async () => {
    if (!department?._id) return;
    if (!confirm('Are you sure you want to permanently delete this department? This action cannot be undone.')) return;

    try {
      setActionLoading('delete');
      await deleteDepartment(department._id);
      alert('Department deleted successfully!');
      router.push('/dashboard/organization/departments');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete department');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="flex items-center justify-center h-screen">
          <Loader size={40} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-700 rounded-lg p-6">
          <AlertCircle size={24} className="text-red-400" />
          <div>
            <p className="font-semibold text-red-400">{error || 'Department not found'}</p>
            <p className="text-red-300 text-sm">The department you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Departments
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">{department.name}</h1>
            <p className="text-gray-400 mt-2">{department.description || 'No description'}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              department.isActive
                ? 'bg-green-900/30 text-green-400 border border-green-700'
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}
          >
            {department.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Department Details Card */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Department Information</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Department ID</p>
                <p className="text-gray-300 font-mono text-sm">{department._id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Department Name</p>
                <p className="text-gray-300">{department.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-gray-300">{department.description || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Head Position</p>
                <p className="text-gray-300">{getPositionName(department.headPositionId)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-gray-300">{department.isActive ? 'Active' : 'Inactive'}</p>
              </div>

              {department.createdAt && (
                <div>
                  <p className="text-sm text-gray-400">Created At</p>
                  <p className="text-gray-300">{new Date(department.createdAt).toLocaleDateString()}</p>
                </div>
              )}

              {department.closedAt && (
                <div>
                  <p className="text-sm text-gray-400">Closed At</p>
                  <p className="text-gray-300">{new Date(department.closedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleEditClick}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Edit2 size={16} />
                {actionLoading === 'edit' ? 'Saving...' : 'Edit'}
              </button>
              {department.isActive && (
                <button
                  onClick={handleDeactivate}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <Ban size={16} />
                  {actionLoading === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Positions Section */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase size={24} className="text-blue-400" />
              <h2 className="text-2xl font-bold">
                Positions ({departmentPositions.length})
              </h2>
            </div>

            {positionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader size={32} className="animate-spin text-blue-500" />
              </div>
            ) : departmentPositions && departmentPositions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Position Title</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Code</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentPositions.map((position) => (
                      <tr key={position._id || position.id} className="border-b border-gray-700 hover:bg-[#222222] transition-colors">
                        <td className="py-3 px-4 text-white">{position.title}</td>
                        <td className="py-3 px-4 text-gray-300 font-mono">{position.code}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              position.isActive !== false
                                ? 'bg-green-900/30 text-green-400 border border-green-700'
                                : 'bg-red-900/30 text-red-400 border border-red-700'
                            }`}
                          >
                            {position.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No positions in this department</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1"></div>
      </div>

      {/* Edit Department Modal */}
      {isEditingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Edit Department</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Department Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter department name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter department description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Head Position (Optional)</label>
                <select
                  value={editFormData.headPositionId}
                  onChange={(e) => setEditFormData({ ...editFormData, headPositionId: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Position --</option>
                  {positions.map((pos) => (
                    <option key={pos._id} value={pos._id}>
                      {pos.title} ({pos.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading !== null || !editFormData.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {actionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditingModal(false)}
                disabled={actionLoading !== null}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
