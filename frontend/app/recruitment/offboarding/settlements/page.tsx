'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Calendar, CheckCircle, Clock, Send, FileText } from 'lucide-react';

type Settlement = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  clearanceId: string;
  settlementDetails: {
    unusedLeaveBalance: number;
    leaveEncashment: number;
    finalSalary: number;
    deductions: number;
    totalAmount: number;
  };
  benefitsTerminationDate?: Date;
  paymentStatus: 'pending' | 'processing' | 'completed';
  paymentDate?: Date;
  createdAt: Date;
};

export default function SettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  useEffect(() => {
    if (user?.role === 'HR Manager' || user?.role === 'HR Admin') {
      fetchSettlements();
    }
  }, [user]);

  const fetchSettlements = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/offboarding/settlement`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSettlement = async (clearanceId: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/offboarding/settlement/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clearanceId }),
      });

      if (response.ok) {
        fetchSettlements();
      }
    } catch (error) {
      console.error('Error triggering settlement:', error);
    }
  };

  const processPayment = async (settlementId: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${URL}/offboarding/settlement/${settlementId}/process`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        fetchSettlements();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-600', text: 'Pending', icon: <Clock size={14} /> },
      processing: { bg: 'bg-blue-600', text: 'Processing', icon: <Clock size={14} /> },
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

  if (user?.role !== 'HR Manager' && user?.role !== 'HR Admin') {
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
      title="Exit Settlements"
      description="Manage final settlements and benefits termination"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Settlements</p>
              <p className="text-3xl font-bold text-white">{settlements.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-white">
                {settlements.filter(s => s.paymentStatus === 'pending').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Processing</p>
              <p className="text-3xl font-bold text-white">
                {settlements.filter(s => s.paymentStatus === 'processing').length}
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
                {settlements.filter(s => s.paymentStatus === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Settlements List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Settlement Records</h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : settlements.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-700 text-center">
            <DollarSign className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400">No settlement records found</p>
          </div>
        ) : (
          settlements.map((settlement) => (
            <div
              key={settlement._id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">
                    {settlement.employeeId.firstName} {settlement.employeeId.lastName}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {settlement.employeeId.employeeNumber}
                  </p>
                </div>
                {getStatusBadge(settlement.paymentStatus)}
              </div>

              {/* Settlement Breakdown */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 mb-4">
                <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                  <DollarSign size={18} />
                  Settlement Breakdown
                </h5>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Unused Leave Balance</span>
                    <span className="text-white font-medium">
                      {settlement.settlementDetails.unusedLeaveBalance} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Leave Encashment</span>
                    <span className="text-green-400 font-medium">
                      ${settlement.settlementDetails.leaveEncashment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Final Salary</span>
                    <span className="text-green-400 font-medium">
                      ${settlement.settlementDetails.finalSalary.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Deductions</span>
                    <span className="text-red-400 font-medium">
                      -${settlement.settlementDetails.deductions.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total Amount</span>
                      <span className="text-blue-400 font-bold text-lg">
                        ${settlement.settlementDetails.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Termination */}
              {settlement.benefitsTerminationDate && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                    <Calendar size={16} />
                    Benefits Termination Date
                  </p>
                  <p className="text-white">
                    {new Date(settlement.benefitsTerminationDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Payment Info */}
              {settlement.paymentDate && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Payment Date</p>
                  <p className="text-white">
                    {new Date(settlement.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                {settlement.paymentStatus === 'pending' && (
                  <button
                    onClick={() => processPayment(settlement._id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Send size={16} />
                    Process Payment
                  </button>
                )}
                <button
                  onClick={() => setSelectedSettlement(settlement)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Settlement Details - {selectedSettlement.employeeId.firstName} {selectedSettlement.employeeId.lastName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Employee Number</p>
                <p className="text-white">{selectedSettlement.employeeId.employeeNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                {getStatusBadge(selectedSettlement.paymentStatus)}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Created Date</p>
                <p className="text-white">
                  {new Date(selectedSettlement.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Full Settlement Breakdown */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                <h5 className="text-white font-medium mb-3">Complete Breakdown</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unused Leave</span>
                    <span className="text-white">
                      {selectedSettlement.settlementDetails.unusedLeaveBalance} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Leave Encashment</span>
                    <span className="text-green-400">
                      ${selectedSettlement.settlementDetails.leaveEncashment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final Salary</span>
                    <span className="text-green-400">
                      ${selectedSettlement.settlementDetails.finalSalary.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deductions</span>
                    <span className="text-red-400">
                      -${selectedSettlement.settlementDetails.deductions.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-blue-400">
                      ${selectedSettlement.settlementDetails.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSettlement(null)}
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

