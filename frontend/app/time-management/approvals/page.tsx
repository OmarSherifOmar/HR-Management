"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [employeeCache, setEmployeeCache] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmployee = async (id: string) => {
    if (employeeCache[id]) return;
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

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch pending corrections
      const response = await fetch(`${API_BASE_URL}/corrections/pending`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
        
        // Fetch employee details for all requests
        const uniqueIds = Array.from(new Set(data.map((r: any) => r.employeeId)));
        uniqueIds.forEach((id: any) => fetchEmployee(id));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const endpoint = action === 'approve' 
        ? `${API_BASE_URL}/corrections/${id}/approve`
        : `${API_BASE_URL}/corrections/${id}/reject`;
        
      const body = action === 'approve' 
        ? { approvedBy: 'CURRENT_USER_ID' } // In real app, get from auth context
        : { approvedBy: 'CURRENT_USER_ID', reason: 'Manager rejected' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Remove from list
        setRequests(prev => prev.filter(r => r._id !== id));
        setSelectedRequest(null);
      } else {
        alert('Failed to process request');
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    const emp = employeeCache[req.employeeId];
    const name = emp ? `${emp.firstName} ${emp.lastName}` : req.employeeId;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-900 min-h-screen text-gray-100">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Pending Approvals</p>
          <h3 className="text-4xl font-light text-yellow-500 mt-2">{requests.length}</h3>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Approved Today</p>
          <h3 className="text-4xl font-light text-green-500 mt-2">0</h3>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Rejected Today</p>
          <h3 className="text-4xl font-light text-red-500 mt-2">0</h3>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Escalated</p>
          <h3 className="text-4xl font-light text-orange-500 mt-2">0</h3>
        </div>
      </div>

      {/* Alert Banner */}
      {requests.length > 0 && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-red-400 font-medium">{requests.length} pending requests require action before payroll cutoff</p>
              <p className="text-red-500/60 text-sm">All time corrections and overtime approvals must be completed by end of month</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/60 transition-colors text-sm">
            Review All
          </button>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Pending ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'approved' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Approved
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'rejected' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Rejected
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search requests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            Filter by Type
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            Filter by Department
          </button>
        </div>
      </div>

      {/* Request List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No pending requests found</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredRequests.map((req) => {
              const emp = employeeCache[req.employeeId];
              return (
                <div key={req._id} className="p-6 hover:bg-gray-700/50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Avatar Placeholder */}
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-medium text-lg">
                        {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : <User className="w-6 h-6" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-lg text-gray-200">
                            {emp ? `${emp.firstName} ${emp.lastName}` : 'Loading...'}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-800">
                            {emp?.departmentId || 'Department'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-8 mt-3">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Request Type</p>
                            <p className="text-gray-300 text-sm font-medium">Attendance Correction</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Details</p>
                            <p className="text-gray-300 text-sm">{req.reason || 'Manual Adjustment'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Date</p>
                            <p className="text-gray-300 text-sm">
                              {req.attendanceRecord ? 'View Record' : new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-gray-500 text-xs">Submitted: {new Date(req.createdAt).toLocaleString()}</span>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleAction(req._id, 'reject')}
                          className="px-3 py-1.5 border border-red-900/50 text-red-400 rounded hover:bg-red-900/20 text-sm"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAction(req._id, 'approve')}
                          className="px-3 py-1.5 bg-green-900/30 text-green-400 border border-green-900/50 rounded hover:bg-green-900/40 text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
