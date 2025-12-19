'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { authenticatedFetch } from '../../context/AuthContext';
import { 
  FileText,
  Search,
  Filter,
  Plus,
  Building,
  Users,
  Edit,
  Trash2,
  Copy,
  Download
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
}

export default function JobTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchJobTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedDepartment]);

  const fetchJobTemplates = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(`${URL}/job-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        setError('Failed to load job templates');
      }
    } catch (err) {
      setError('Error fetching job templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(template =>
        template.department === selectedDepartment
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await authenticatedFetch(`${URL}/job-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(template => template._id !== id));
        setShowDeleteConfirm(null);
      } else {
        setError('Failed to delete template');
      }
    } catch (err) {
      setError('Error deleting template');
      console.error(err);
    }
  };

  const handleDuplicate = (template: JobTemplate) => {
    router.push(`/recruitment/job-templates/create?duplicate=${template._id}`);
  };

  const getDepartments = () => {
    const departments = new Set(templates.map(t => t.department));
    return Array.from(departments);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Job Templates" description="Loading job templates...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading job templates...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Job Templates" 
      description="Create and manage job description templates"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Templates</h1>
          <p className="text-gray-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => router.push('/recruitment/job-templates/create')}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Search Templates
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, department, or description..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Department
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white appearance-none"
              >
                <option value="all">All Departments</option>
                {getDepartments().map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Results
            </label>
            <div className="p-2 bg-[#1a1a1a] border border-gray-700 rounded-lg">
              <p className="text-white">
                Showing {filteredTemplates.length} of {templates.length} templates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-[#2a2a2a] rounded-lg">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || selectedDepartment !== 'all' 
              ? 'Try adjusting your search filters'
              : 'Create your first job template to get started'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
              router.push('/recruitment/job-templates/create');
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template._id} className="bg-[#2a2a2a] rounded-lg overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{template.title}</h3>
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{template.department}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                    Template
                  </span>
                </div>

                {template.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                )}

                {/* Skills and Qualifications */}
                <div className="space-y-3 mb-4">
                  {template.skills && template.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-white mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {template.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {template.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            +{template.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {template.qualifications && template.qualifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-white mb-1">Qualifications</p>
                      <div className="flex flex-wrap gap-1">
                        {template.qualifications.slice(0, 2).map((qual, index) => (
                          <span key={index} className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">
                            {qual}
                          </span>
                        ))}
                        {template.qualifications.length > 2 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            +{template.qualifications.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                  <span>Updated {formatDate(template.updatedAt)}</span>
                  <span>Created {formatDate(template.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#1a1a1a] px-6 py-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/recruitment/job-templates/${template._id}`)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                      title="View"
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/recruitment/job-templates/create?edit=${template._id}`)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(template._id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Template</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this job template? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
