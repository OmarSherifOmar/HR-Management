'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Candidate = {
  status: string;
};

type Requisition = {
  publishStatus: string;
};

export default function RecruitmentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    Promise.all([
      authenticatedFetch(`${URL}/employees/candidates/list/all`),
      authenticatedFetch(`${URL}/recruitment/job-requisitions`),
    ])
      .then(async ([candRes, reqRes]) => {
        if (!candRes.ok || !reqRes.ok) {
          throw new Error('Failed to load analytics data');
        }

        const candidatesData = await candRes.json();
        const requisitionsData = await reqRes.json();

        setCandidates(candidatesData);
        setRequisitions(requisitionsData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- AGGREGATIONS ---------------- */
  const candidateByStatus = candidates.reduce<Record<string, number>>(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {},
  );

  const requisitionByStatus = requisitions.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.publishStatus] = (acc[r.publishStatus] || 0) + 1;
      return acc;
    },
    {},
  );

  /* ---------------- UI ---------------- */
  if (loading) {
    return <div className="text-white">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="text-red-400 bg-red-900/20 p-4 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">
        Recruitment Analytics
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Total Candidates" value={candidates.length} />
        <Kpi title="Total Requisitions" value={requisitions.length} />
        <Kpi title="Open Requisitions" value={requisitionByStatus.published || 0} />
        <Kpi title="Closed Requisitions" value={requisitionByStatus.closed || 0} />
      </div>

      {/* CANDIDATES STATUS */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Candidates by Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(candidateByStatus).map(([status, count]) => (
            <StatCard key={status} label={status} value={count} />
          ))}
        </div>
      </div>

      {/* REQUISITIONS STATUS */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Requisitions by Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(requisitionByStatus).map(([status, count]) => (
            <StatCard key={status} label={status} value={count} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] rounded p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] rounded p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}