'use client';

import RecruitmentLayout from '../../layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Application = {
  _id: string;
  candidateId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  requisitionId: {
    requisitionId: string;
  };
};

export default function CreateOfferPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    applicationId: '',
    candidateId: '',
    role: '',
    grossSalary: '',
    signingBonus: '',
    content: '',
    deadline: '',
  });

  /* ---------------- FETCH APPLICATIONS ---------------- */

  useEffect(() => {
    authenticatedFetch('http://localhost:3000/applications')
      .then(res => res.json())
      .then((data: Application[]) => setApplications(data))
      .catch(() => setError('Failed to load applications'));
  }, []);

  /* ---------------- HANDLE APPLICATION SELECT ---------------- */

  function handleApplicationSelect(appId: string) {
    const app = applications.find(a => a._id === appId);
    if (!app) return;

    setForm(prev => ({
      ...prev,
      applicationId: app._id,
      candidateId: app.candidateId._id,
    }));
  }

  /* ---------------- SUBMIT ---------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (
      !form.applicationId ||
      !form.candidateId ||
      !form.role ||
      !form.grossSalary ||
      !form.content ||
      !form.deadline
    ) {
      return setError('All required fields must be filled');
    }

    setLoading(true);

    try {
      const res = await authenticatedFetch(
        'http://localhost:3000/offers',
        {
          method: 'POST',
          body: JSON.stringify({
            applicationId: form.applicationId,
            candidateId: form.candidateId,
            role: form.role,
            grossSalary: Number(form.grossSalary),
            signingBonus: form.signingBonus
              ? Number(form.signingBonus)
              : undefined,
            content: form.content,
            deadline: new Date(form.deadline),
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create offer');
      }

      router.push('/recruitment/offers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <RecruitmentLayout
      title="Create Offer"
      description="Create a job offer for an application"
    >
      <div className="max-w-xl">

        {error && (
          <div className="mb-4 text-red-400 bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Application */}
          <select
            required
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.applicationId}
            onChange={e => handleApplicationSelect(e.target.value)}
          >
            <option value="">Select Application</option>
            {applications.map(app => (
              <option key={app._id} value={app._id}>
                {app.candidateId.firstName} {app.candidateId.lastName}
                {' — '}
                {app.requisitionId.requisitionId}
              </option>
            ))}
          </select>

          {/* Role */}
          <input
            required
            placeholder="Role / Position"
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          />

          {/* Salary */}
          <input
            required
            type="number"
            placeholder="Gross Salary"
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.grossSalary}
            onChange={e =>
              setForm({ ...form, grossSalary: e.target.value })
            }
          />

          {/* Signing Bonus */}
          <input
            type="number"
            placeholder="Signing Bonus (optional)"
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.signingBonus}
            onChange={e =>
              setForm({ ...form, signingBonus: e.target.value })
            }
          />

          {/* Offer Content */}
          <textarea
            required
            placeholder="Offer Content"
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.content}
            onChange={e =>
              setForm({ ...form, content: e.target.value })
            }
          />

          {/* Deadline */}
          <input
            required
            type="date"
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.deadline}
            onChange={e =>
              setForm({ ...form, deadline: e.target.value })
            }
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white"
          >
            {loading ? 'Creating...' : 'Create Offer'}
          </button>
        </form>
      </div>
    </RecruitmentLayout>
  );
}