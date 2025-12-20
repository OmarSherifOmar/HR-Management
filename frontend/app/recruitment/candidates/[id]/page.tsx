'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

export default function CandidateDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, []);

  async function loadCandidate() {
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await authenticatedFetch(
      `${URL}/employees/candidates/${id}`,
    );
    const data = await res.json();
    setForm(data);
    setLoading(false);
  }

  async function saveChanges() {
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    setSaving(true);
    await authenticatedFetch(
      `${URL}/employees/candidates/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    alert('Saved');
  }

  async function convertToEmployee() {
    if (!confirm('Convert this candidate to employee?')) return;

    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    await authenticatedFetch(
      `${URL}/employees/candidates/${id}/convert`,
      { method: 'POST', body: JSON.stringify({}) },
    );

    router.push('/employees');
  }

  async function deleteCandidate() {
    if (!confirm('DELETE candidate permanently?')) return;

    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    await authenticatedFetch(
      `${URL}/employees/candidates/${id}`,
      { method: 'DELETE' },
    );

    router.push('/recruitment/candidates');
  }

  if (loading) return <div className="text-white">Loading…</div>;
  if (!form) return null;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-white">Candidate Details</h1>

      <input
        className="w-full p-3 bg-[#1a1a1a] text-white rounded"
        value={form.firstName}
        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
      />

      <input
        className="w-full p-3 bg-[#1a1a1a] text-white rounded"
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
      />

      <input
        className="w-full p-3 bg-[#1a1a1a] text-white rounded"
        value={form.personalEmail || ''}
        onChange={(e) =>
          setForm({ ...form, personalEmail: e.target.value })
        }
      />

      <textarea
        className="w-full p-3 bg-[#1a1a1a] text-white rounded"
        value={form.biography || ''}
        onChange={(e) =>
          setForm({ ...form, biography: e.target.value })
        }
      />

      <div className="flex gap-3 pt-4">
        <button
          onClick={saveChanges}
          disabled={saving}
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          onClick={convertToEmployee}
          className="bg-green-600 px-4 py-2 rounded text-white"
        >
          Convert
        </button>

        <button
          onClick={deleteCandidate}
          className="bg-red-600 px-4 py-2 rounded text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}