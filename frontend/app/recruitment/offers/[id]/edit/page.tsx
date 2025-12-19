'use client';

import RecruitmentLayout from '../../../layout';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, DollarSign, Calendar, FileText,
  Plus, X, AlertCircle, CheckCircle, Clock
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
}

interface EditForm {
  role: string;
  grossSalary: string;
  signingBonus: string;
  benefits: string[];
  conditions: string;
  insurances: string;
  content: string;
  deadline: string;
  newBenefit: string;
}

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const [changes, setChanges] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<EditForm>({
    role: '',
    grossSalary: '',
    signingBonus: '',
    benefits: [],
    conditions: '',
    insurances: '',
    content: '',
    deadline: '',
    newBenefit: '',
  });

  useEffect(() => {
    if (id) {
      fetchOfferDetails();
    }
  }, [id]);

  const fetchOfferDetails = async () => {
    try {
      const res = await authenticatedFetch(`http://localhost:3000/offers/${id}`);
      const data = await res.json();
      setOffer(data);
      
      setFormData({
        role: data.role || '',
        grossSalary: data.grossSalary?.toString() || '',
        signingBonus: data.signingBonus?.toString() || '',
        benefits: data.benefits || [],
        conditions: data.conditions || '',
        insurances: data.insurances || '',
        content: data.content || '',
        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
        newBenefit: '',
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EditForm, value: string) => {
    const oldValue = formData[field];
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Track changes
    if (oldValue !== value && !changes.includes(field)) {
      setChanges(prev => [...prev, field]);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit('');
      
      if (!changes.includes('benefits')) {
        setChanges(prev => [...prev, 'benefits']);
      }
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
    
    if (!changes.includes('benefits')) {
      setChanges(prev => [...prev, 'benefits']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (changes.includes('role')) updateData.role = formData.role;
      if (changes.includes('grossSalary')) updateData.grossSalary = parseFloat(formData.grossSalary);
      if (changes.includes('signingBonus') && formData.signingBonus) {
        updateData.signingBonus = parseFloat(formData.signingBonus);
      }
      if (changes.includes('benefits')) updateData.benefits = formData.benefits;
      if (changes.includes('conditions')) updateData.conditions = formData.conditions;
      if (changes.includes('insurances')) updateData.insurances = formData.insurances;
      if (changes.includes('content')) updateData.content = formData.content;
      if (changes.includes('deadline')) updateData.deadline = new Date(formData.deadline).toISOString();

      // If no changes, just return
      if (Object.keys(updateData).length === 0) {
        router.push(`/recruitment/offers/${id}`);
        return;
      }

      const res = await authenticatedFetch(`http://localhost:3000/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        router.push(`/recruitment/offers/${id}`);
      } else {
        throw new Error('Failed to update offer');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Failed to update offer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalCompensation = () => {
    const salary = parseFloat(formData.grossSalary) || 0;
    const bonus = parseFloat(formData.signingBonus) || 0;
    return salary + bonus;
  };

  if (loading) {
    return (
      <RecruitmentLayout title="Edit Offer" description="Edit offer details">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading offer details...</div>
        </div>
      </RecruitmentLayout>
    );
  }

  if (!offer) {
    return (
      <RecruitmentLayout title="Offer Not Found" description="The requested offer was not found">
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
    <RecruitmentLayout title="Edit Offer" description={`Edit offer for ${offer.candidateId.name}`}>
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
              <h1 className="text-2xl font-bold text-white">Edit Offer</h1>
              <p className="text-gray-400">
                Update offer details for {offer.candidateId.name}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {offer.finalStatus === 'approved' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 text-yellow-400 rounded-full">
                  <AlertCircle size={14} />
                  <span className="text-sm">Offer is approved - changes may require re-approval</span>
                </div>
              )}
              <span className="text-sm text-gray-400">
                {changes.length} change{changes.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate Info (Read-only) */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Candidate Information</h2>
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Candidate</p>
                  <p className="text-xl font-bold text-white">{offer.candidateId.name}</p>
                  <p className="text-gray-400">{offer.candidateId.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Position Applied For</p>
                  <p className="text-white">{offer.applicationId.requisitionId.title}</p>
                  <p className="text-gray-400">{offer.applicationId.requisitionId.department}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">Note: Candidate information cannot be changed here</p>
              </div>
            </div>
          </div>

          {/* Compensation Details */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Compensation Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Position Title
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Offer Deadline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Base Salary (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.grossSalary}
                    onChange={(e) => handleChange('grossSalary', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Signing Bonus (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.signingBonus}
                    onChange={(e) => handleChange('signingBonus', e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Total Compensation Preview */}
            <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Compensation</p>
                  <p className="text-2xl font-bold text-white">
                    ${calculateTotalCompensation().toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Base: ${(parseFloat(formData.grossSalary) || 0).toLocaleString()}</p>
                  {parseFloat(formData.signingBonus) > 0 && (
                    <p className="text-sm text-green-400">
                      Bonus: +${(parseFloat(formData.signingBonus) || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Benefits & Perks</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">Benefits Package</label>
              
              {/* Current Benefits */}
              <div className="mb-4">
                {formData.benefits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-lg">
                        <CheckCircle size={14} className="text-blue-400" />
                        <span className="text-white">{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No benefits added yet</p>
                )}
              </div>
              
              {/* Add Benefit */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  placeholder="Add a benefit (e.g., Health Insurance, 401k Matching, etc.)"
                  className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Insurance Coverage
                </label>
                <textarea
                  value={formData.insurances}
                  onChange={(e) => handleChange('insurances', e.target.value)}
                  rows={3}
                  placeholder="Describe insurance coverage (health, dental, vision, life, etc.)"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Conditions & Terms
                </label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) => handleChange('conditions', e.target.value)}
                  rows={3}
                  placeholder="Any special conditions, contingencies, or terms"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Offer Letter Content */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Offer Letter Content</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Offer Letter Text
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-gray-500"
                placeholder="Dear [Candidate Name],

We are pleased to offer you the position of [Position Title] at [Company Name]...

Sincerely,
[Company Name] HR Team"
              />
            </div>
            
            <div className="p-4 bg-blue-600/10 border border-blue-700 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-white mb-1">Template Tips</h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• Use [Candidate Name] for personalized greeting</li>
                    <li>• Include start date, work location, and reporting structure</li>
                    <li>• Mention probation period if applicable</li>
                    <li>• Include confidentiality and non-compete clauses if needed</li>
                    <li>• Specify any required background checks or documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Change Summary */}
          {changes.length > 0 && (
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Changes Summary</h2>
              <div className="space-y-3">
                {changes.map((field, index) => {
                  let fieldName = '';
                  switch (field) {
                    case 'role': fieldName = 'Position Title'; break;
                    case 'grossSalary': fieldName = 'Base Salary'; break;
                    case 'signingBonus': fieldName = 'Signing Bonus'; break;
                    case 'benefits': fieldName = 'Benefits Package'; break;
                    case 'conditions': fieldName = 'Conditions'; break;
                    case 'insurances': fieldName = 'Insurance Coverage'; break;
                    case 'content': fieldName = 'Offer Letter Content'; break;
                    case 'deadline': fieldName = 'Offer Deadline'; break;
                    default: fieldName = field;
                  }
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-white">{fieldName}</span>
                      <span className="text-sm text-gray-400 ml-auto">Modified</span>
                    </div>
                  );
                })}
              </div>
              
              {offer.finalStatus === 'approved' && (
                <div className="mt-4 p-4 bg-yellow-600/10 border border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-white mb-1">Approval Required</h4>
                      <p className="text-sm text-yellow-300">
                        This offer has already been approved. Your changes may require re-approval 
                        from the original approvers or HR management.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push(`/recruitment/offers/${id}`)}
              className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium"
            >
              Discard Changes
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all changes?')) {
                    fetchOfferDetails();
                    setChanges([]);
                  }
                }}
                disabled={changes.length === 0}
                className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving || changes.length === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </RecruitmentLayout>
  );
}