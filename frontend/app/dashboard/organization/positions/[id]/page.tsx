'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Ban, Trash2, AlertCircle, Loader } from 'lucide-react';
import {
  getPositionById,
  updatePosition,
  deactivatePosition,
  deletePosition,
  getDepartments,
} from '@/app/lib/api/organizationService';

interface Position {
  _id?: string;
  id?: string;
  title: string;
  code: string;
  description?: string;
  departmentId?: string;
  reportsToPositionId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Department {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
}

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const posId = params?.id as string;

  const [position, setPosition] = useState<Position | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    code: '',
    description: '',
    departmentId: '',
  });

  // Load position details
  useEffect(() => {
    if (!posId) return;

    const loadPosition = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPositionById(posId);
        const position = data as Position;
        setPosition(position);
        setEditFormData({
          title: position.title,
          code: position.code,
          description: position.description || '',
          departmentId: position.departmentId || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load position');
      } finally {
        setLoading(false);
      }
    };

    loadPosition();
  }, [posId]);

  // Load departments for select
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await getDepartments();
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (err) {
        // Handle error silently
      }
    };

    loadDepartments();
  }, []);

  const getDepartmentName = (deptId: string | undefined) => {
    if (!deptId) return 'N/A';
    const dept = departments.find((d) => d._id === deptId || d.id === deptId);
    return dept ? dept.name : 'N/A';
  };

  // EDIT POSITION
  const handleEditClick = () => {
    setIsEditingModal(true);
  };

  const handleSaveEdit = async () => {
    if (!position?._id) return;

    try {
      setActionLoading('edit');
      await updatePosition(position._id, editFormData);
      alert('Position updated successfully!');

      // Refresh position data
      const updated = await getPositionById(posId);
      setPosition(updated as Position);
      setIsEditingModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update position');
    } finally {
      setActionLoading(null);
    }
  };

  // DEACTIVATE POSITION
  const handleDeactivate = async () => {
    if (!position?._id) return;

    if (!window.confirm('Are you sure you want to deactivate this position?')) return;

    try {
      setActionLoading('deactivate');
      await deactivatePosition(position._id);
      alert('Position deactivated successfully!');

      // Refresh position data
      const updated = await getPositionById(posId);
      setPosition(updated as Position);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate position');
    } finally {
      setActionLoading(null);
    }
  };

  // DELETE POSITION
  const handleDelete = async () => {
    if (!position?._id) return;

    if (!window.confirm('Are you sure you want to delete this position? This action cannot be undone.')) return;

    try {
      setActionLoading('delete');
      const token = localStorage.getItem('token') || undefined;
      await deletePosition(position._id, token);
      alert('Position deleted successfully!');
      router.push('/dashboard/organization/positions');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete position');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="flex justify-center items-center py-12">
          <Loader size={40} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !position) {
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
            <p className="font-semibold text-red-400">{error || 'Position not found'}</p>
            <p className="text-red-300 text-sm">The position you are looking for does not exist.</p>
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
          Back to Positions
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">{position.title}</h1>
            <p className="text-gray-400 mt-2">Code: {position.code}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              position.isActive !== false
                ? 'bg-green-900/30 text-green-400 border border-green-700'
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}
          >
            {position.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Position Details Card */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Position Information</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Position ID</p>
                <p className="text-gray-300 font-mono text-sm">{position._id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Position Title</p>
                <p className="text-gray-300">{position.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Position Code</p>
                <p className="text-gray-300 font-mono">{position.code}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Department</p>
                <p className="text-gray-300">{getDepartmentName(position.departmentId)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-gray-300">{position.description || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-gray-300">{position.isActive !== false ? 'Active' : 'Inactive'}</p>
              </div>

              {position.createdAt && (
                <div>
                  <p className="text-sm text-gray-400">Created At</p>
                  <p className="text-gray-300">{new Date(position.createdAt).toLocaleDateString()}</p>
                </div>
              )}

              {position.updatedAt && (
                <div>
                  <p className="text-sm text-gray-400">Updated At</p>
                  <p className="text-gray-300">{new Date(position.updatedAt).toLocaleDateString()}</p>
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
              {position.isActive !== false && (
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1"></div>
      </div>

      {/* Edit Position Modal */}
      {isEditingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Edit Position</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Position Title *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Position Code *</label>
                <input
                  type="text"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="e.g., SE-001"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Department</label>
                <select
                  value={editFormData.departmentId}
                  onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Position description"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === 'edit'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  {actionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditingModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
