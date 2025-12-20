'use client';

import { Briefcase, Clock, Calendar } from 'lucide-react';

interface ProfessionalInfoProps {
  jobTitle?: string;
  department?: string;
  startDate?: string;
  managerId?: string;
  employeeNumber?: string;
  contractType?: string;
}

export default function ProfessionalInfo({
  jobTitle,
  department,
  startDate,
  managerId,
  employeeNumber,
  contractType,
}: ProfessionalInfoProps) {
  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Professional Information</h3>
      <div className="space-y-3">
        {jobTitle && (
          <div className="flex items-center gap-3">
            <Briefcase size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-400">Job Title</p>
              <p className="text-sm text-white">{jobTitle}</p>
            </div>
          </div>
        )}

        {department && (
          <div>
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm text-white">{department}</p>
          </div>
        )}

        {startDate && (
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-400">Start Date</p>
              <p className="text-sm text-white">
                {new Date(startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {employeeNumber && (
          <div>
            <p className="text-xs text-gray-400">Employee ID</p>
            <p className="text-sm text-white font-mono">{employeeNumber}</p>
          </div>
        )}

        {managerId && (
          <div>
            <p className="text-xs text-gray-400">Manager ID</p>
            <p className="text-sm text-white">{managerId}</p>
          </div>
        )}

        {contractType && (
          <div>
            <p className="text-xs text-gray-400">Contract Type</p>
            <p className="text-sm text-white">{contractType}</p>
          </div>
        )}
      </div>
    </div>
  );
}
