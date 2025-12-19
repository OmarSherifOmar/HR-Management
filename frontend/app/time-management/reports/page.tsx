"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Filter, 
  Clock, 
  AlertTriangle,
  Users,
  User
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function ReportsContent() {
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [employeeCache, setEmployeeCache] = useState<Record<string, any>>({});

  const fetchEmployee = async (id: string) => {
    if (!id || employeeCache[id]) return;
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEmployeeCache(prev => ({ ...prev, [id]: data }));
      }
    } catch (e) {
      console.error(`Failed to fetch employee ${id}`, e);
    }
  };

  const fetchReport = async (type: string) => {
    setLoading(true);
    setReportData([]);
    try {
      let endpoint = '';
      // Map tabs to existing endpoints
      switch (type) {
        case 'overtime':
        case 'summary': // Reuse overtime report for summary as it contains daily stats
          endpoint = `/attendance/overtime-report?start=${dateRange.start}&end=${dateRange.end}`;
          break;
        case 'exceptions':
        case 'lateness': // Reuse exceptions endpoint and filter client-side
          endpoint = `/attendance/exceptions?start=${dateRange.start}&end=${dateRange.end}`;
          break;
        default:
          endpoint = `/attendance/overtime-report?start=${dateRange.start}&end=${dateRange.end}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        let data = await response.json();
        
        // Client-side filtering for Lateness tab
        if (type === 'lateness') {
          data = data.filter((item: any) => item.type === 'LATE');
        }

        setReportData(data);

        // Extract and fetch unique employee IDs
        const uniqueIds = new Set<string>();
        data.forEach((item: any) => {
            // Handle both populated object and raw ID string
            const empId = typeof item.employeeId === 'object' ? item.employeeId?._id : item.employeeId;
            if (empId) uniqueIds.add(empId);
        });
        uniqueIds.forEach(id => fetchEmployee(id));
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, dateRange]);


  const getEmployeeName = (item: any) => {
    // If employeeId is populated (e.g. in exceptions endpoint)
    if (item.employeeId && typeof item.employeeId === 'object' && item.employeeId.firstName) {
        return `${item.employeeId.firstName} ${item.employeeId.lastName}`;
    }
    // If we have it in cache
    const id = typeof item.employeeId === 'object' ? item.employeeId?._id : item.employeeId;
    const cached = employeeCache[id];
    if (cached) return `${cached.firstName} ${cached.lastName}`;
    
    return id || 'Unknown Employee';
  };

  const getDepartment = (item: any) => {
     const id = typeof item.employeeId === 'object' ? item.employeeId?._id : item.employeeId;
     const cached = employeeCache[id];
     return cached?.departmentId || 'N/A';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">Comprehensive time tracking insights and analytics</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-white"
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-white"
          />
        </div>

        <div className="ml-auto flex gap-2">
          {[
            { id: 'summary', label: 'Summary', icon: BarChart3 },
            { id: 'overtime', label: 'Overtime', icon: Clock },
            { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
            { id: 'lateness', label: 'Lateness', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-blue-900/20 text-blue-400 border border-blue-800' 
                  : 'text-gray-400 hover:bg-gray-700 border border-transparent'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart/Table Area */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 min-h-[400px]">
          <h3 className="text-lg font-semibold mb-6 capitalize text-white">{activeTab} Report</h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department</th>
                      {activeTab === 'overtime' || activeTab === 'summary' ? (
                         <>
                            <th className="px-4 py-3">Overtime (min)</th>
                            <th className="px-4 py-3">Short (min)</th>
                         </>
                      ) : (
                         <>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3">Status</th>
                         </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reportData.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                No records found for this period.
                            </td>
                        </tr>
                    ) : (
                      reportData.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 text-gray-300">
                            {new Date(item.date || item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                                <User className="w-3 h-3" />
                            </div>
                            {getEmployeeName(item)}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {getDepartment(item)}
                          </td>
                          
                          {activeTab === 'overtime' || activeTab === 'summary' ? (
                             <>
                                <td className="px-4 py-3 text-green-400 font-mono">
                                    {item.overtimeMinutes > 0 ? `+${item.overtimeMinutes}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-red-400 font-mono">
                                    {item.shortMinutes > 0 ? `-${item.shortMinutes}` : '-'}
                                </td>
                             </>
                          ) : (
                             <>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 truncate max-w-[150px]" title={item.reason}>
                                    {item.reason || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        item.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
                                        item.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
                                        'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                             </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Quick Stats</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Total Overtime</span>
                <span className="font-semibold text-white">
                    {/* Calculate total overtime from loaded data if applicable */}
                    {activeTab === 'overtime' || activeTab === 'summary' 
                        ? `${reportData.reduce((acc, curr) => acc + (curr.overtimeMinutes || 0), 0)} min`
                        : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-300">Exceptions Count</span>
                <span className="font-semibold text-red-400">
                    {activeTab === 'exceptions' || activeTab === 'lateness'
                        ? reportData.length
                        : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <DashboardLayout title="Reports" description="View attendance reports and analytics">
      <ReportsContent />
    </DashboardLayout>
  );
}
