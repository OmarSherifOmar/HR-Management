'use client';

import RecruitmentLayout from '../../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, CheckCircle, XCircle, Clock, 
  FileText, DollarSign, User, Building, AlertCircle,
  ThumbsUp, ThumbsDown, MessageSquare, Eye
} from 'lucide-react';
import { authenticatedFetch } from '../../../../context/AuthContext';

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
  benefits?: string[];
  conditions?: string;
  insurances?: string;
  content: string;
  deadline: string;
  finalStatus?: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  approvers?: Array<{
    employeeId: {
      _id: string;
      name: string;
    };
    role: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}

interface ReviewForm {
  status: 'approved' | 'rejected' | 'pending';
  comment: string;
  suggestedChanges?: string;
  recommendations?: string;
}

export default function OfferReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    status: 'pending',
    comment: '',
    suggestedChanges: '',
    recommendations: '',
  });

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      // Get current user (in a real app, this would come from auth context)
      const userRes = await authenticatedFetch(`${URL}/auth/me`);
      const userData = await userRes.json();

      const reviewData = {
        employeeId: userData._id,
        role: userData.role || 'Reviewer',
        status: reviewForm.status,
        comment: reviewForm.comment,
        actionDate: new Date().toISOString(),
      };

      // Add approver to offer
      await authenticatedFetch(`${URL}/offers/${id}/approvers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      // If approved, also update the offer status
      if (reviewForm.status === 'approved') {
        await authenticatedFetch(`${URL}/offers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finalStatus: 'approved' }),
        });
      }

      router.push(`/recruitment/offers/${id}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <RecruitmentLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/recruitment/offers/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Offer
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Review Offer</h1>
              <p className="text-gray-400">
                Review and provide feedback for {offer.candidateId.name} - {offer.role}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2"
              >
                <Eye size={18} />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>
            </div>
          </div>
        </div>

        {!previewMode ? (
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Offer Summary */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Offer Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{offer.candidateId.name}</p>
                      <p className="text-sm text-gray-400">{offer.candidateId.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Position</p>
                    <p className="text-xl font-semibold text-white">{offer.role}</p>
                    <p className="text-sm text-gray-400">{offer.applicationId.requisitionId.department}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
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
              </div>
            </div>

            {/* Review Decision */}
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Your Decision</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, status: 'approved' }))}
                  className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    reviewForm.status === 'approved'
                      ? 'border-green-500 bg-green-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <ThumbsUp className={`w-8 h-8 mb-3 ${reviewForm.status === 'approved' ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={`text-lg font-semibold ${reviewForm.status === 'approved' ? 'text-white' : 'text-gray-400'}`}>
                    Approve
                  </span>
                  <p className="text-sm text-gray-400 mt-2 text-center">Approve this offer as-is</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, status: 'pending' }))}
                  className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    reviewForm.status === 'pending'
                      ? 'border-yellow-500 bg-yellow-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Clock className={`w-8 h-8 mb-3 ${reviewForm.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className={`text-lg font-semibold ${reviewForm.status === 'pending' ? 'text-white' : 'text-gray-400'}`}>
                    Request Changes
                  </span>
                  <p className="text-sm text-gray-400 mt-2 text-center">Send back for modifications</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setReviewForm(prev => ({ ...prev, status: 'rejected' }))}
                  className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    reviewForm.status === 'rejected'
                      ? 'border-red-500 bg-red-600/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <ThumbsDown className={`w-8 h-8 mb-3 ${reviewForm.status === 'rejected' ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className={`text-lg font-semibold ${reviewForm.status === 'rejected' ? 'text-white' : 'text-gray-400'}`}>
                    Reject
                  </span>
                  <p className="text-sm text-gray-400 mt-2 text-center">Reject this offer proposal</p>
                </button>
              </div>
              
              {/* Decision Explanation */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Comments & Feedback {reviewForm.status === 'pending' && '(Required)'}
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  placeholder={
                    reviewForm.status === 'approved' 
                      ? 'Optional: Add comments or notes about your approval...' 
                      : reviewForm.status === 'rejected'
                      ? 'Please explain why you are rejecting this offer...'
                      : 'Please explain what changes are needed...'
                  }
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                  required={reviewForm.status !== 'approved'}
                />
              </div>
            </div>

            {/* Suggested Changes (Only for Request Changes) */}
            {reviewForm.status === 'pending' && (
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Suggested Changes</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Specific Changes Required
                    </label>
                    <textarea
                      value={reviewForm.suggestedChanges}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, suggestedChanges: e.target.value }))}
                      rows={3}
                      placeholder="List the specific changes that need to be made (e.g., adjust salary, modify benefits, clarify terms)..."
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Recommendations
                    </label>
                    <textarea
                      value={reviewForm.recommendations}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, recommendations: e.target.value }))}
                      rows={2}
                      placeholder="Optional: Provide recommendations or alternatives..."
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Warning for Rejection */}
            {reviewForm.status === 'rejected' && (
              <div className="bg-red-600/10 border border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-white">Warning: Rejecting Offer</h4>
                    <p className="text-sm text-red-300 mt-1">
                      Rejecting this offer will notify HR and may terminate the offer process. 
                      This action cannot be undone without HR intervention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push(`/recruitment/offers/${id}`)}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (reviewForm.status !== 'approved' && !reviewForm.comment.trim())}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {submitting ? 'Submitting...' : 
                 reviewForm.status === 'approved' ? 'Approve Offer' :
                 reviewForm.status === 'rejected' ? 'Reject Offer' : 'Request Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="space-y-6">
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Review Preview</h2>
              
              <div className="space-y-6">
                {/* Decision Preview */}
                <div className={`p-4 rounded-lg ${
                  reviewForm.status === 'approved' ? 'bg-green-600/10 border border-green-700' :
                  reviewForm.status === 'rejected' ? 'bg-red-600/10 border border-red-700' :
                  'bg-yellow-600/10 border border-yellow-700'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {reviewForm.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {reviewForm.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}
                    {reviewForm.status === 'pending' && <Clock className="w-5 h-5 text-yellow-400" />}
                    <span className="font-semibold text-white">
                      {reviewForm.status === 'approved' ? 'Approval' : 
                       reviewForm.status === 'rejected' ? 'Rejection' : 'Change Request'}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-300 mb-2">Comments:</p>
                    <p className="text-white">{reviewForm.comment || 'No comments provided'}</p>
                  </div>
                </div>

                {/* Changes Preview */}
                {reviewForm.status === 'pending' && reviewForm.suggestedChanges && (
                  <div>
                    <h3 className="font-medium text-white mb-2">Suggested Changes:</h3>
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-white">{reviewForm.suggestedChanges}</p>
                    </div>
                  </div>
                )}

                {/* Recommendations Preview */}
                {reviewForm.recommendations && (
                  <div>
                    <h3 className="font-medium text-white mb-2">Recommendations:</h3>
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-white">{reviewForm.recommendations}</p>
                    </div>
                  </div>
                )}

                {/* Offer Summary Preview */}
                <div>
                  <h3 className="font-medium text-white mb-2">Offer Being Reviewed:</h3>
                  <div className="p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xl font-semibold text-white">{offer.candidateId.name}</p>
                        <p className="text-gray-400">{offer.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{formatCurrency(offer.grossSalary)}</p>
                        <p className="text-sm text-gray-400">Base Salary</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{offer.applicationId.requisitionId.department}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPreviewMode(false)}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
              >
                ← Back to Edit
              </button>
              <button
                onClick={() => router.push(`/recruitment/offers/${id}`)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                Return to Offer
              </button>
            </div>
          </div>
        )}
      </div>
    </RecruitmentLayout>
  );
}