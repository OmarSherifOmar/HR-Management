'use client';

import RecruitmentLayout from '../../layout';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Application = {
  _id: string;
  candidateId: {
    firstName: string;
    lastName: string;
    personalEmail: string;
  };
  requisitionId: {
    requisitionId: string;
  };
};

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
};

export default function CreateInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationIdFromUrl = searchParams.get('applicationId') || '';

  const [applications, setApplications] = useState<Application[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    applicationId: applicationIdFromUrl,
    stage: 'screening',
    scheduledDate: '',
    scheduledTime: '',
    method: 'video',
    panel: [] as string[],
    videoLink: '',
  });

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    Promise.all([
      authenticatedFetch('http://localhost:3000/applications'),
      authenticatedFetch('http://localhost:3000/employees'),
    ])
      .then(async ([appsRes, empRes]) => {
        const apps = await appsRes.json();
        const emps = await empRes.json();

        setApplications(Array.isArray(apps) ? apps : []);
        setEmployees(Array.isArray(emps) ? emps : []);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- SUBMIT ---------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        applicationId: form.applicationId,
        stage: form.stage,
        scheduledDate: new Date(
          `${form.scheduledDate}T${form.scheduledTime}`,
        ).toISOString(),
        method: form.method, // 'video' | 'onsite' | 'phone'
        panel: form.panel,
        videoLink: form.method === 'video' ? form.videoLink : undefined,
        status: 'scheduled',
      };

      const res = await authenticatedFetch(
        'http://localhost:3000/interviews',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create interview');
      }

      router.push('/recruitment/interviews');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <RecruitmentLayout title="Schedule Interview" description="">
        <div className="text-white">Loading...</div>
      </RecruitmentLayout>
    );
  }

  return (
    <RecruitmentLayout
      title="Schedule Interview"
      description="Create interview for application"
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
            onChange={e =>
              setForm({ ...form, applicationId: e.target.value })
            }
          >
            <option value="">Select Application</option>
            {applications.map(app => (
              <option key={app._id} value={app._id}>
                {app.candidateId.firstName} {app.candidateId.lastName} —{' '}
                {app.requisitionId.requisitionId}
              </option>
            ))}
          </select>

          {/* Stage */}
          <select
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.stage}
            onChange={e => setForm({ ...form, stage: e.target.value })}
          >
            <option value="screening">Screening</option>
            <option value="department_interview">Department Interview</option>
            <option value="hr_interview">HR Interview</option>
            <option value="offer">Offer</option>
          </select>

          {/* Method */}
          <select
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.method}
            onChange={e => setForm({ ...form, method: e.target.value })}
          >
            <option value="video">Video</option>
            <option value="onsite">Onsite</option>
            <option value="phone">Phone</option>
          </select>

          {/* Date */}
          <input
            type="date"
            required
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.scheduledDate}
            onChange={e =>
              setForm({ ...form, scheduledDate: e.target.value })
            }
          />

          {/* Time */}
          <input
            type="time"
            required
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            value={form.scheduledTime}
            onChange={e =>
              setForm({ ...form, scheduledTime: e.target.value })
            }
          />

          {/* Panel */}
          <select
            multiple
            className="w-full p-3 bg-[#1a1a1a] text-white rounded"
            onChange={e =>
              setForm({
                ...form,
                panel: Array.from(e.target.selectedOptions).map(
                  o => o.value,
                ),
              })
            }
          >
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          {/* Video Link */}
          {form.method === 'video' && (
            <input
              placeholder="Video meeting link"
              className="w-full p-3 bg-[#1a1a1a] text-white rounded"
              value={form.videoLink}
              onChange={e =>
                setForm({ ...form, videoLink: e.target.value })
              }
            />
          )}

          <button
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {submitting ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </form>
      </div>
    </RecruitmentLayout>
  );
}