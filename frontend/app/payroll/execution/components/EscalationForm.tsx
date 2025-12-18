"use client";

import { useState, useEffect } from 'react';
import { authenticatedFetch, useAuth } from '../../../context/AuthContext';
import { useSearchParams } from 'next/navigation';

interface Props {
  employeePayrollDetailId?: string;
  onSuccess?: () => void;
}

export default function EscalationForm({ employeePayrollDetailId = '', onSuccess }: Props) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [detailId, setDetailId] = useState(employeePayrollDetailId);
  useEffect(() => {
    // If ?detailId= is provided in the URL, prefill the input
    const q = searchParams?.get?.('detailId');
    if (q) setDetailId(q);
  }, [searchParams]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!detailId.trim()) {
      setError('Employee payroll detail ID is required');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the irregularity');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        employeePayrollDetailId: detailId.trim(),
        irregularityDescription: description.trim(),
        escalationNotes: notes.trim() || undefined,
      } as any;

      const res = await authenticatedFetch('http://localhost:3000/payroll-execution/irregularities/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = `Error ${res.status}: ${res.statusText}`;
        try {
          const data = await res.json();
          message = data.message || data.error || message;
        } catch (_) {}
        throw new Error(message);
      }

      setSuccess('Irregularity escalated successfully');
      setDescription('');
      setNotes('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to escalate irregularity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl">
      <h3 className="text-lg font-bold text-white mb-3">Escalate Irregularity</h3>

      {error && <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-600/20 border border-green-600 text-green-300 px-4 py-2 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Employee Payroll Detail ID</label>
          {detailId ? (
            <div className="text-sm text-gray-200 mb-2">Prefilled ID: <span className="text-xs text-gray-400">{detailId}</span></div>
          ) : null}
          <input
            value={detailId}
            onChange={(e) => setDetailId(e.target.value)}
            placeholder="Enter employee payroll detail ID"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Irregularity Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the irregularity detected (required)"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Escalation Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional context for the manager"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded disabled:opacity-60"
          >
            {loading ? 'Escalating...' : 'Escalate'}
          </button>
          <div className="flex-1 text-sm text-gray-400 self-center">{user?.sub ? `You: ${user.sub}` : ''}</div>
        </div>
      </form>
    </div>
  );
}
