'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

export default function CreateCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    personalEmail: '',
    mobilePhone: '',
    biography: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authenticatedFetch(
        'http://localhost:3000/employees/candidates',
        {
          method: 'POST',
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            personalEmail: form.personalEmail,
            mobilePhone: form.mobilePhone,
            biography: form.biography,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create candidate');
      }

      router.push('/recruitment/candidates');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Add Candidate</h1>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="First Name"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />

        <input
          required
          placeholder="Last Name"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />

        <input
          required
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.personalEmail}
          onChange={(e) =>
            setForm({ ...form, personalEmail: e.target.value })
          }
        />

        <input
          placeholder="Phone"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.mobilePhone}
          onChange={(e) =>
            setForm({ ...form, mobilePhone: e.target.value })
          }
        />

        <textarea
          placeholder="Notes / Bio"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.biography}
          onChange={(e) =>
            setForm({ ...form, biography: e.target.value })
          }
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white"
        >
          {loading ? 'Creating...' : 'Create Candidate'}
        </button>
      </form>
    </div>
  );
}