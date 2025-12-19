'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { getPositions, getDepartments, updatePosition, Position, Department } from '@/app/lib/api/organizationService';
import { ChevronLeft } from 'lucide-react';

export default function EditPositionPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [position, setPosition] = useState<Position | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    departmentId: '',
    reportsToPositionId: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        const [deptList, posList] = await Promise.all([
          getDepartments(undefined, false),
          getPositions(undefined, {}),
        ]);
        
        const positions = posList as Position[];
        const pos = positions.find((p: Position) => p._id === id);
        if (!pos) throw new Error('Position not found');
        
        setPosition(pos);
        setDepartments(deptList as Department[]);
        setPositions(positions);
        setFormData({
          code: pos.code,
          title: pos.title,
          description: pos.description || '',
          departmentId: pos.departmentId || '',
          reportsToPositionId: pos.reportsToPositionId || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load position');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isLoggedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.title.trim() || !formData.departmentId) {
      setError('Code, title, and department are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await updatePosition(id, formData);
      router.push('/dashboard/organization/positions');
    } catch (err: any) {
      setError(err.message || 'Failed to update position');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading position...</div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Position not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/organization/positions" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors">
        <ChevronLeft size={20} />
        Back to Positions
      </Link>

      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Edit Position</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g., MANAGER, DEVELOPER"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Project Manager"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description for this position"
              rows={4}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Reports To Position</label>
            <select
              name="reportsToPositionId"
              value={formData.reportsToPositionId}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No reporting relationship</option>
              {positions
                .filter((p) => p._id !== id)
                .map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? 'Updating...' : 'Update Position'}
            </button>
            <Link
              href="/dashboard/organization/positions"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
