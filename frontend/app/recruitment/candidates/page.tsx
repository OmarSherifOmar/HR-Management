'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authenticatedFetch } from '@/app/context/AuthContext';

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  personalEmail?: string;
  status: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(
        `${URL}/employees/candidates/list/all`
      );

      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load candidates', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-white">Loading candidates...</div>;
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Candidates</h1>

        <Link
          href="/recruitment/candidates/create"
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >
          Add Candidate
        </Link>
      </div>

      <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1a1a] text-gray-400">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((c) => (
              <tr key={c._id} className="hover:bg-[#333]">
                <td className="p-3">
                  {c.firstName} {c.lastName}
                </td>
                <td className="p-3">{c.personalEmail || '—'}</td>
                <td className="p-3 capitalize">{c.status}</td>
                <td className="p-3">
                  <Link
                    href={`/recruitment/candidates/${c._id}`}
                    className="text-blue-400 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}