'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

export default function CreateCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    personalEmail: '',
    mobilePhone: '',
    biography: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 🔒 client-side validation
    if (!form.firstName || !form.lastName) {
      return setError('First name and last name are required');
    }

    if (!form.nationalId) {
      return setError('National ID is required');
    }

    if (!form.personalEmail) {
      return setError('Email is required');
    }

    setLoading(true);

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(
        `${URL}/employees/candidates`,
        {
          method: 'POST',
          body: JSON.stringify(form),
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
          onChange={e => update('firstName', e.target.value)}
        />

        <input
          required
          placeholder="Last Name"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.lastName}
          onChange={e => update('lastName', e.target.value)}
        />

        <input
          required
          placeholder="National ID"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.nationalId}
          onChange={e => update('nationalId', e.target.value)}
        />

        <input
          required
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.personalEmail}
          onChange={e => update('personalEmail', e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.mobilePhone}
          onChange={e => update('mobilePhone', e.target.value)}
        />

        <textarea
          placeholder="Notes / Bio"
          className="w-full p-3 bg-[#1a1a1a] text-white rounded"
          value={form.biography}
          onChange={e => update('biography', e.target.value)}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded text-white"
          >
            {loading ? 'Creating...' : 'Create Candidate'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}