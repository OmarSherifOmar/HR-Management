'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/app/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

interface Candidate {
  _id: string;
  firstName?: string;
  lastName?: string;
  personalEmail?: string;
  status: string;
  notes?: string;
}

export default function CandidateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadCandidate();
  }, [id]);

  async function loadCandidate() {
    try {
      const res = await authenticatedFetch(
        `http://localhost:3000/employees/candidates/${id}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch candidate');
      }

      const data = await res.json();
      setCandidate(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-white">Loading candidate...</div>;
  }

  if (!candidate) {
    return <div className="text-red-400">Candidate not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-400 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-4">
        {candidate.firstName} {candidate.lastName}
      </h1>

      <div className="space-y-3 text-gray-300">
        <p><strong>Email:</strong> {candidate.personalEmail}</p>
        <p><strong>Status:</strong> {candidate.status}</p>
        {candidate.notes && (
          <p><strong>Notes:</strong> {candidate.notes}</p>
        )}
      </div>
    </div>
  );
}