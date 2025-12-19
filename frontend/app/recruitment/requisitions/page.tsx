'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authenticatedFetch } from '@/app/context/AuthContext';

type Requisition = {
  _id: string;
  requisitionId: string;
  openings: number;
  location?: string;
  publishStatus: string;
  hiringManagerId?: {
    firstName: string;
    lastName: string;
  };
};

export default function RequisitionsPage() {
  const [data, setData] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('http://localhost:3000/recruitment/job-requisitions')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Job Requisitions</h1>
        <Link
          href="/recruitment/requisitions/new"
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          New Requisition
        </Link>
      </div>

      <table className="w-full text-white border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">Openings</th>
            <th className="text-left p-3">Location</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Manager</th>
            <th className="p-3"></th>
          </tr>
        </thead>

        <tbody>
          {data.map(r => (
            <tr key={r._id} className="border-b border-gray-800">
              <td className="p-3">{r.requisitionId}</td>
              <td className="p-3">{r.openings}</td>
              <td className="p-3">{r.location || '-'}</td>
              <td className="p-3 capitalize">{r.publishStatus}</td>
              <td className="p-3">
                {r.hiringManagerId
                  ? `${r.hiringManagerId.firstName} ${r.hiringManagerId.lastName}`
                  : '-'}
              </td>
              <td className="p-3">
                <Link
                  href={`/recruitment/requisitions/${r._id}`}
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
  );
}