'use client';

import RecruitmentLayout from '../layout';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Eye,
  Mail,
  Briefcase,
} from 'lucide-react';
import { authenticatedFetch } from '../../context/AuthContext';

/* ================= TYPES ================= */

interface Application {
  _id: string;
  candidateId: {
    _id: string;
    firstName: string;
    lastName: string;
    personalEmail: string;
  };
  requisitionId: {
    _id: string;
    requisitionId: string;
  };
  currentStage: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  status:
    | 'submitted'
    | 'under_review'
    | 'shortlisted'
    | 'interviewing'
    | 'offer_extended'
    | 'hired'
    | 'rejected'
    | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

/* ================= PAGE ================= */

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState(
    searchParams.get('stage') || 'all',
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all',
  );

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(
        `${URL}/applications`,
      );
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= FILTER ================= */

  const filteredApplications = applications.filter(app => {
    const candidateName =
      `${app.candidateId.firstName} ${app.candidateId.lastName}`.toLowerCase();

    const matchesSearch =
      candidateName.includes(searchTerm.toLowerCase()) ||
      app.candidateId.personalEmail
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.requisitionId.requisitionId
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'all' || app.currentStage === stageFilter;

    const matchesStatus =
      statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStage && matchesStatus;
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="text-white">Loading...</div>
      </RecruitmentLayout>
    );
  }

  /* ================= UI ================= */

  return (
    <RecruitmentLayout>
      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-10 py-2 bg-[#1a1a1a] text-white rounded"
            placeholder="Search candidate or requisition..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-[#1a1a1a] text-white px-3 rounded"
        >
          <option value="all">All Stages</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#1a1a1a] text-white px-3 rounded"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer_extended">Offer Extended</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#2a2a2a] rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="p-3 text-left text-gray-400">Candidate</th>
              <th className="p-3 text-left text-gray-400">Requisition</th>
              <th className="p-3 text-left text-gray-400">Stage</th>
              <th className="p-3 text-left text-gray-400">Status</th>
              <th className="p-3 text-left text-gray-400">Applied</th>
              <th className="p-3 text-left text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map(app => (
              <tr
                key={app._id}
                className="border-b border-gray-800 hover:bg-[#333]"
              >
                <td className="p-3 text-white">
                  <div className="font-medium">
                    {app.candidateId.firstName} {app.candidateId.lastName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {app.candidateId.personalEmail}
                  </div>
                </td>

                <td className="p-3 text-white">
                  {app.requisitionId.requisitionId}
                </td>

                <td className="p-3 text-white capitalize">
                  {app.currentStage}
                </td>

                <td className="p-3 text-white capitalize">
                  {app.status.replace('_', ' ')}
                </td>

                <td className="p-3 text-gray-300">
                  {formatDate(app.createdAt)}
                </td>

                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/recruitment/applications/${app._id}`,
                        )
                      }
                      className="p-1 hover:bg-gray-700 rounded"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>

                    {app.currentStage === 'offer' && (
                      <button
                        onClick={() =>
                          router.push(
                            `/recruitment/offers/create?applicationId=${app._id}`,
                          )
                        }
                        className="p-1 hover:bg-green-700 rounded text-green-400"
                        title="Create Offer"
                      >
                        <Briefcase size={16} />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        window.open(
                          `mailto:${app.candidateId.personalEmail}`,
                          '_blank',
                        )
                      }
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Email"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredApplications.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            No applications found
          </div>
        )}
      </div>
    </RecruitmentLayout>
  );
}
