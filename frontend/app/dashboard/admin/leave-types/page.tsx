'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Folder, AlertCircle } from 'lucide-react';

type LeaveCategory = {
  _id: string;
  name: string;
  description: string;
  isPaid: boolean;
};

type LeaveType = {
  _id: string;
  name: string;
  code: string;
  description: string;
  category: LeaveCategory | string;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  documentRequiredAfterDays?: number;
  color: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminLeaveTypesPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'categories'>('types');

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
      fetchLeaveTypes();
      fetchCategories();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/leaves/types', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave types');
      }

      const data = await response.json();
      setLeaveTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/types/categories', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const deleteLeaveType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/leaves/types/${typeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete leave type');
      }

      setLeaveTypes(leaveTypes.filter(t => t._id !== typeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete leave type');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/leaves/types/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(categories.filter(c => c._id !== categoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Tag className="text-green-500" size={28} />
              Leave Types & Categories
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Define and manage leave types available in the system
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/admin/leave-types/create?type=${activeTab === 'types' ? 'type' : 'category'}`)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create {activeTab === 'types' ? 'Leave Type' : 'Category'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'types'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leave Types ({leaveTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Leave Types Tab */}
        {activeTab === 'types' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveTypes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Tag size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No leave types configured yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Click "Create Leave Type" to get started
                </p>
              </div>
            ) : (
              leaveTypes.map((type) => (
                <div
                  key={type._id}
                  className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <h3 className="text-lg font-semibold text-white">
                          {type.name}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        {type.code}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/admin/leave-types/create?type=type&id=${type._id}`)}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title="Edit Leave Type"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteLeaveType(type._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete Leave Type"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {type.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {type.category && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                          {typeof type.category === 'string' ? type.category : type.category.name}
                        </span>
                      )}
                      {type.isPaid && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                          Paid
                        </span>
                      )}
                      {!type.isPaid && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-400">
                          Unpaid
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {type.requiresApproval && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400">
                          Requires Approval
                        </span>
                      )}
                      {type.requiresDocument && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400">
                          Document Required
                        </span>
                      )}
                      {!type.isActive && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Folder size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No categories configured yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Click "Create Category" to get started
                </p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-all border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {category.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/admin/leave-types/create?type=category&id=${category._id}`)}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400">
                    {category.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      {leaveTypes.filter(t => t.category && (typeof t.category === 'string' ? t.category === category._id : t.category._id === category._id)).length} leave types
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
