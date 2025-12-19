'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/app/context/AuthContext';

export default function RequisitionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    authenticatedFetch(
      `http://localhost:3000/recruitment/job-requisitions/${id}`,
    )
      .then(res => res.json())
      .then(setData);
  }, [id]);

  /* ---------------- CONFIRMED UPDATE ---------------- */
  async function updateStatus(
    publishStatus: 'published' | 'closed'
  ) {
    const actionText =
      publishStatus === 'published'
        ? 'publish this requisition'
        : 'close this requisition';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText}?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      await authenticatedFetch(
        `http://localhost:3000/recruitment/job-requisitions/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ publishStatus }),
        },
      );

      router.push('/recruitment/requisitions');
    } finally {
      setLoading(false);
    }
  }

  if (!data) return <p className="text-white">Loading...</p>;

  return (
    <div className="text-white max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">
        {data.requisitionId}
      </h1>

      <p>
        <span className="text-gray-400">Status:</span>{' '}
        <span className="font-semibold capitalize">
          {data.publishStatus}
        </span>
      </p>

      <p>
        <span className="text-gray-400">Openings:</span> {data.openings}
      </p>

      <p>
        <span className="text-gray-400">Location:</span>{' '}
        {data.location || '-'}
      </p>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3 pt-4">

        {/* Apply Candidate */}
        {data.publishStatus === 'published' && (
          <button
            onClick={() =>
              router.push(
                `/recruitment/applications/create?requisitionId=${id}`
            )
            }
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Apply Candidate
          </button>
        )}

        {/* Publish */}
        {data.publishStatus === 'draft' && (
          <button
            disabled={loading}
            onClick={() => updateStatus('published')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Publish
          </button>
        )}

        {/* Close */}
        {data.publishStatus !== 'closed' && (
          <button
            disabled={loading}
            onClick={() => updateStatus('closed')}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}