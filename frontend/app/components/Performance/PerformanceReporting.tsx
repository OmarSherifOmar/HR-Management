'use client';

import React, { useState, useEffect } from 'react';
import { Archive, Download, FileText, CheckCircle } from 'lucide-react';

interface Report {
  id: string;
  cycleId: string;
  type: 'OUTCOME_REPORT' | 'ARCHIVE';
  totalAppraisals: number;
  completedAppraisals: number;
  archivedDate?: string;
  generatedAt: string;
}

interface PerformanceReportingProps {
  userRole: string | null;
  employeeId: string;
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export default function PerformanceReporting({ userRole, employeeId, onNotify }: PerformanceReportingProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState('');

  const isHRRole = ['HR Manager', 'HR Admin', 'System Admin'].includes(userRole || '');

  useEffect(() => {
    fetchReports();
    if (isHRRole) {
      fetchCycles();
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/performance/reporting/history/${employeeId}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 403) {
        onNotify?.('Access denied to reports', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      onNotify?.('Error loading reports', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycles = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/performance/cycles', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch cycles');
      const data = await response.json();
      setCycles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };

  const handleArchive = async (cycleId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/performance/reporting/archive/${cycleId}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (response.status === 403) {
        onNotify?.('You do not have permission to archive appraisals', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to archive cycle');

      onNotify?.('Cycle archived successfully', 'success');
      fetchReports();
    } catch (error) {
      onNotify?.('Error archiving cycle', 'error');
      console.error(error);
    }
  };

  const handleGenerateReport = async (cycleId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/performance/reporting/outcome-report/${cycleId}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 403) {
        onNotify?.('You do not have permission to generate reports', 'error');
        return;
      }

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      onNotify?.('Report generated successfully', 'success');
      fetchReports();
    } catch (error) {
      onNotify?.('Error generating report', 'error');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-white">Performance Reports & Archiving</h2>

      {/* HR Controls */}
      {isHRRole && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-4 font-semibold text-white">Archive & Generate Reports</h3>
          <div className="flex flex-col gap-4 md:flex-row">
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="rounded bg-gray-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a cycle...</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (!selectedCycleId) {
                  onNotify?.('Please select a cycle', 'error');
                  return;
                }
                handleArchive(selectedCycleId);
              }}
              className="flex items-center gap-2 rounded bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
            >
              <Archive size={16} />
              Archive Cycle
            </button>

            <button
              onClick={() => {
                if (!selectedCycleId) {
                  onNotify?.('Please select a cycle', 'error');
                  return;
                }
                handleGenerateReport(selectedCycleId);
              }}
              className="flex items-center gap-2 rounded bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/30"
            >
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div>
        <h3 className="mb-4 font-semibold text-white">Reports & Archives</h3>
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500">No reports available</p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-4"
              >
                <div className="flex items-start gap-4">
                  {report.type === 'ARCHIVE' ? (
                    <Archive size={24} className="mt-1 text-yellow-400" />
                  ) : (
                    <FileText size={24} className="mt-1 text-blue-400" />
                  )}
                  <div>
                    <h4 className="font-semibold text-white">
                      {report.type === 'ARCHIVE' ? 'Archived Cycle' : 'Outcome Report'}
                    </h4>
                    <p className="text-xs text-gray-400">Cycle: {report.cycleId}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {report.completedAppraisals} / {report.totalAppraisals} appraisals completed
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                    {report.archivedDate && (
                      <p className="text-xs text-gray-500">
                        Archived: {new Date(report.archivedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.completedAppraisals === report.totalAppraisals && (
                    <CheckCircle size={20} className="text-green-400" />
                  )}
                  <button className="flex items-center gap-2 rounded bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-600/30">
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      {reports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
            <p className="text-xs text-gray-400">Total Reports</p>
            <p className="mt-2 text-2xl font-bold text-white">{reports.length}</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
            <p className="text-xs text-gray-400">Archived Cycles</p>
            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {reports.filter((r) => r.type === 'ARCHIVE').length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
            <p className="text-xs text-gray-400">Total Appraisals Processed</p>
            <p className="mt-2 text-2xl font-bold text-blue-400">
              {reports.reduce((sum, r) => sum + r.completedAppraisals, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
