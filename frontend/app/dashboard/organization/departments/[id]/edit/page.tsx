'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { getDepartments, updateDepartment, Department, getPositions, Position } from '@/app/lib/api/organizationService';
import { ChevronLeft } from 'lucide-react';

export default function EditDepartmentPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    headPositionId: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadDepartment = async () => {
      try {
        setLoading(true);
        
        const [departments, posData] = await Promise.all([
          getDepartments(undefined, false),
          getPositions(),
        ]);
        
        const dept = departments.find((d: Department) => d._id === id);
        
        if (!dept) throw new Error('Department not found');
        
        setDepartment(dept);
        setPositions(Array.isArray(posData) ? posData : []);
        setFormData({
          code: dept.code,
          name: dept.name,
          description: dept.description || '',
          headPositionId: dept.headPositionId || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
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
    
    if (!formData.code.trim() || !formData.name.trim()) {
      setError('Code and name are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await updateDepartment(id, formData);
      router.push('/dashboard/organization/departments');
    } catch (err: any) {
      setError(err.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading department...</div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Department not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/organization/departments" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors">
        <ChevronLeft size={20} />
        Back to Departments
      </Link>

      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Edit Department</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Department Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g., HR, IT, SALES"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Department Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Human Resources"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description for this department"
              rows={4}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Department Head Position</label>
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
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? 'Updating...' : 'Update Department'}
            </button>
            <Link
              href="/dashboard/organization/departments"
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
