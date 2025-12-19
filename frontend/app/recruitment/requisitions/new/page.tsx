'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Manager = {
  _id: string;
  firstName: string;
  lastName: string;
  roles: string[];
};

export default function CreateRequisitionPage() {
  const router = useRouter();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    requisitionId: `REQ-${Date.now()}`,
    openings: 1,
    location: '',
    hiringManagerId: '',
  });

  /* ---------------- FETCH MANAGERS (CORRECT ENDPOINT) ---------------- */
  useEffect(() => {
    authenticatedFetch(
      'http://localhost:3000/employees/searchs?roles=HR Manager,department head'
    )
      .then(res => {
        if (!res.ok) throw new Error('Failed to load managers');
        return res.json();
      })
      .then((data: Manager[]) => {
        setManagers(data);
      })
      .catch(err => setError(err.message));
  }, []);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.requisitionId.trim()) {
      return setError('Requisition ID is required');
    }

    if (!form.hiringManagerId) {
      return setError('Hiring manager is required');
    }

    setLoading(true);

    try {
      const res = await authenticatedFetch(
        'http://localhost:3000/recruitment/job-requisitions',
        {
          method: 'POST',
          body: JSON.stringify({
            requisitionId: form.requisitionId,
            openings: form.openings,
            location: form.location || undefined,
            hiringManagerId: form.hiringManagerId,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create requisition');
      }

      router.push('/recruitment/requisitions');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">
        Create Job Requisition
      </h1>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          required
          placeholder="Requisition ID"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.requisitionId}
          onChange={e =>
            setForm({ ...form, requisitionId: e.target.value })
          }
        />

        <input
          type="number"
          min={1}
          required
          placeholder="Openings"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.openings}
          onChange={e =>
            setForm({ ...form, openings: Number(e.target.value) })
          }
        />

        <input
          placeholder="Location"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.location}
          onChange={e =>
            setForm({ ...form, location: e.target.value })
          }
        />

        <select
          required
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.hiringManagerId}
          onChange={e =>
            setForm({ ...form, hiringManagerId: e.target.value })
          }
        >
          <option value="">Select Hiring Manager</option>
          {managers.map(m => (
            <option key={m._id} value={m._id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white"
        >
          {loading ? 'Creating...' : 'Create Requisition'}
        </button>
      </form>
    </div>
  );
}