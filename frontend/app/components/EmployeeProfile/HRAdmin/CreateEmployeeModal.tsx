'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess?: () => void;
}

const GENDER_OPTIONS = ['MALE', 'FEMALE'];
const MARITAL_STATUS_OPTIONS = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const STATUS_OPTIONS = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RETIRED'];

export default function CreateEmployeeModal({ isOpen, onClose, onCreateSuccess }: CreateEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    nationalId: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    biography: '',

    // Contact Information
    personalEmail: '',
    workEmail: '',
    mobilePhone: '',
    homePhone: '',

    // Address
    address: {
      streetAddress: '',
      city: '',
      country: '',
    },

    // Employment Details
    jobTitle: '',
    department: '',
    contractType: '',
    workType: '',
    startDate: '',

    // Status
    status: 'ACTIVE',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      setLoading(false);
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      setLoading(false);
      return;
    }
    if (!formData.nationalId.trim()) {
      setError('National ID is required');
      setLoading(false);
      return;
    }
    if (!formData.personalEmail.trim() && !formData.workEmail.trim()) {
      setError('Personal Email or Work Email is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || undefined,
          nationalId: formData.nationalId,
          gender: formData.gender || undefined,
          maritalStatus: formData.maritalStatus || undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
          biography: formData.biography || undefined,
          personalEmail: formData.personalEmail || undefined,
          workEmail: formData.workEmail || undefined,
          mobilePhone: formData.mobilePhone || undefined,
          homePhone: formData.homePhone || undefined,
          address: {
            streetAddress: formData.address.streetAddress || undefined,
            city: formData.address.city || undefined,
            country: formData.address.country || undefined,
          },
          jobTitle: formData.jobTitle || undefined,
          department: formData.department || undefined,
          contractType: formData.contractType || undefined,
          workType: formData.workType || undefined,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create employee');
      }

      onCreateSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        nationalId: '',
        gender: '',
        maritalStatus: '',
        dateOfBirth: '',
        biography: '',
        personalEmail: '',
        workEmail: '',
        mobilePhone: '',
        homePhone: '',
        address: {
          streetAddress: '',
          city: '',
          country: '',
        },
        jobTitle: '',
        department: '',
        contractType: '',
        workType: '',
        startDate: '',
        status: 'ACTIVE',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-white">Create New Employee</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Middle Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  National ID *
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="National ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Marital Status
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select Marital Status</option>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Biography
              </label>
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                placeholder="Enter biography"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Personal Email *
                </label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="personal@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="work@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  name="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Mobile Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Home Phone
                </label>
                <input
                  type="tel"
                  name="homePhone"
                  value={formData.homePhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Home Phone"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.address.streetAddress}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Street Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.address.country}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Employment Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Job Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contract Type
                </label>
                <input
                  type="text"
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Contract Type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Work Type
                </label>
                <input
                  type="text"
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Work Type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-blue-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
