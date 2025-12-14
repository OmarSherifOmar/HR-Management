'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { authenticatedFetch } from '../../../context/AuthContext';
import { 
  ArrowLeft,
  Edit,
  Copy,
  Download,
  Printer,
  Building,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface JobTemplate {
  _id: string;
  title: string;
  department: string;
  qualifications: string[];
  skills: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

export default function JobTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<JobTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'usage'>('details');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await authenticatedFetch(`http://localhost:3000/job-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      } else {
        setError('Failed to load template');
      }
    } catch (err) {
      setError('Error fetching template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = () => {
    router.push(`/recruitment/job-templates/create?duplicate=${templateId}`);
  };

  const handleExport = (format: 'pdf' | 'doc') => {
    // In a real app, this would generate and download the file
    alert(`${format.toUpperCase()} export functionality would be implemented here`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Job Template" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading template details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!template) {
    return (
      <DashboardLayout title="Job Template" description="Template not found">
        <div className="text-center py-12">
          <p className="text-gray-400">Template not found</p>
          <button
            onClick={() => router.push('/recruitment/job-templates')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Templates
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={template.title}
      description={`Job template in ${template.department} department`}
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

      {/* Header */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{template.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-gray-400" />
                <span className="text-gray-400">{template.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-gray-400">{template.skills.length} skills</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-gray-400" />
                <span className="text-gray-400">{template.qualifications.length} qualifications</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/recruitment/job-templates/create?edit=${templateId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              <Copy size={16} />
              Duplicate
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Template Details
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 font-medium ${activeTab === 'usage' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Usage History
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Description */}
              {template.description && (
                <div className="bg-[#2a2a2a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Job Description</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-line">{template.description}</p>
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Required Skills</h3>
                {template.skills.length === 0 ? (
                  <p className="text-gray-400">No skills specified</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {template.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Qualifications */}
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Qualifications</h3>
                {template.qualifications.length === 0 ? (
                  <p className="text-gray-400">No qualifications specified</p>
                ) : (
                  <ul className="space-y-3">
                    {template.qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{qual}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Usage History</h3>
              <div className="space-y-4">
                {/* Mock usage data - in real app, fetch from API */}
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">Senior Developer Position</p>
                      <p className="text-gray-400 text-sm">Created from this template</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">March 15, 2024</p>
                      <p className="text-green-400 text-sm">Active</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">Junior Developer Position</p>
                      <p className="text-gray-400 text-sm">Created from this template</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">February 28, 2024</p>
                      <p className="text-green-400 text-sm">Filled</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">QA Engineer Position</p>
                      <p className="text-gray-400 text-sm">Modified from this template</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">January 10, 2024</p>
                      <p className="text-gray-400 text-sm">Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export Options */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Export Template</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                <Download size={20} />
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('doc')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Download size={20} />
                Export as Word
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                <Printer size={20} />
                Print Template
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Template Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">{formatDate(template.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Updated</p>
                <p className="text-white">{formatDate(template.updatedAt)}</p>
              </div>
              {template.createdBy && (
                <div>
                  <p className="text-sm text-gray-400">Created By</p>
                  <p className="text-white">{template.createdBy.name}</p>
                  <p className="text-gray-400 text-sm">{template.createdBy.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/recruitment/requisitions/create')}
                className="w-full text-left px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Create Job Requisition
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full text-left px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Similar Template
              </button>
              <button
                onClick={() => router.push(`/recruitment/job-templates/create?edit=${templateId}`)}
                className="w-full text-left px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Edit Template
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Times Used</span>
                <span className="text-white font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Jobs</span>
                <span className="text-white font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Filled Positions</span>
                <span className="text-white font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Success Rate</span>
                <span className="text-green-400 font-medium">67%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
