'use client';

import RecruitmentLayout from '../../layout';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Candidate = {
  _id: string;
  firstName: string;
  lastName: string;
  personalEmail?: string;
};

type Requisition = {
  _id: string;
  requisitionId: string;
  location?: string;
};

export default function CreateApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requisitionFromUrl = searchParams.get('requisitionId');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    candidateId: '',
    requisitionId: requisitionFromUrl || '',
  });

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    Promise.all([
      authenticatedFetch('http://localhost:3000/employees/candidates/list/all'),
      authenticatedFetch('http://localhost:3000/recruitment/job-requisitions'),
    ])
      .then(async ([cRes, rRes]) => {
        const cJson = await cRes.json();
        const rJson = await rRes.json();

        setCandidates(
          Array.isArray(cJson)
            ? cJson
            : cJson.data || cJson.candidates || []
        );

        setRequisitions(
          Array.isArray(rJson)
            ? rJson
            : rJson.data || rJson.requisitions || []
        );
      })
      .catch(() => setError('Failed to load candidates or requisitions'))
      .finally(() => setFetching(false));
  }, []);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.candidateId || !form.requisitionId) {
      return setError('Candidate and Job Requisition are required');
    }

    setLoading(true);

    try {
      const res = await authenticatedFetch(
        'http://localhost:3000/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            candidateId: form.candidateId,
            requisitionId: form.requisitionId,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create application');
      }

      router.push('/recruitment/applications');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <RecruitmentLayout
      title="Create Application"
      description="Submit a candidate application for a job requisition"
    >
      <div className="max-w-xl">
        {error && (
          <div className="mb-4 text-red-400 bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="text-white">Loading data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Candidate */}
            <select
              required
              className="w-full p-3 bg-[#1a1a1a] text-white rounded"
              value={form.candidateId}
              onChange={e =>
                setForm({ ...form, candidateId: e.target.value })
              }
            >
              <option value="">Select Candidate</option>
              {candidates.map(c => (
                <option key={c._id} value={c._id}>
                  {c.firstName} {c.lastName}
                  {c.personalEmail ? ` (${c.personalEmail})` : ''}
                </option>
              ))}
            </select>

            {/* Job Requisition */}
            <select
              required
              disabled={!!requisitionFromUrl}
              className="w-full p-3 bg-[#1a1a1a] text-white rounded disabled:opacity-60"
              value={form.requisitionId}
              onChange={e =>
                setForm({ ...form, requisitionId: e.target.value })
              }
            >
              <option value="">Select Job Requisition</option>
              {requisitions.map(r => (
                <option key={r._id} value={r._id}>
                  {r.requisitionId}
                  {r.location ? ` - ${r.location}` : ''}
                </option>
              ))}
            </select>

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white"
            >
              {loading ? 'Submitting...' : 'Create Application'}
            </button>
          </form>
        )}
      </div>
    </RecruitmentLayout>
  );
}