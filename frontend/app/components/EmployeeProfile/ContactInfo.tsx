'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactInfoProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  department?: string;
  jobTitle?: string;
}

export default function ContactInfo({
  firstName,
  lastName,
  email,
  phone,
  address,
  department,
  jobTitle,
}: ContactInfoProps) {
  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-gray-500" />
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm text-white">{email}</p>
          </div>
        </div>

        {phone && (
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm text-white">{phone}</p>
            </div>
          </div>
        )}

        {address && (
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm text-white">{address}</p>
            </div>
          </div>
        )}

        {(department || jobTitle) && (
          <>
            <hr className="border-[#333333]" />
            {department && (
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm text-white">{department}</p>
              </div>
            )}
            {jobTitle && (
              <div>
                <p className="text-xs text-gray-400">Job Title</p>
                <p className="text-sm text-white">{jobTitle}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
