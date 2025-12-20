"use client";

import { useEffect, useState } from 'react';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';

interface EscalationItem {
  _id: string;
  employeeId?: any;
  payrollRunId?: any;
  exceptions?: string;
}

export default function EscalationsList({ payrollRunId }: { payrollRunId?: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  const fetchEscalations = async () => {
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    try {
      setLoading(true);
      setError(null);
      const endpoint = payrollRunId
        ? `${URL}/payroll-execution/irregularities/escalated/${payrollRunId}`
        : `${URL}/payroll-execution/irregularities/escalated`;

      const res = await authenticatedFetch(endpoint, { method: 'GET' });
      if (!res.ok) throw new Error(`Failed to fetch escalations: ${res.status}`);
      const data = await res.json();
      setItems((data || []) as EscalationItem[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [payrollRunId]);

  const openResolveModal = (id: string, initialStatus: 'resolved' | 'dismissed' = 'resolved') => {
    setResolvingId(id);
    setResolutionStatus(initialStatus);
    setResolutionNotes('');
    setResolveError(null);
    setModalOpen(true);
  };

  const submitResolution = async () => {
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!resolvingId) return setResolveError('No escalation selected');
    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      return setResolveError('Resolution notes must be at least 10 characters');
    }

    try {
      setResolveLoading(true);
      const payload: any = {
        employeePayrollDetailId: resolvingId,
        // managerId is optional — if the client doesn't have it the backend will fallback to req.user
        managerId: user?.sub || undefined,
        resolutionNotes: resolutionNotes.trim(),
        status: resolutionStatus,
      };

      const res = await authenticatedFetch(`${URL}/payroll-execution/irregularities/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to resolve');
      }

      // Close modal and refresh — keep item in list (server will mark it resolved/dismissed)
      setModalOpen(false);
      setResolvingId(null);
      setResolutionNotes('');
      await fetchEscalations();
    } catch (err: any) {
      setResolveError(err.message || 'Action failed');
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) return <div className="py-6">Loading escalations...</div>;
  if (error) return <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded">{error}</div>;

  return (
    <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] border-b border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Employee</th>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Payroll Run</th>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Exceptions</th>
              <th className="px-4 py-3 text-right text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {/* Open / unresolved escalations first */}
            {items.filter((it) => !(it.exceptions && (it.exceptions.includes('[RESOLVED]') || it.exceptions.includes('[DISMISSED]')))).map((it) => (
              <tr key={it._id} className="hover:bg-[#333333]">
                <td className="px-4 py-3 text-sm text-gray-300">
                  {it.employeeId ? `${it.employeeId.firstName || ''} ${it.employeeId.lastName || ''}`.trim() : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{it.payrollRunId?.runId || '—'}</td>
                <td className="px-4 py-3 text-sm text-yellow-300 whitespace-pre-wrap">{it.exceptions}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openResolveModal(it._id, 'resolved')}
                      disabled={!!actionLoading}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => openResolveModal(it._id, 'dismissed')}
                      disabled={!!actionLoading}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(it._id);
                          // eslint-disable-next-line no-alert
                          alert('Escalation Detail ID copied to clipboard');
                        } catch (e) {
                          // eslint-disable-next-line no-alert
                          alert('Failed to copy ID');
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Copy ID
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Separator / header for resolved/dismissed */}
            {items.filter((it) => it.exceptions && (it.exceptions.includes('[RESOLVED]') || it.exceptions.includes('[DISMISSED]'))).length > 0 && (
              <tr className="bg-[#0f1720]">
                <td colSpan={4} className="px-4 py-2 text-sm text-gray-300 font-semibold">Resolved / Dismissed</td>
              </tr>
            )}

            {/* Resolved / dismissed items */}
            {items.filter((it) => it.exceptions && (it.exceptions.includes('[RESOLVED]') || it.exceptions.includes('[DISMISSED]'))).map((it) => (
              <tr key={it._id} className="opacity-80 hover:bg-[#2b2b2b]">
                <td className="px-4 py-3 text-sm text-gray-300">
                  {it.employeeId ? `${it.employeeId.firstName || ''} ${it.employeeId.lastName || ''}`.trim() : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{it.payrollRunId?.runId || '—'}</td>
                <td className="px-4 py-3 text-sm text-yellow-300 whitespace-pre-wrap">
                  {it.exceptions}
                  {it.exceptions && (it.exceptions.includes('[RESOLVED]') || it.exceptions.includes('[DISMISSED]')) && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-800/60 text-green-200">
                      {it.exceptions.includes('[RESOLVED]') ? 'Resolved' : 'Dismissed'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(it._id);
                          // eslint-disable-next-line no-alert
                          alert('Escalation Detail ID copied to clipboard');
                        } catch (e) {
                          // eslint-disable-next-line no-alert
                          alert('Failed to copy ID');
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Copy ID
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty state when no escalations at all */}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No escalated irregularities found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Resolution Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Resolve Escalation</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400">Close</button>
            </div>

            {resolveError && <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded mb-4">{resolveError}</div>}

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Resolution Status</label>
              <select value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value as any)} className="w-full px-3 py-2 bg-[#111111] border border-gray-700 rounded text-white">
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Resolution Notes</label>
              <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#111111] border border-gray-700 rounded text-white" placeholder="Enter detailed resolution notes (min 10 chars)" />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
              <button onClick={submitResolution} disabled={resolveLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">{resolveLoading ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
