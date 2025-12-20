'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, Building2, User, Calendar, FileText, Edit2, Save, X } from 'lucide-react';

interface EmployeeDetailViewProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    jobTitle?: string;
    department?: string;
    profilePictureUrl?: string;
    status?: string;
    bio?: string;
    createdAt?: string;
    updatedAt?: string;
    managerId?: string;
  };
}

export default function EmployeeDetailView({ employee }: EmployeeDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(employee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // API call to update employee
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-600 text-white';
      case 'ON_LEAVE':
        return 'bg-yellow-600 text-white';
      case 'SUSPENDED':
        return 'bg-red-600 text-white';
      case 'RETIRED':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[#1a1a1a]">
        <div className="flex items-start gap-6">
          {formData.profilePictureUrl ? (
            <img
              src={formData.profilePictureUrl}
              alt={`${formData.firstName} ${formData.lastName}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <User size={40} className="text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-gray-400 mb-4">{formData.jobTitle || 'Employee'}</p>
            {formData.status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-blue-400"
        >
          {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
        </button>
        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(employee);
            }}
            className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors text-red-400"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1 text-gray-300">
                  <Mail size={16} className="text-gray-500" />
                  <p>{formData.email}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1 text-gray-300">
                  <Phone size={16} className="text-gray-500" />
                  <p>{formData.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1 text-gray-300">
                  <MapPin size={16} className="text-gray-500" />
                  <p>{formData.address || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Professional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Job Title</label>
              {isEditing ? (
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle || ''}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1 text-gray-300">
                  <Briefcase size={16} className="text-gray-500" />
                  <p>{formData.jobTitle || 'Not specified'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Department</label>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="w-full mt-1 bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1 text-gray-300">
                  <Building2 size={16} className="text-gray-500" />
                  <p>{formData.department || 'Not specified'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Manager ID</label>
              <div className="flex items-center gap-2 mt-1 text-gray-300">
                <User size={16} className="text-gray-500" />
                <p>{formData.managerId || 'No manager assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biography */}
      {formData.bio && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Biography</h2>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
            />
          ) : (
            <p className="text-gray-300">{formData.bio}</p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#1a1a1a]">
        {formData.createdAt && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Created</p>
            <p className="text-gray-300 mt-1">{new Date(formData.createdAt).toLocaleDateString()}</p>
          </div>
        )}
        {formData.updatedAt && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Last Updated</p>
            <p className="text-gray-300 mt-1">{new Date(formData.updatedAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
