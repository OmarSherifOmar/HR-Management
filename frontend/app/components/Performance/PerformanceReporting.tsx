'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle } from 'lucide-react';

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

  // Normalize role for checking
  const normalizedRole = (userRole || '').toUpperCase().replace(/\s+/g, '_');
  const isHRRole = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN'].includes(normalizedRole);
  const isDepartmentHead = normalizedRole === 'DEPARTMENT_HEAD';
  const canGenerateReports = isHRRole || isDepartmentHead;

  useEffect(() => {
    fetchReports();
    if (canGenerateReports) {
      fetchCycles();
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Always use the employeeId-specific endpoint
      const url = `http://localhost:3000/api/performance/reporting/history/${employeeId}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.status === 403) {
        // Access denied is ok for non-HR roles
        setReports([]);
        return;
      }

      if (!response.ok) {
        // If endpoint doesn't exist or fails, just show empty
        console.log('[fetchReports] Response not ok:', response.status);
        setReports([]);
        return;
      }
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
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleGenerateReport = async (cycleId: string) => {
    try {
      console.log('[handleGenerateReport] Generating report for cycle:', cycleId);
      const response = await fetch(
        `http://localhost:3000/api/performance/reporting/outcome-report/${cycleId}`,
        {
          credentials: 'include',
        }
      );

      console.log('[handleGenerateReport] Response status:', response.status);

      if (response.status === 403) {
        onNotify?.('You do not have permission to generate reports', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleGenerateReport] Error:', errorData);
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const data = await response.json();
      console.log('[handleGenerateReport] Report data:', data);
      setGeneratedReport(data);
      onNotify?.('Report generated successfully', 'success');
    } catch (error: any) {
      onNotify?.(error.message || 'Error generating report', 'error');
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

      {/* Report Generation Controls */}
      {canGenerateReports && (
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
                <option key={cycle._id || cycle.id} value={cycle._id || cycle.id}>
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

      {/* Generated Report Display */}
      {generatedReport && (
        <div className="rounded-lg border border-green-700 bg-green-900/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              Generated Outcome Report
            </h3>
            <button
              onClick={() => setGeneratedReport(null)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400">Cycle</p>
              <p className="text-lg font-semibold text-white">{generatedReport.cycleName || 'N/A'}</p>
            </div>
            <div className="rounded bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400">Total Appraisals</p>
              <p className="text-lg font-semibold text-white">{generatedReport.totalAppraisals || 0}</p>
            </div>
            <div className="rounded bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-lg font-semibold text-green-400">{generatedReport.completedAppraisals || 0}</p>
            </div>
            <div className="rounded bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400">Average Score</p>
              <p className="text-lg font-semibold text-blue-400">{generatedReport.averageScore?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>

          {generatedReport.ratingDistribution && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Rating Distribution</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(generatedReport.ratingDistribution).map(([rating, count]) => (
                  <span key={rating} className="rounded bg-gray-700 px-3 py-1 text-sm text-white">
                    {rating}: <span className="font-semibold">{String(count)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {generatedReport.departmentBreakdown && generatedReport.departmentBreakdown.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Department Breakdown</p>
              <div className="space-y-2">
                {generatedReport.departmentBreakdown.map((dept: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded bg-gray-800/50 px-3 py-2">
                    <span className="text-sm text-gray-300">{dept.departmentName || 'Unknown'}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">Count: <span className="text-white">{dept.count || 0}</span></span>
                      <span className="text-gray-400">Avg: <span className="text-blue-400">{dept.averageScore?.toFixed(2) || 'N/A'}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <FileText size={24} className="mt-1 text-blue-400" />
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
