'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import EmployeeStatusIndicator from '../../../../components/EmployeeProfile/EmployeeStatusIndicator';
import ContactInfo from '../../../../components/EmployeeProfile/ContactInfo';
import ProfessionalInfo from '../../../../components/EmployeeProfile/ProfessionalInfo';
import EmployeeDocuments from '../../../../components/EmployeeProfile/EmployeeDocuments';
import { Edit2, Save, X, User } from 'lucide-react';

interface Employee {
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
  startDate?: string;
  employeeNumber?: string;
  contractType?: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    url: string;
  }[];
}

export default function EmployeeFullDetailPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        const data = await response.json();
        setEmployee(data);
        setFormData(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!employee) return;
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        setEmployee(updatedEmployee);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Employee Profile" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading employee details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Employee Profile" description="Not found">
        <div className="text-center py-12 bg-[#2a2a2a] rounded-lg">
          <p className="text-gray-400">Employee not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Employee Profile"
      description={`${employee.firstName} ${employee.lastName}`}
    >
      {/* Header Section */}
      <div className="bg-[#2a2a2a] rounded-lg p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            {employee.profilePictureUrl ? (
              <img
                src={employee.profilePictureUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <User size={40} className="text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-gray-400 mb-4">{employee.jobTitle || 'Employee'}</p>
              {employee.status && (
                <EmployeeStatusIndicator status={employee.status as any} />
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

        {/* Biography */}
        {(employee.bio || isEditing) && (
          <div className="pt-6 border-t border-[#1a1a1a]">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Biography</p>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#333333] focus:border-blue-400 focus:outline-none"
              />
            ) : (
              <p className="text-gray-300">{employee.bio}</p>
            )}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Contact and Professional */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info - Editable */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a1a1a] text-white rounded px-2 py-1 border border-[#333333] focus:border-blue-400"
                  />
                ) : (
                  <p className="text-white">{employee.email}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a1a1a] text-white rounded px-2 py-1 border border-[#333333] focus:border-blue-400"
                  />
                ) : (
                  <p className="text-white">{employee.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Address</p>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-[#1a1a1a] text-white rounded px-2 py-1 border border-[#333333] focus:border-blue-400"
                  />
                ) : (
                  <p className="text-white">{employee.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          <ProfessionalInfo
            jobTitle={employee.jobTitle}
            department={employee.department}
            startDate={employee.startDate}
            managerId={employee.managerId}
            employeeNumber={employee.employeeNumber}
            contractType={employee.contractType}
          />
        </div>

        {/* Right Column - Status and Metadata */}
        <div className="lg:col-span-2">
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
            <div className="grid grid-cols-2 gap-6">
              {employee.createdAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Member Since</p>
                  <p className="text-gray-300 mt-1">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {employee.updatedAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Last Updated</p>
                  <p className="text-gray-300 mt-1">
                    {new Date(employee.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {employee.employeeNumber && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Employee ID</p>
                  <p className="text-gray-300 mt-1 font-mono">{employee.employeeNumber}</p>
                </div>
              )}
              {employee.status && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
                  <div className="mt-2">
                    <EmployeeStatusIndicator status={employee.status as any} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <EmployeeDocuments employeeId={employee.id} documents={employee.documents} />
    </DashboardLayout>
  );
}
