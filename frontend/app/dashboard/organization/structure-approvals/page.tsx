'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { getStructureApprovals } from '../../../lib/api/organizationService';

export default function StructureApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStructureApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'REJECTED':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border border-gray-700';
    }
  };

  return (
    <DashboardLayout
      title="Structure Approvals"
      description="View all structure approvals"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={loadApprovals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Loader size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">All Structure Approvals</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size={40} className="animate-spin text-blue-500" />
            </div>
          ) : approvals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Request</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Approver</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Decision</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Comments</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Decided At</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval) => (
                    <tr key={approval._id} className="border-b border-gray-700 hover:bg-[#222222] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {approval.changeRequestId?.requestNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {approval.approverEmployeeId?.firstName} {approval.approverEmployeeId?.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${getDecisionColor(approval.decision)}`}>
                          {approval.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">
                        {approval.comments || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {approval.decidedAt ? new Date(approval.decidedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No approvals found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
