'use client';

import { useState, useEffect } from 'react';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import {
  Lock,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Check,
} from 'lucide-react';

interface RoleDocument {
  _id: string;
  employeeProfileId: string;
  roles: string[];
  isActive: boolean;
}

const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const AVAILABLE_ROLES = [
  'department employee',
  'department head',
  'HR Manager',
  'HR Employee',
  'Payroll Specialist',
  'System Admin',
  'Legal & Policy Admin',
  'Recruiter',
  'Finance Staff',
  'Job Candidate',
  'HR Admin',
  'Payroll Manager',
];

export default function HRRoleAssignment({
  employeeId,
  onClose,
}: {
  employeeId: string;
  onClose?: () => void;
}) {
  const { canAssignRoles } = useCanAccess();
  const [roleDoc, setRoleDoc] = useState<RoleDocument | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (employeeId && canAssignRoles()) {
      fetchRoles();
    }
  }, [employeeId]);

  const fetchRoles = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${URL}/employees/${employeeId}/roles`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoleDoc(data);
      setSelectedRoles(data.roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${URL}/employees/${employeeId}/roles`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roles: selectedRoles,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign roles');
      }

      setSuccess('Roles assigned successfully!');
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RoleBasedAccess requiredAccess={canAssignRoles}>
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Assign Roles</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#333333] rounded transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={24} className="text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Roles */}
            {roleDoc && (
              <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-2">Current Roles:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.length === 0 ? (
                    <p className="text-gray-500 text-sm">No roles assigned</p>
                  ) : (
                    selectedRoles.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                      >
                        {role}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Available Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Select Roles
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {AVAILABLE_ROLES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded border border-gray-600 hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="w-4 h-4 rounded border-gray-600 bg-[#2a2a2a] text-blue-600 focus:outline-none"
                    />
                    <span className="text-white text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Check size={16} />
                {isSaving ? 'Saving...' : 'Save Roles'}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </RoleBasedAccess>
  );
}
