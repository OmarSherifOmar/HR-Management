'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddEmployeeFormProps {
  onCancel?: () => void;
}

export default function AddEmployeeForm({ onCancel }: AddEmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    jobTitle: '',
    department: '',
    bio: '',
    status: 'ACTIVE',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/employees');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create employee');
      }
    } catch (error) {
      setError('Error creating employee');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-8">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#1a1a1a]">
        <h1 className="text-2xl font-bold text-white">Add New Employee</h1>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-red-400"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-400 block mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div>
          <label className="text-sm text-gray-400 block mb-2">Biography</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
            placeholder="Write a brief bio about the employee..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-[#1a1a1a]">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
          >
            <Save size={20} />
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#333333] transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
