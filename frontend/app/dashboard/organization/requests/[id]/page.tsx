'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { getChangeRequestById, ChangeRequest } from '@/app/lib/api/organizationService';

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getChangeRequestById(requestId);
        setRequest((data as ChangeRequest) || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-900/30 text-gray-300 border border-gray-700';
      case 'SUBMITTED':
        return 'bg-blue-900/30 text-blue-400 border border-blue-700';
      case 'UNDER_REVIEW':
        return 'bg-purple-900/30 text-purple-400 border border-purple-700';
      case 'APPROVED':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'REJECTED':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      case 'IMPLEMENTED':
        return 'bg-green-900/50 text-green-300 border border-green-600';
      default:
        return 'bg-gray-900/30 text-gray-400 border border-gray-700';
    }
  };

  return (
    <DashboardLayout
      title="Change Request Details"
      description="View change request information"
    >
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="mt-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={40} className="animate-spin text-blue-500" />
          </div>
        ) : request ? (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Request Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Request Number</p>
                    <p className="text-lg text-white font-semibold">{request.requestNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Request Type</p>
                    <p className="text-lg text-white font-semibold">{request.requestType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <div className="inline-block">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(request.status || 'DRAFT')}`}>
                        {request.status || 'DRAFT'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Created</p>
                    <p className="text-white">
                      {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {request.updatedAt && (
                    <div>
                      <p className="text-gray-400 mb-1">Last Updated</p>
                      <p className="text-white">{new Date(request.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Reason</h3>
              <p className="text-gray-300 mb-6">{request.reason || 'No reason provided'}</p>

              {request.description && (
                <>
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-gray-300 mb-6">{request.description}</p>
                </>
              )}

              {request.details && (
                <>
                  <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>
                  <div className="bg-[#0a0a0a] border border-gray-700 rounded p-4 overflow-auto max-h-64">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                      {typeof request.details === 'string'
                        ? request.details
                        : JSON.stringify(request.details, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">Request not found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
