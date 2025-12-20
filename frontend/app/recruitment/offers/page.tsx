'use client';

import RecruitmentLayout from '../layout';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Filter, Plus, MoreVertical, FileText, 
  Clock, CheckCircle, XCircle, User, DollarSign,
  TrendingUp, Download, Eye, Edit
} from 'lucide-react';
import { authenticatedFetch } from '../../context/AuthContext';

interface Offer {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
    };
    requisitionId: {
      title: string;
      department: string;
    };
  };
  candidateId: {
    name: string;
    email: string;
  };
  role: string;
  grossSalary: number;
  signingBonus?: number;
  applicantResponse?: 'pending' | 'accepted' | 'declined' | 'expired';
  finalStatus?: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  deadline: string;
  createdAt: string;
  approvers?: Array<{
    employeeId: { name: string };
    status: 'pending' | 'approved' | 'rejected';
    role: string;
  }>;
  hrEmployeeId?: { name: string };
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <OffersContent />
    </Suspense>
  );
}

function OffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/offers`);
      const data = await res.json();
      setOffers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.candidateId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.applicationId?.requisitionId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'pending-response') {
      matchesStatus = offer.applicantResponse === 'pending';
    } else if (statusFilter === 'accepted') {
      matchesStatus = offer.applicantResponse === 'accepted';
    } else if (statusFilter === 'declined') {
      matchesStatus = offer.applicantResponse === 'declined';
    } else if (statusFilter === 'expired') {
      matchesStatus = offer.applicantResponse === 'expired';
    } else if (statusFilter === 'pending-approval') {
      matchesStatus = offer.finalStatus === 'pending';
    } else if (statusFilter === 'approved') {
      matchesStatus = offer.finalStatus === 'approved';
    } else if (statusFilter === 'rejected') {
      matchesStatus = offer.finalStatus === 'rejected';
    }
    
    return matchesSearch && (statusFilter === 'all' || matchesStatus);
  });

  const getResponseColor = (response?: string) => {
    switch (response) {
      case 'accepted': return 'bg-green-600 text-white';
      case 'declined': return 'bg-red-600 text-white';
      case 'expired': return 'bg-gray-600 text-white';
      default: return 'bg-yellow-600 text-white';
    }
  };

  const getResponseText = (response?: string) => {
    switch (response) {
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      case 'expired': return 'Expired';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'withdrawn': return 'bg-gray-600 text-white';
      default: return 'bg-yellow-600 text-white';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return 'Pending';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSelectOffer = (offerId: string) => {
    if (selectedOffers.includes(offerId)) {
      setSelectedOffers(selectedOffers.filter(id => id !== offerId));
    } else {
      setSelectedOffers([...selectedOffers, offerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOffers.length === filteredOffers.length) {
      setSelectedOffers([]);
    } else {
      setSelectedOffers(filteredOffers.map(offer => offer._id));
    }
  };

  const handleBulkAction = (action: string) => {
    // Implement bulk actions
    console.log(`Bulk ${action} for:`, selectedOffers);
  };

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading offers...</div>
        </div>
      </RecruitmentLayout>
  );
  }

  return (
    <RecruitmentLayout>
      {/* Header with Actions */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Job Offers</h1>
            <p className="text-gray-400">Manage and track all job offers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/recruitment/offers/create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Create New Offer
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search offers by candidate, role, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white min-w-[180px]"
            >
              <option value="all">All Offers</option>
              <option value="pending-response">Pending Response</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <button className="px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white flex items-center gap-2">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOffers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-600/10 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">
                  {selectedOffers.length} offer{selectedOffers.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('remind')}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded"
                  >
                    Send Reminder
                  </button>
                  <button
                    onClick={() => handleBulkAction('withdraw')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedOffers([])}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Offers Table */}
      <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a1a1a]">
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOffers.length === filteredOffers.length && filteredOffers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-transparent"
                  />
                </th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Candidate</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Position</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Salary</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Response</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Status</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Deadline</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-400 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer) => {
                const daysRemaining = getDaysRemaining(offer.deadline);
                return (
                  <tr key={offer._id} className="border-b border-gray-800 hover:bg-[#333333]">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOffers.includes(offer._id)}
                        onChange={() => handleSelectOffer(offer._id)}
                        className="rounded border-gray-600 bg-transparent"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {offer.candidateId?.name?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{offer.candidateId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{offer.candidateId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{offer.role}</p>
                        <p className="text-xs text-gray-400">{offer.applicationId?.requisitionId?.department || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{formatCurrency(offer.grossSalary)}</p>
                        {offer.signingBonus && (
                          <p className="text-xs text-green-400">+{formatCurrency(offer.signingBonus)} bonus</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getResponseColor(offer.applicantResponse)}`}>
                        {getResponseText(offer.applicantResponse)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(offer.finalStatus)}`}>
                        {getStatusText(offer.finalStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-white">{formatDate(offer.deadline)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className={`text-xs ${daysRemaining < 3 ? 'text-red-400' : daysRemaining < 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/recruitment/offers/${offer._id}`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/recruitment/offers/${offer._id}/review`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="Review Offer"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/recruitment/offers/${offer._id}/edit`)}
                          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          title="Edit Offer"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOffers.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No offers found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Offer Value</p>
              <p className="text-2xl font-bold text-white mt-2">
                {formatCurrency(filteredOffers.reduce((sum, offer) => sum + offer.grossSalary, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Average Response Time</p>
              <p className="text-2xl font-bold text-white mt-2">3.2 days</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Acceptance Rate</p>
              <p className="text-2xl font-bold text-white mt-2">
                {offers.length > 0 
                  ? Math.round((offers.filter(o => o.applicantResponse === 'accepted').length / offers.length) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
