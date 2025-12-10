'use client';

import { useAuth } from '../../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Tag, Folder } from 'lucide-react';

type LeaveCategory = {
  _id: string;
  name: string;
  description: string;
};

type AttachmentType = 'MEDICAL_CERTIFICATE' | 'SUPPORTING_DOCUMENT' | 'PROOF_OF_EVENT' | 'TRAVEL_DOCUMENT' | 'OTHER';

export default function CreateLeaveTypePage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formType = searchParams.get('type') || 'type'; // 'type' or 'category'
  const editId = searchParams.get('id');
  
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Leave Type fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [paid, setPaid] = useState(true);
  const [deductible, setDeductible] = useState(true);
  const [requiresAttachment, setRequiresAttachment] = useState(false);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('OTHER');
  const [minTenureMonths, setMinTenureMonths] = useState<number | ''>('');
  const [maxDurationDays, setMaxDurationDays] = useState<number | ''>('');

  // Category fields
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (isLoggedIn && user?.role === 'HR Admin' && formType === 'type') {
      fetchCategories();
    }

    if (editId) {
      fetchExistingData();
    }
  }, [isLoading, isLoggedIn, user, router, formType, editId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/leaves/types/categories', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchExistingData = async () => {
    try {
      setLoading(true);
      const endpoint = formType === 'type' 
        ? `http://localhost:3001/leaves/types/${editId}`
        : `http://localhost:3001/leaves/types/categories/${editId}`;

      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      if (formType === 'type') {
        setCode(data.code || '');
        setName(data.name || '');
        setCategoryId(typeof data.categoryId === 'string' ? data.categoryId : data.categoryId?._id || '');
        setDescription(data.description || '');
        setPaid(data.paid ?? true);
        setDeductible(data.deductible ?? true);
        setRequiresAttachment(data.requiresAttachment ?? false);
        setAttachmentType(data.attachmentType || 'OTHER');
        setMinTenureMonths(data.minTenureMonths || '');
        setMaxDurationDays(data.maxDurationDays || '');
      } else {
        setCategoryName(data.name || '');
        setCategoryDescription(data.description || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        code,
        name,
        categoryId,
        description: description || undefined,
        paid,
        deductible,
        requiresAttachment,
        attachmentType: requiresAttachment ? attachmentType : undefined,
        minTenureMonths: minTenureMonths !== '' ? Number(minTenureMonths) : undefined,
        maxDurationDays: maxDurationDays !== '' ? Number(maxDurationDays) : undefined,
      };

      const url = editId 
        ? `http://localhost:3001/leaves/types/${editId}`
        : 'http://localhost:3001/leaves/types';
      
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save leave type');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/leave-types');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save leave type');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: categoryName,
        description: categoryDescription || undefined,
      };

      const url = editId 
        ? `http://localhost:3001/leaves/types/categories/${editId}`
        : 'http://localhost:3001/leaves/types/categories';
      
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/leave-types');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (editId && loading)) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {formType === 'type' ? <Tag className="text-green-500" size={28} /> : <Folder className="text-blue-500" size={28} />}
              {editId ? 'Edit' : 'Create'} {formType === 'type' ? 'Leave Type' : 'Category'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {formType === 'type' 
                ? 'Define a new leave type with its properties and requirements'
                : 'Create a category to group related leave types'
              }
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400">
            {formType === 'type' ? 'Leave type' : 'Category'} saved successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {formType === 'type' ? (
            <form onSubmit={handleSubmitType} className="space-y-6">
              {/* Code & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Leave Type Code *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="e.g., AL, SL, ML"
                    required
                    disabled={!!editId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Leave Type Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="e.g., Annual Leave"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  rows={3}
                  placeholder="Describe this leave type..."
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-300">Paid Leave</span>
                  <button
                    type="button"
                    onClick={() => setPaid(!paid)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      paid ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        paid ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-300">Deductible from Balance</span>
                  <button
                    type="button"
                    onClick={() => setDeductible(!deductible)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      deductible ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        deductible ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Attachment Requirements */}
              <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-4">
                  <span className="text-sm text-gray-300">Requires Attachment</span>
                  <button
                    type="button"
                    onClick={() => setRequiresAttachment(!requiresAttachment)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      requiresAttachment ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        requiresAttachment ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {requiresAttachment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Attachment Type
                    </label>
                    <select
                      value={attachmentType}
                      onChange={(e) => setAttachmentType(e.target.value as AttachmentType)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
                      <option value="SUPPORTING_DOCUMENT">Supporting Document</option>
                      <option value="PROOF_OF_EVENT">Proof of Event</option>
                      <option value="TRAVEL_DOCUMENT">Travel Document</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Duration & Tenure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Tenure (months)
                  </label>
                  <input
                    type="number"
                    value={minTenureMonths}
                    onChange={(e) => setMinTenureMonths(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum months of employment required</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Duration (days)
                  </label>
                  <input
                    type="number"
                    value={maxDurationDays}
                    onChange={(e) => setMaxDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="Unlimited"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum consecutive days allowed</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : editId ? 'Update' : 'Create'} Leave Type
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitCategory} className="space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Paid Leaves, Unpaid Leaves"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Describe this category..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : editId ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
