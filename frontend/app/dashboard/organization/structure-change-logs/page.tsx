'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { getStructureChangeLogs } from '../../../lib/api/organizationService';

export default function StructureChangeLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStructureChangeLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Structure Change Logs"
      description="View all organizational structure changes"
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
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Loader size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">All Structure Change Logs</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size={40} className="animate-spin text-blue-500" />
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Entity Type</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Performed By</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Summary</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-gray-700 hover:bg-[#222222] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.performedByEmployeeId?.firstName} {log.performedByEmployeeId?.lastName}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">
                        {log.summary || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No logs found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
