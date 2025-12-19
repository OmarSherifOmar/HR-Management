'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, ShieldOff, Clock, CheckCircle, User, Mail, Key, Database } from 'lucide-react';

type AccessRevocation = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    workEmail?: string;
  };
  effectiveDate: Date;
  accessItems: {
    itemType: 'email' | 'system' | 'vpn' | 'database' | 'application';
    itemName: string;
    status: 'active' | 'revoked' | 'scheduled';
    revokedAt?: Date;
    revokedBy?: string;
  }[];
  overallStatus: 'pending' | 'in_progress' | 'completed';
  scheduledRevocationDate?: Date;
  createdAt: Date;
};

export default function AccessRevocationPage() {
  const { user } = useAuth();
  const [revocations, setRevocations] = useState<AccessRevocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevocation, setSelectedRevocation] = useState<AccessRevocation | null>(null);

  useEffect(() => {
    if (user?.role === 'System Admin') {
      fetchRevocations();
    }
  }, [user]);

  const fetchRevocations = async () => {
    try {
      const response = await fetch('http://localhost:3000/offboarding/access-revocation', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRevocations(data);
      }
    } catch (error) {
      console.error('Error fetching revocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (revocationId: string, itemType: string, itemName: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/offboarding/access-revocation/${revocationId}/revoke`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ itemType, itemName }),
        }
      );

      if (response.ok) {
        fetchRevocations();
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const revokeAllAccess = async (revocationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/offboarding/access-revocation/${revocationId}/revoke-all`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.ok) {
        fetchRevocations();
      }
    } catch (error) {
      console.error('Error revoking all access:', error);
    }
  };

  const getAccessIcon = (itemType: string) => {
    const icons = {
      email: <Mail className="text-blue-500" size={20} />,
      system: <Shield className="text-green-500" size={20} />,
      vpn: <Key className="text-purple-500" size={20} />,
      database: <Database className="text-orange-500" size={20} />,
      application: <Shield className="text-pink-500" size={20} />,
    };
    return icons[itemType as keyof typeof icons] || <Shield size={20} />;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-600', text: 'Active', icon: <Shield size={14} /> },
      revoked: { bg: 'bg-red-600', text: 'Revoked', icon: <ShieldOff size={14} /> },
      scheduled: { bg: 'bg-yellow-600', text: 'Scheduled', icon: <Clock size={14} /> },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getOverallStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-600', text: 'Pending', icon: <Clock size={14} /> },
      in_progress: { bg: 'bg-blue-600', text: 'In Progress', icon: <Clock size={14} /> },
      completed: { bg: 'bg-green-600', text: 'Completed', icon: <CheckCircle size={14} /> },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const calculateProgress = (accessItems: any[]) => {
    const total = accessItems.length;
    const revoked = accessItems.filter(item => item.status === 'revoked').length;
    return Math.round((revoked / total) * 100);
  };

  if (user?.role !== 'System Admin') {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Access Revocation"
      description="Manage system access revocation for exiting employees"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-white">{revocations.length}</p>
            </div>
            <Shield className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-white">
                {revocations.filter(r => r.overallStatus === 'pending').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-white">
                {revocations.filter(r => r.overallStatus === 'in_progress').length}
              </p>
            </div>
            <Clock className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">
                {revocations.filter(r => r.overallStatus === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Revocations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Access Revocation Requests</h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : revocations.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <Shield className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No revocation requests found</p>
          </div>
        ) : (
          revocations.map((revocation) => (
            <div
              key={revocation._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                    <User size={20} />
                    {revocation.employeeId.firstName} {revocation.employeeId.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {revocation.employeeId.employeeNumber}
                    {revocation.employeeId.workEmail && ` • ${revocation.employeeId.workEmail}`}
                  </p>
                </div>
                {getOverallStatusBadge(revocation.overallStatus)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Effective Date</p>
                  <p className="text-white">
                    {new Date(revocation.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
                {revocation.scheduledRevocationDate && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Scheduled Revocation</p>
                    <p className="text-white">
                      {new Date(revocation.scheduledRevocationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Revocation Progress</p>
                  <p className="text-white text-sm font-medium">
                    {calculateProgress(revocation.accessItems)}%
                  </p>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${calculateProgress(revocation.accessItems)}%` }}
                  />
                </div>
              </div>

              {/* Access Items */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-medium">Access Items</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {revocation.accessItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAccessIcon(item.itemType)}
                          <div>
                            <span className="text-white font-medium block">{item.itemName}</span>
                            <span className="text-gray-400 text-xs capitalize">{item.itemType}</span>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {item.status === 'revoked' && item.revokedBy && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-xs">
                            Revoked by {item.revokedBy}
                          </p>
                          <p className="text-gray-500 text-xs">
                            on {new Date(item.revokedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {item.status === 'active' && (
                        <button
                          onClick={() => revokeAccess(revocation._id, item.itemType, item.itemName)}
                          className="mt-2 w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <ShieldOff size={14} />
                          Revoke Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {revocation.overallStatus !== 'completed' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => revokeAllAccess(revocation._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <ShieldOff size={16} />
                    Revoke All Access
                  </button>
                  <button
                    onClick={() => setSelectedRevocation(revocation)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedRevocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Access Details - {selectedRevocation.employeeId.firstName} {selectedRevocation.employeeId.lastName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Employee Number</p>
                <p className="text-white">{selectedRevocation.employeeId.employeeNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Work Email</p>
                <p className="text-white">{selectedRevocation.employeeId.workEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                {getOverallStatusBadge(selectedRevocation.overallStatus)}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Progress</p>
                <p className="text-white text-lg font-semibold">
                  {calculateProgress(selectedRevocation.accessItems)}% Complete
                </p>
              </div>

              {/* Access Items Summary */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                <h5 className="text-white font-medium mb-3">Access Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Items</span>
                    <span className="text-white">{selectedRevocation.accessItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active</span>
                    <span className="text-green-400">
                      {selectedRevocation.accessItems.filter(i => i.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revoked</span>
                    <span className="text-red-400">
                      {selectedRevocation.accessItems.filter(i => i.status === 'revoked').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scheduled</span>
                    <span className="text-yellow-400">
                      {selectedRevocation.accessItems.filter(i => i.status === 'scheduled').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRevocation(null)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

