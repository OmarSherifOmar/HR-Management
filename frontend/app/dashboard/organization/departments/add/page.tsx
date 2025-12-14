'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createDepartment, getPositions, Position } from '@/app/lib/api/organizationService';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddDepartmentPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [error, setError] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    headPositionId: '',
  });
  
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadPositions = async () => {
      try {
        const data = await getPositions();
        setPositions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        // Handle error silently
      } finally {
        setLoadingPositions(false);
      }
    };

    loadPositions();
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setError('Code and Name are required');
      return;
    }

    try {
      setLoading(true);
      await createDepartment(formData);
      router.push('/dashboard/organization/departments');
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/organization/departments"
          className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Add Department</h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Code <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., ENG"
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Engineering"
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Department description..."
            rows={4}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Department Head Position</label>
          {loadingPositions ? (
            <div className="text-gray-400 py-2">Loading positions...</div>
          ) : (
            <select
              name="headPositionId"
              value={formData.headPositionId}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a position (optional)</option>
              {positions.map((pos) => (
                <option key={pos._id} value={pos._id}>
                  {pos.title} ({pos.code})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Department'}
          </button>
          <Link
            href="/dashboard/organization/departments"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
