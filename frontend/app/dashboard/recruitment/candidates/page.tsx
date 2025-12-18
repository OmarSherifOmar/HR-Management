'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/app/context/AuthContext';
import Link from 'next/link';

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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
      const res = await authenticatedFetch('http://localhost:3000/candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error('Failed to load candidates', e);
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
          href="/dashboard/recruitment/candidates/create"
          className="px-4 py-2 bg-blue-600 rounded"
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
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c._id}
                className="hover:bg-[#333] cursor-pointer"
              >
                <td className="p-3">
                  <Link href={`/dashboard/recruitment/candidates/${c._id}`}>
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="p-3">{c.email}</td>
                <td className="p-3 capitalize">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}