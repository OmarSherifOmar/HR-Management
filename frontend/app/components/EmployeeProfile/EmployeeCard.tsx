'use client';

import { Users, Mail, Phone, MapPin, Briefcase, User } from 'lucide-react';
import Link from 'next/link';

interface EmployeeCardProps {
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
}

export default function EmployeeCard({
  id,
  firstName,
  lastName,
  email,
  phone,
  address,
  jobTitle,
  department,
  profilePictureUrl,
  status,
}: EmployeeCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-600';
      case 'ON_LEAVE':
        return 'bg-yellow-600';
      case 'SUSPENDED':
        return 'bg-red-600';
      case 'RETIRED':
        return 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <Link href={`/dashboard/employees/${id}`}>
      <div className="bg-[#2a2a2a] rounded-lg p-6 hover:bg-[#333333] transition-colors cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={`${firstName} ${lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-white font-semibold">
                {firstName} {lastName}
              </h3>
              <p className="text-xs text-gray-400">{jobTitle || 'Employee'}</p>
            </div>
          </div>
          {status && (
            <span
              className={`text-xs px-2 py-1 rounded-full text-white font-medium ${getStatusColor(
                status
              )}`}
            >
              {status}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {email && (
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={16} className="text-gray-500" />
              <span className="truncate">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={16} className="text-gray-500" />
              <span>{phone}</span>
            </div>
          )}
          {department && (
            <div className="flex items-center gap-2 text-gray-300">
              <Briefcase size={16} className="text-gray-500" />
              <span>{department}</span>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={16} className="text-gray-500" />
              <span className="truncate">{address}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <button className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
            View Profile →
          </button>
        </div>
      </div>
    </Link>
  );
}
