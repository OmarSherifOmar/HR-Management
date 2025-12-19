'use client';

import RecruitmentLayout from '../../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, Star, CheckCircle, XCircle, 
  ThumbsUp, ThumbsDown, User, FileText 
} from 'lucide-react';
import { authenticatedFetch } from '../../../../context/AuthContext';

interface Interview {
  _id: string;
  applicationId: {
    _id: string;
    candidateId: {
      name: string;
      email: string;
    };
    requisitionId: {
      title: string;
    };
  };
  stage: string;
  panel?: Array<{
    _id: string;
    name: string;
  }>;
}

interface FeedbackForm {
  interviewerId: string;
  ratings: {
    technical: number;
    communication: number;
    cultureFit: number;
    problemSolving: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: 'hire' | 'maybe' | 'no_hire';
  notes: string;
  nextSteps?: string;
}

export default function InterviewFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');
  
  const [formData, setFormData] = useState<FeedbackForm>({
    interviewerId: '',
    ratings: {
      technical: 3,
      communication: 3,
      cultureFit: 3,
      problemSolving: 3,
      overall: 3,
    },
    strengths: [],
    weaknesses: [],
    recommendation: 'maybe',
    notes: '',
    nextSteps: '',
  });

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/interviews/${id}`);
      const data = await res.json();
      setInterview(data);
      
      // Set default interviewer (first panel member or current user)
      if (data.panel && data.panel.length > 0) {
        setFormData(prev => ({ ...prev, interviewerId: data.panel[0]._id }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interview:', error);
      setLoading(false);
    }
  };

  const handleRatingChange = (category: keyof typeof formData.ratings, value: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value,
      },
    }));
  };

  const addStrength = () => {
    if (strengthInput.trim()) {
      setFormData(prev => ({
        ...prev,
        strengths: [...prev.strengths, strengthInput.trim()],
      }));
      setStrengthInput('');
    }
  };

  const removeStrength = (index: number) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index),
    }));
  };

  const addWeakness = () => {
    if (weaknessInput.trim()) {
      setFormData(prev => ({
        ...prev,
        weaknesses: [...prev.weaknesses, weaknessInput.trim()],
      }));
      setWeaknessInput('');
    }
  };

  const removeWeakness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const feedbackData = {
        interviewId: id,
        ...formData,
      };

      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await authenticatedFetch(`${URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (res.ok) {
        // Update interview with feedback ID
        const feedback = await res.json();
        const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        await authenticatedFetch(`${URL}/interviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackId: feedback._id }),
        });
        
        router.push(`/recruitment/interviews/${id}`);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RecruitmentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  if (!interview) {
    return (
      <RecruitmentLayout>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Interview Not Found</h3>
          <p className="text-gray-400 mb-6">The interview you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/recruitment/interviews')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Back to Interviews
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
            onClick={() => router.push(`/recruitment/interviews/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            Back to Interview
          </button>
          <h1 className="text-2xl font-bold text-white">Interview Feedback</h1>
          <p className="text-gray-400">
            Submit feedback for {interview.applicationId.candidateId.name} - {interview.applicationId.requisitionId.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate Summary */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Candidate Summary</h2>
            <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{interview.applicationId.candidateId.name}</h3>
                <p className="text-gray-400">{interview.applicationId.candidateId.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Interview Stage: <span className="text-white capitalize">{interview.stage.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Interview Ratings</h2>
            
            <div className="space-y-6">
              {Object.entries(formData.ratings).map(([category, value]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium capitalize">
                      {category.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <span className="text-lg font-bold text-white">{value}/5</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(category as keyof typeof formData.ratings, rating)}
                        className={`flex-1 mx-1 py-3 rounded-lg flex flex-col items-center transition-colors ${
                          value === rating
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333333] hover:text-white'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${value >= rating ? 'fill-current' : ''}`} />
                        <span className="text-xs mt-1">{rating}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Strengths & Areas for Improvement</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Strengths</label>
                <div className="space-y-3">
                  {formData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-600/10 border border-green-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">{strength}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStrength(index)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
                      placeholder="Add a strength..."
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={addStrength}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Areas for Improvement</label>
                <div className="space-y-3">
                  {formData.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-600/10 border border-red-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-white">{weakness}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWeakness(index)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={weaknessInput}
                      onChange={(e) => setWeaknessInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWeakness())}
                      placeholder="Add area for improvement..."
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={addWeakness}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recommendation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommendation: 'hire' }))}
                className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  formData.recommendation === 'hire'
                    ? 'border-green-500 bg-green-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <ThumbsUp className={`w-8 h-8 mb-3 ${formData.recommendation === 'hire' ? 'text-green-400' : 'text-gray-400'}`} />
                <span className={`text-lg font-semibold ${formData.recommendation === 'hire' ? 'text-white' : 'text-gray-400'}`}>
                  Hire
                </span>
                <p className="text-sm text-gray-400 mt-2 text-center">Strong candidate, recommend hiring</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommendation: 'maybe' }))}
                className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  formData.recommendation === 'maybe'
                    ? 'border-yellow-500 bg-yellow-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="w-8 h-8 mb-3 flex items-center justify-center">
                  <span className={`text-2xl ${formData.recommendation === 'maybe' ? 'text-yellow-400' : 'text-gray-400'}`}>?</span>
                </div>
                <span className={`text-lg font-semibold ${formData.recommendation === 'maybe' ? 'text-white' : 'text-gray-400'}`}>
                  Maybe
                </span>
                <p className="text-sm text-gray-400 mt-2 text-center">Needs further review or another round</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommendation: 'no_hire' }))}
                className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  formData.recommendation === 'no_hire'
                    ? 'border-red-500 bg-red-600/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <ThumbsDown className={`w-8 h-8 mb-3 ${formData.recommendation === 'no_hire' ? 'text-red-400' : 'text-gray-400'}`} />
                <span className={`text-lg font-semibold ${formData.recommendation === 'no_hire' ? 'text-white' : 'text-gray-400'}`}>
                  No Hire
                </span>
                <p className="text-sm text-gray-400 mt-2 text-center">Not a good fit for the role</p>
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Additional Notes & Comments
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Provide detailed comments about the candidate's performance, specific examples, and any other relevant information..."
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Recommended Next Steps
                </label>
                <textarea
                  value={formData.nextSteps}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
                  rows={2}
                  placeholder="Suggest next steps (e.g., another interview, reference check, offer, etc.)"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/recruitment/interviews/${id}`)}
              className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </RecruitmentLayout>
  );
}