'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../context/AuthContext';
import { ArrowLeft, Plus, X, Save, Copy } from 'lucide-react';

interface JobTemplate {
  _id: string;
  title: string;
  department: string;
  qualifications: string[];
  skills: string[];
  description?: string;
}

const departments = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Product',
  'Design',
  'Customer Support',
  'IT',
  'Legal',
  'Research & Development'
];

const commonSkills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'AWS',
  'Docker',
  'Kubernetes',
  'SQL',
  'NoSQL',
  'Git',
  'CI/CD',
  'Agile',
  'Scrum',
  'Project Management',
  'UI/UX Design',
  'Data Analysis',
  'Machine Learning',
  'Communication',
  'Leadership',
  'Problem Solving'
];

const commonQualifications = [
  "Bachelor's degree in relevant field",
  "Master's degree preferred",
  "3+ years of experience",
  "5+ years of experience",
  "Proven track record in similar role",
  "Industry certifications",
  "Portfolio of previous work",
  "Strong analytical skills",
  "Excellent communication skills",
  "Ability to work in fast-paced environment"
];

export default function CreateJobTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const duplicateId = searchParams.get('duplicate');

  const [loading, setLoading] = useState(!!editId || !!duplicateId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    skills: [] as string[],
    qualifications: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');

  useEffect(() => {
    const templateId = editId || duplicateId;
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [editId, duplicateId]);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await authenticatedFetch(`http://localhost:3000/job-templates/${id}`);
      if (response.ok) {
        const template: JobTemplate = await response.json();
        setFormData({
          title: duplicateId ? `${template.title} (Copy)` : template.title,
          department: template.department,
          description: template.description || '',
          skills: [...template.skills],
          qualifications: [...template.qualifications],
        });
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setSubmitting(false);
      return;
    }

    if (!formData.department) {
      setError('Department is required');
      setSubmitting(false);
      return;
    }

    try {
      const url = editId 
        ? `http://localhost:3000/job-templates/${editId}`
        : 'http://localhost:3000/job-templates';
      
      const method = editId ? 'PATCH' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editId ? 'Template updated successfully!' : 'Template created successfully!');
        
        // Reset form if not editing
        if (!editId) {
          setFormData({
            title: '',
            department: '',
            description: '',
            skills: [],
            qualifications: [],
          });
        }

        // Redirect after delay
        setTimeout(() => {
          router.push('/recruitment/job-templates');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save template');
      }
    } catch (err) {
      setError('Error saving template');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skill.trim()] });
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addQualification = (qual: string) => {
    if (qual.trim() && !formData.qualifications.includes(qual.trim())) {
      setFormData({ ...formData, qualifications: [...formData.qualifications, qual.trim()] });
    }
  };

  const removeQualification = (qual: string) => {
    setFormData({ ...formData, qualifications: formData.qualifications.filter(q => q !== qual) });
  };

  if (loading) {
    return (
      <DashboardLayout title="Job Template" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={editId ? "Edit Job Template" : "Create Job Template"}
      description={editId ? "Update existing template" : "Create a new job description template"}
    >
      <div className="mb-6">
        <button
          onClick={() => router.push('/recruitment/job-templates')}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Templates
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white mb-2">
              Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              placeholder="Describe the role, responsibilities, and expectations..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white resize-none"
            />
          </div>

          {/* Skills */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white mb-2">
              Required Skills
            </label>
            
            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkill);
                      setNewSkill('');
                    }
                  }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    addSkill(newSkill);
                    setNewSkill('');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Common Skills */}
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Common Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Skills */}
            {formData.skills.length > 0 && (
              <div className="p-4 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Selected Skills ({formData.skills.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-900/30 text-blue-300 rounded-lg"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-blue-200 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Qualifications */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white mb-2">
              Qualifications
            </label>
            
            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQualification(newQualification);
                      setNewQualification('');
                    }
                  }}
                  placeholder="Add a qualification and press Enter"
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    addQualification(newQualification);
                    setNewQualification('');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Common Qualifications */}
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Common Qualifications:</p>
                <div className="flex flex-wrap gap-2">
                  {commonQualifications.map((qual) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => addQualification(qual)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                    >
                      + {qual}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Qualifications */}
            {formData.qualifications.length > 0 && (
              <div className="p-4 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Selected Qualifications ({formData.qualifications.length}):</p>
                <div className="space-y-2">
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-900/10 rounded">
                      <span className="text-green-300">{qual}</span>
                      <button
                        type="button"
                        onClick={() => removeQualification(qual)}
                        className="text-green-200 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-white mb-2">
              Template Preview
            </label>
            <div className="p-6 bg-[#1a1a1a] rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">{formData.title || '[Job Title]'}</h3>
              {formData.department && (
                <p className="text-gray-400 mb-4">Department: {formData.department}</p>
              )}
              
              {formData.description && (
                <div className="mb-4">
                  <p className="text-white font-medium mb-2">Description:</p>
                  <p className="text-gray-300 whitespace-pre-line">{formData.description}</p>
                </div>
              )}

              {formData.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-white font-medium mb-2">Skills:</p>
                  <ul className="list-disc list-inside text-gray-300">
                    {formData.skills.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.qualifications.length > 0 && (
                <div>
                  <p className="text-white font-medium mb-2">Qualifications:</p>
                  <ul className="list-disc list-inside text-gray-300">
                    {formData.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/recruitment/job-templates')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  {editId ? <Save size={20} /> : <Plus size={20} />}
                  {editId ? 'Update Template' : 'Create Template'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
