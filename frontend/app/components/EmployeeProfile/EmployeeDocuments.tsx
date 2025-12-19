'use client';

import { FileText, Download, Upload } from 'lucide-react';
import { useState } from 'react';

interface EmployeeDocumentsProps {
  employeeId: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    uploadedDate: string;
    url: string;
  }[];
}

export default function EmployeeDocuments({
  employeeId,
  documents = [],
}: EmployeeDocumentsProps) {
  const [uploading, setUploading] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/employees/${employeeId}/documents`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        // Refresh documents list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Documents</h3>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium">
          <Upload size={18} />
          <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          <input
            type="file"
            onChange={handleDocumentUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#333333] transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-[#333333] rounded">
                  <FileText size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(doc.uploadedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <a
                href={doc.url}
                download
                className="p-2 hover:bg-[#333333] rounded transition-colors text-gray-400 hover:text-blue-400"
              >
                <Download size={18} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-400">No documents uploaded yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload documents like resumes, certifications, or contracts
          </p>
        </div>
      )}
    </div>
  );
}
