'use client';

import RecruitmentLayout from '../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, User, 
  DollarSign, FileText, Calendar, Building, Mail,
  Edit, Download, Printer, Send, MoreVertical, 
  ChevronRight, ExternalLink, Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { authenticatedFetch } from '../../../context/AuthContext';

interface Offer {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
      phone?: string;
      resume?: string;
    };
    requisitionId: {
      title: string;
      department: string;
      location?: string;
    };
  };
  candidateId: {
    name: string;
    email: string;
    phone?: string;
  };
  hrEmployeeId?: {
    name: string;
    email: string;
  };
  role: string;
  grossSalary: number;
  signingBonus?: number;
  benefits?: string[];
  conditions?: string;
  insurances?: string;
  content: string;
  deadline: string;
  applicantResponse?: 'pending' | 'accepted' | 'declined' | 'expired';
  finalStatus?: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  approvers?: Array<{
    employeeId: {
      _id: string;
      name: string;
      role: string;
      department: string;
    };
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    actionDate?: string;
    comment?: string;
  }>;
  candidateSignedAt?: string;
  hrSignedAt?: string;
  managerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  color: string;
}

export default function OfferDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'documents' | 'timeline'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOfferDetails();
    }
  }, [id]);

  const fetchOfferDetails = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/offers/${id}`);
      const data = await res.json();
      setOffer(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      setLoading(false);
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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
      default: return 'Pending Response';
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
      default: return 'Pending Approval';
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/recruitment/offers/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = async () => {
    try {
      // Send reminder email
      alert('Reminder sent to candidate!');
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const handleUpdateResponse = async (response: 'accepted' | 'declined') => {
    if (confirm(`Are you sure you want to mark this offer as ${response}?`)) {
      try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        await authenticatedFetch(`${URL}/offers/${id}/applicant-response`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        });
        fetchOfferDetails();
      } catch (error) {
        console.error('Error updating response:', error);
      }
    }
  };

  const getApprovalProgress = () => {
    if (!offer?.approvers || offer.approvers.length === 0) return { percent: 0, approved: 0, total: 0 };
    
    const approved = offer.approvers.filter(a => a.status === 'approved').length;
    const rejected = offer.approvers.filter(a => a.status === 'rejected').length;
    const total = offer.approvers.length;
    
    if (rejected > 0) return { percent: 0, approved, total, rejected: true };
    return { percent: Math.round((approved / total) * 100), approved, total, rejected: false };
  };

  const generateTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    events.push({
      id: 'created',
      title: 'Offer Created',
      description: 'Offer letter was created and prepared',
      date: offer?.createdAt || '',
      icon: <FileText size={16} />,
      color: 'bg-blue-500',
    });

    if (offer?.approvers) {
      offer.approvers.forEach((approver, index) => {
        if (approver.actionDate) {
          events.push({
            id: `approver-${index}`,
            title: `${approver.role} Review`,
            description: `${approver.employeeId.name} ${approver.status === 'approved' ? 'approved' : approver.status === 'rejected' ? 'rejected' : 'reviewed'} the offer`,
            date: approver.actionDate,
            icon: approver.status === 'approved' ? <ThumbsUp size={16} /> : 
                   approver.status === 'rejected' ? <ThumbsDown size={16} /> : <Clock size={16} />,
            color: approver.status === 'approved' ? 'bg-green-500' : 
                   approver.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500',
          });
        }
      });
    }

    if (offer?.hrSignedAt) {
      events.push({
        id: 'hr-signed',
        title: 'HR Signed',
        description: 'HR representative signed the offer',
        date: offer.hrSignedAt,
        icon: <CheckCircle size={16} />,
        color: 'bg-green-500',
      });
    }

    if (offer?.managerSignedAt) {
      events.push({
        id: 'manager-signed',
        title: 'Manager Signed',
        description: 'Hiring manager signed the offer',
        date: offer.managerSignedAt,
        icon: <CheckCircle size={16} />,
        color: 'bg-green-500',
      });
    }

    if (offer?.candidateSignedAt) {
      events.push({
        id: 'candidate-signed',
        title: 'Candidate Signed',
        description: 'Candidate accepted and signed the offer',
        date: offer.candidateSignedAt,
        icon: <CheckCircle size={16} />,
        color: 'bg-green-500',
      });
    }

    if (offer?.applicantResponse && offer.applicantResponse !== 'pending') {
      events.push({
        id: 'candidate-response',
        title: 'Candidate Response',
        description: `Candidate ${offer.applicantResponse} the offer`,
        date: offer.updatedAt,
        icon: offer.applicantResponse === 'accepted' ? <CheckCircle size={16} /> : <XCircle size={16} />,
        color: offer.applicantResponse === 'accepted' ? 'bg-green-500' : 'bg-red-500',
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading offer details...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  if (!offer) {
    return (
      <RecruitmentLayout>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Offer Not Found</h3>
          <p className="text-gray-400 mb-6">The offer you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/recruitment/offers')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Back to Offers
          </button>
        </div>
      </RecruitmentLayout>
    );
  }

  const daysRemaining = getDaysRemaining(offer.deadline);
  const approvalProgress = getApprovalProgress();
  const timelineEvents = generateTimeline();

  return (
    <RecruitmentLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/recruitment/offers')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Offers
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Offer Details</h1>
              <p className="text-gray-400">Extended to {offer.candidateId.name} for {offer.role}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {offer.applicantResponse === 'pending' && (
                <button
                  onClick={handleSendReminder}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
                >
                  Send Reminder
                </button>
              )}
              <button
                onClick={() => router.push(`/recruitment/offers/${id}/edit`)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2"
              >
                <Edit size={18} />
                Edit
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2">
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-6 p-6 bg-[#2a2a2a] rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getResponseColor(offer.applicantResponse)}`}>
                  {getResponseText(offer.applicantResponse)}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(offer.finalStatus)}`}>
                  {getStatusText(offer.finalStatus)}
                </span>
                {daysRemaining > 0 ? (
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    daysRemaining < 3 ? 'bg-red-600 text-white' : 
                    daysRemaining < 7 ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    <Clock size={12} className="inline mr-1" />
                    {daysRemaining} days remaining
                  </span>
                ) : (
                  <span className="text-sm px-3 py-1 bg-red-600 text-white rounded-full font-medium">
                    Expired
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Deadline: {formatDate(offer.deadline)}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign size={14} />
                  Value: {formatCurrency(offer.grossSalary + (offer.signingBonus || 0))}
                </div>
              </div>
            </div>
            
            {offer.applicantResponse === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateResponse('accepted')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Mark as Accepted
                </button>
                <button
                  onClick={() => handleUpdateResponse('declined')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <XCircle size={18} />
                  Mark as Declined
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Approval Progress */}
        {offer.approvers && offer.approvers.length > 0 && (
          <div className="mb-6 bg-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Approval Progress</h3>
              <span className={`text-sm font-medium ${
                approvalProgress.rejected ? 'text-red-400' : 
                approvalProgress.percent === 100 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {approvalProgress.rejected ? 'Rejected' : 
                 approvalProgress.percent === 100 ? 'Fully Approved' : 
                 `${approvalProgress.approved}/${approvalProgress.total} Approved`}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    approvalProgress.rejected ? 'bg-red-500' : 
                    approvalProgress.percent === 100 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${approvalProgress.percent}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {offer.approvers.map((approver, index) => (
                <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        approver.status === 'approved' ? 'bg-green-600/20' :
                        approver.status === 'rejected' ? 'bg-red-600/20' : 'bg-yellow-600/20'
                      }`}>
                        <span className={`text-lg ${
                          approver.status === 'approved' ? 'text-green-400' :
                          approver.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {approver.employeeId.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{approver.employeeId.name}</p>
                        <p className="text-sm text-gray-400">{approver.role}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      approver.status === 'approved' ? 'bg-green-600 text-white' :
                      approver.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {approver.status.charAt(0).toUpperCase() + approver.status.slice(1)}
                    </span>
                  </div>
                  
                  {approver.actionDate && (
                    <div className="text-xs text-gray-400">
                      {new Date(approver.actionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  
                  {approver.comment && (
                    <div className="mt-3 text-sm text-gray-300">
                      "{approver.comment}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Offer Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-[#2a2a2a] rounded-lg">
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'overview'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'approvals'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Approvals
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'documents'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'timeline'
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Timeline
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Candidate Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Candidate Information</h3>
                      <div className="bg-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                              <div>
                                <h4 className="text-xl font-bold text-white">{offer.candidateId.name}</h4>
                                <p className="text-gray-400">{offer.applicationId.requisitionId.title}</p>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`mailto:${offer.candidateId.email}`}
                                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-2"
                                >
                                  <Mail size={14} />
                                  Email
                                </a>
                                {offer.applicationId.candidateId.resume && (
                                  <a
                                    href={offer.applicationId.candidateId.resume}
                                    target="_blank"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2"
                                  >
                                    <FileText size={14} />
                                    Resume
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Email</p>
                                <p className="text-white">{offer.candidateId.email}</p>
                              </div>
                              {offer.candidateId.phone && (
                                <div>
                                  <p className="text-sm text-gray-400">Phone</p>
                                  <p className="text-white">{offer.candidateId.phone}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-400">Department</p>
                                <p className="text-white">{offer.applicationId.requisitionId.department}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Offer Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-400">Position</p>
                            <p className="text-xl font-semibold text-white">{offer.role}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Base Salary</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(offer.grossSalary)}</p>
                            <p className="text-sm text-gray-400">per year</p>
                          </div>
                          {offer.signingBonus && (
                            <div>
                              <p className="text-sm text-gray-400">Signing Bonus</p>
                              <p className="text-xl font-semibold text-green-400">{formatCurrency(offer.signingBonus)}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {offer.benefits && offer.benefits.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2">Benefits</p>
                              <ul className="space-y-1">
                                {offer.benefits.map((benefit, index) => (
                                  <li key={index} className="flex items-center gap-2 text-white">
                                    <CheckCircle size={14} className="text-green-400" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {offer.insurances && (
                            <div>
                              <p className="text-sm text-gray-400">Insurance Coverage</p>
                              <p className="text-white">{offer.insurances}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Offer Content */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Offer Letter</h3>
                      <div className="bg-[#1a1a1a] rounded-lg p-6 max-h-96 overflow-y-auto">
                        <div className="prose prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: offer.content.replace(/\n/g, '<br/>') }} />
                        </div>
                      </div>
                    </div>

                    {/* Conditions */}
                    {offer.conditions && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Conditions</h3>
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                          <p className="text-white">{offer.conditions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'approvals' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Approval Workflow</h4>
                        <button
                          onClick={() => router.push(`/recruitment/offers/${id}/review`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                        >
                          Review Offer
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {offer.approvers && offer.approvers.length > 0 ? (
                          offer.approvers.map((approver, index) => (
                            <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    approver.status === 'approved' ? 'bg-green-600' :
                                    approver.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                                  }`}>
                                    <span className="text-white font-semibold">
                                      {approver.employeeId.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{approver.employeeId.name}</p>
                                    <p className="text-sm text-gray-400">{approver.role}</p>
                                    <p className="text-xs text-gray-500">{approver.employeeId.department}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                    approver.status === 'approved' ? 'bg-green-600 text-white' :
                                    approver.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                                  }`}>
                                    {approver.status.charAt(0).toUpperCase() + approver.status.slice(1)}
                                  </span>
                                  {approver.actionDate && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(approver.actionDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {approver.comment && (
                                <div className="mt-4 p-3 bg-[#2a2a2a] rounded-lg">
                                  <p className="text-sm text-gray-300">"{approver.comment}"</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">No Approvers Yet</h4>
                            <p className="text-gray-400">Add approvers to start the approval process</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">Offer Letter</p>
                              <p className="text-sm text-gray-400">Original offer document</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
                              View
                            </button>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {offer.candidateSignedAt && (
                        <div className="p-4 bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">Signed Offer Letter</p>
                                <p className="text-sm text-gray-400">Signed by candidate on {new Date(offer.candidateSignedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                              Download
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional documents can be added here */}
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div>
                    <div className="space-y-4">
                      {timelineEvents.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${event.color}`}>
                              {event.icon}
                            </div>
                            {index < timelineEvents.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-700 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-white">{event.title}</h4>
                              <span className="text-sm text-gray-400">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-gray-400">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/recruitment/offers/${id}/review`)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Review Offer
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  {copied ? 'Link Copied!' : 'Copy Offer Link'}
                </button>
                <button
                  onClick={handleSendReminder}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
                >
                  Send Reminder
                </button>
                {offer.finalStatus === 'pending' && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to withdraw this offer?')) {
                        // Handle withdraw
                      }
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                  >
                    Withdraw Offer
                  </button>
                )}
              </div>
            </div>

            {/* HR Information */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">HR Information</h3>
              {offer.hrEmployeeId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {offer.hrEmployeeId.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{offer.hrEmployeeId.name}</p>
                      <p className="text-sm text-gray-400">HR Representative</p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${offer.hrEmployeeId.email}`}
                    className="block w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded text-center"
                  >
                    Contact HR
                  </a>
                </div>
              ) : (
                <p className="text-gray-400">No HR assigned</p>
              )}
            </div>

            {/* Signatures */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Signatures</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Candidate</p>
                  <div className="flex items-center gap-2">
                    {offer.candidateSignedAt ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">Signed on {new Date(offer.candidateSignedAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400">Awaiting signature</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">HR Representative</p>
                  <div className="flex items-center gap-2">
                    {offer.hrSignedAt ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">Signed on {new Date(offer.hrSignedAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Hiring Manager</p>
                  <div className="flex items-center gap-2">
                    {offer.managerSignedAt ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">Signed on {new Date(offer.managerSignedAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}