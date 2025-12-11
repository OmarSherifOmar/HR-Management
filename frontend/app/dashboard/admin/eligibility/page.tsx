'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Edit2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

type LeaveType = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  paid: boolean;
  categoryId: {
    _id: string;
    name: string;
  } | string;
  minTenureMonths?: number;
};

type LeavePolicy = {
  _id: string;
  leaveTypeId: string | LeaveType;
  eligibility?: {
    minTenureMonths?: number;
    positionsAllowed?: string[];
    contractTypesAllowed?: string[];
  };
};

type Position = {
  _id: string;
  code: string;
  title: string;
};

type ContractType = 'FULL_TIME_CONTRACT' | 'PART_TIME_CONTRACT';

export default function EligibilityRulesPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<Map<string, LeavePolicy>>(new Map());
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);
  const [editMinTenure, setEditMinTenure] = useState<number | ''>('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [editContractTypes, setEditContractTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const contractTypes: ContractType[] = ['FULL_TIME_CONTRACT', 'PART_TIME_CONTRACT'];

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (isLoggedIn && user?.role === 'HR Admin') {
      fetchData();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch leave types
      const leaveTypesResponse = await fetch('http://localhost:3000/leaves/types', {
        credentials: 'include',
      });

      if (!leaveTypesResponse.ok) {
        throw new Error('Failed to fetch leave types');
      }

      const leaveTypesData = await leaveTypesResponse.json();
      console.log('Leave types data:', leaveTypesData);
      setLeaveTypes(leaveTypesData);

      // Fetch policies to get eligibility rules
      const policiesResponse = await fetch('http://localhost:3000/leaves/configuration/policies', {
        credentials: 'include',
      });

      if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        console.log('Policies data:', policiesData);
        
        // Create a map of leaveTypeId -> policy
        const policyMap = new Map<string, LeavePolicy>();
        policiesData.forEach((policy: LeavePolicy) => {
          const leaveTypeId = typeof policy.leaveTypeId === 'string' 
            ? policy.leaveTypeId 
            : policy.leaveTypeId._id;
          policyMap.set(leaveTypeId, policy);
        });
        setPolicies(policyMap);
      }

      // Fetch positions
      const positionsResponse = await fetch('http://localhost:3000/api/org/positions', {
        credentials: 'include',
      });

      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (leaveType: LeaveType) => {
    const policy = policies.get(leaveType._id);
    setEditingLeaveTypeId(leaveType._id);
    setEditMinTenure(policy?.eligibility?.minTenureMonths ?? leaveType.minTenureMonths ?? '');
    setEditPositions(policy?.eligibility?.positionsAllowed || []);
    setEditContractTypes(policy?.eligibility?.contractTypesAllowed || []);
    setError(null);
    setSuccess(null);
  };

  const cancelEditing = () => {
    setEditingLeaveTypeId(null);
    setEditMinTenure('');
    setEditPositions([]);
    setEditContractTypes([]);
  };

  const handleSave = async (leaveType: LeaveType) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const policy = policies.get(leaveType._id);
      
      if (!policy) {
        throw new Error('No policy found for this leave type. Please create a leave policy first.');
      }

      const payload = {
        minTenureMonths: editMinTenure !== '' ? Number(editMinTenure) : undefined,
        positionsAllowed: editPositions.length > 0 ? editPositions : undefined,
        contractTypesAllowed: editContractTypes.length > 0 ? editContractTypes : undefined,
      };

      const response = await fetch(`http://localhost:3000/leaves/eligibility/policy/${policy._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update eligibility rules');
      }

      const updatedPolicy = await response.json();
      
      // Update local state
      const newPolicies = new Map(policies);
      newPolicies.set(leaveType._id, updatedPolicy);
      setPolicies(newPolicies);
      
      setSuccess(`Eligibility rules updated successfully for ${leaveType.name}`);
      setEditingLeaveTypeId(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update eligibility rules');
    } finally {
      setSaving(false);
    }
  };

  const togglePosition = (positionId: string) => {
    setEditPositions(prev => 
      prev.includes(positionId) 
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const toggleContractType = (contractType: string) => {
    setEditContractTypes(prev => 
      prev.includes(contractType)
        ? prev.filter(ct => ct !== contractType)
        : [...prev, contractType]
    );
  };

  const getPositionName = (positionId: string): string => {
    const position = positions.find(p => p._id === positionId);
    return position ? `${position.title} (${position.code})` : positionId;
  };

  const formatContractType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryName = (leaveType: LeaveType): string => {
    if (typeof leaveType.categoryId === 'string') {
      return '';
    }
    return leaveType.categoryId?.name || '';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'HR Admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-purple-500" size={28} />
            Eligibility Rules Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Set eligibility requirements for each leave policy based on tenure, position, and contract type
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Leave Types List */}
        {leaveTypes.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <Shield size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No leave types found</p>
            <p className="text-gray-500 text-sm">Create leave types first to set eligibility rules</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveTypes.map((leaveType) => {
              const policy = policies.get(leaveType._id);
              const isEditing = editingLeaveTypeId === leaveType._id;
              
              return (
              <div
                key={leaveType._id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6"
              >
                {/* Leave Type Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {leaveType.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">Code: {leaveType.code}</p>
                      {getCategoryName(leaveType) && (
                        <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs">
                          {getCategoryName(leaveType)}
                        </span>
                      )}
                      {!policy && (
                        <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-400 rounded text-xs">
                          No Policy Created
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(leaveType)}
                        disabled={saving || !policy}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(leaveType)}
                      disabled={!policy}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!policy ? 'Create a leave policy for this leave type first' : 'Edit eligibility rules'}
                    >
                      <Edit2 size={16} />
                      Edit Rules
                    </button>
                  )}
                </div>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-6">
                    {/* Minimum Tenure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Tenure (months)
                      </label>
                      <input
                        type="number"
                        value={editMinTenure}
                        onChange={(e) => setEditMinTenure(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full md:w-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        placeholder="No minimum"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum months of employment required to be eligible
                      </p>
                    </div>

                    {/* Contract Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Allowed Contract Types
                      </label>
                      <div className="space-y-2">
                        {contractTypes.map((contractType) => (
                          <label
                            key={contractType}
                            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editContractTypes.includes(contractType)}
                              onChange={() => toggleContractType(contractType)}
                              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-white">{formatContractType(contractType)}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Leave blank to allow all contract types
                      </p>
                    </div>

                    {/* Positions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Allowed Positions
                      </label>
                      {positions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No positions available</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-800 rounded-lg p-3">
                          {positions.map((position) => (
                            <label
                              key={position._id}
                              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={editPositions.includes(position._id)}
                                onChange={() => togglePosition(position._id)}
                                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                              />
                              <div>
                                <span className="text-white">{position.title}</span>
                                <span className="text-gray-500 text-sm ml-2">({position.code})</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Leave blank to allow all positions
                      </p>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    {/* Current Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tenure */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Minimum Tenure</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.minTenureMonths 
                            ? `${policy.eligibility.minTenureMonths} months`
                            : leaveType.minTenureMonths
                            ? `${leaveType.minTenureMonths} months`
                            : 'No minimum'
                          }
                        </p>
                      </div>

                      {/* Contract Types */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Contract Types</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.contractTypesAllowed && policy.eligibility.contractTypesAllowed.length > 0
                            ? `${policy.eligibility.contractTypesAllowed.length} type(s)`
                            : 'All types allowed'
                          }
                        </p>
                      </div>

                      {/* Positions */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Positions</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.positionsAllowed && policy.eligibility.positionsAllowed.length > 0
                            ? `${policy.eligibility.positionsAllowed.length} position(s)`
                            : 'All positions allowed'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Detailed View */}
                    {policy?.eligibility && (policy.eligibility.contractTypesAllowed?.length || policy.eligibility.positionsAllowed?.length) && (
                      <div className="pt-4 border-t border-gray-800 space-y-3">
                        {policy.eligibility.contractTypesAllowed && policy.eligibility.contractTypesAllowed.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Allowed Contract Types:</p>
                            <div className="flex flex-wrap gap-2">
                              {policy.eligibility.contractTypesAllowed.map((ct) => (
                                <span
                                  key={ct}
                                  className="px-3 py-1 bg-purple-900/30 border border-purple-700 text-purple-300 rounded-full text-sm"
                                >
                                  {formatContractType(ct)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {policy.eligibility.positionsAllowed && policy.eligibility.positionsAllowed.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Allowed Positions:</p>
                            <div className="flex flex-wrap gap-2">
                              {policy.eligibility.positionsAllowed.map((posId) => (
                                <span
                                  key={posId}
                                  className="px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-full text-sm"
                                >
                                  {getPositionName(posId)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
