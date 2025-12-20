'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import { createDepartment, getPositions, Position } from '@/app/lib/api/organizationService';

export default function CreateDepartmentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    headPositionId: '',
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load positions on mount
  useEffect(() => {
    const loadPositions = async () => {
      try {
        setLoadingPositions(true);
        const data = await getPositions();
        setPositions(data as Position[]);
      } catch (err) {
        // Handle error silently
      } finally {
        setLoadingPositions(false);
      }
    };

    loadPositions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      setError('Department code is required');
      return;
    }

    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createDepartment({
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        headPositionId: formData.headPositionId || undefined,
      });

      alert('Department created successfully!');
      router.push('/dashboard/organization/departments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

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

        <div>
          <h1 className="text-4xl font-bold">Create New Department</h1>
          <p className="text-gray-400 mt-2">Add a new department to your organization</p>
        </div>
      </div>

      {/* Create Form */}
      <div className="max-w-2xl">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., ENG, HR, SALES"
                className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Unique code for the department</p>
            </div>

            {/* Department Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Engineering, Human Resources"
                className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter department description..."
                rows={4}
                className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            {/* Head Position */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Head Position (Optional)</label>
              <select
                value={formData.headPositionId}
                onChange={(e) => setFormData({ ...formData, headPositionId: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading || loadingPositions}
              >
                <option value="">-- Select Position (Optional) --</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title} ({pos.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-700">
              <button
                type="submit"
                disabled={loading || loadingPositions}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Department'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
