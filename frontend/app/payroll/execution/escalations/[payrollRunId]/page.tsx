"use client";

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import EscalationsList from '../../components/EscalationsList';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const payrollRunId = params?.payrollRunId || '';

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold">Escalated Irregularities — {payrollRunId}</h1>
      </div>

      <EscalationsList payrollRunId={payrollRunId} />
    </div>
  );
}
