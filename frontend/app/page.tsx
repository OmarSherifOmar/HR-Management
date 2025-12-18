'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    number: '',
    age: '',
    password: '',
    confirmPassword: '',
    role: 'Job Candidate',
    departmentId: '',
    positionId: '',
    resumeUrl: '',
    notes: '',
    status: 'APPLIED',
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/org/departments?active=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('Departments response full:', data);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          // Handle multiple response formats
          let departmentsArray = [];
          
          if (Array.isArray(data)) {
            departmentsArray = data;
          } else if (data?.data && Array.isArray(data.data)) {
            departmentsArray = data.data;
          } else if (data?.departments && Array.isArray(data.departments)) {
            departmentsArray = data.departments;
          } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Check if it has an id field (single department response)
            if (data._id || data.id) {
              departmentsArray = [data];
            } else {
              departmentsArray = [];
            }
          }
          
          console.log('Departments parsed count:', departmentsArray.length);
          console.log('Departments parsed array:', departmentsArray);
          setDepartments(departmentsArray);
        } else {
          console.error('Failed to fetch departments - status:', response.status);
          console.error('Response data:', data);
          setDepartments([]);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch positions when department is selected
  useEffect(() => {
    if (!signupData.departmentId) {
      // Clear positions if no department is selected
      setPositions([]);
      return;
    }

    const fetchPositionsByDepartment = async () => {
      setPositionsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/org/positions?departmentId=${signupData.departmentId}&active=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        console.log('Positions response full:', data);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          // Handle multiple response formats
          let positionsArray = [];
          
          if (Array.isArray(data)) {
            positionsArray = data;
          } else if (data?.data && Array.isArray(data.data)) {
            positionsArray = data.data;
          } else if (data?.positions && Array.isArray(data.positions)) {
            positionsArray = data.positions;
          } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Check if it has an id field (single position response)
            if (data._id || data.id) {
              positionsArray = [data];
            } else {
              positionsArray = [];
            }
          }
          
          console.log('Positions parsed count:', positionsArray.length);
          console.log('Positions parsed array:', positionsArray);
          setPositions(positionsArray);
          // Reset position selection when department changes
          setSignupData((prev) => ({ ...prev, positionId: '' }));
        } else {
          console.error('Failed to fetch positions - status:', response.status);
          console.error('Response data:', data);
          setPositions([]);
        }
      } catch (err) {
        console.error('Error fetching positions:', err);
        setPositions([]);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchPositionsByDepartment();
  }, [signupData.departmentId]);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!isLoading && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          login(data.user);
        }
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!signupData.age || isNaN(Number(signupData.age)) || Number(signupData.age) < 1) {
      setError('Please enter a valid age');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          number: signupData.number,
          age: Number(signupData.age),
          password: signupData.password,
          role: signupData.role,
          // Include optional candidate fields
          ...(signupData.departmentId && { departmentId: signupData.departmentId }),
          ...(signupData.positionId && { positionId: signupData.positionId }),
          ...(signupData.resumeUrl && { resumeUrl: signupData.resumeUrl }),
          ...(signupData.notes && { notes: signupData.notes }),
          ...(signupData.status && { status: signupData.status }),
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message for candidate registration
        setSuccess('Candidate registered successfully! Please wait for HR approval to become an employee. You can now log in with your credentials.');
        setError('');
        // Keep the email for login convenience
        setLoginData({ email: signupData.email, password: '' });
        // Clear signup form
        setSignupData({
          name: '',
          email: '',
          number: '',
          age: '',
          password: '',
          confirmPassword: '',
          role: 'Job Candidate',
          departmentId: '',
          positionId: '',
          resumeUrl: '',
          notes: '',
          status: 'APPLIED',
        });
        // Switch to login tab after a short delay to let user read the message
        setTimeout(() => {
          setActiveTab('login');
        }, 3000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            HR Management System
          </h1>
          <p className="text-gray-400">
            Manage your workforce efficiently
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
              activeTab === 'login'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
              activeTab === 'signup'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Forms Container */}
        <div className="bg-[#2a2a2a] p-8 rounded-lg">
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

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-number"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="signup-number"
                  type="tel"
                  required
                  value={signupData.number}
                  onChange={(e) => setSignupData({ ...signupData, number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-age"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Age
                </label>
                <input
                  id="signup-age"
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={signupData.age}
                  onChange={(e) => setSignupData({ ...signupData, age: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Role
                </label>
                <div className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white">
                  Job Candidate
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-department"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Department (Optional)
                  {departments.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">({departments.length} available)</span>
                  )}
                </label>
                <select
                  id="signup-department"
                  value={signupData.departmentId}
                  onChange={(e) => setSignupData({ ...signupData, departmentId: e.target.value })}
                  disabled={departmentsLoading}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white disabled:opacity-50"
                >
                  <option value="">-- Select a department --</option>
                  {departments && departments.length > 0 ? (
                    departments.map((department: any) => (
                      <option key={department._id || department.id} value={department._id || department.id}>
                        {department.departmentName || department.name || 'Unnamed Department'}
                      </option>
                    ))
                  ) : (
                    <option disabled>No departments available</option>
                  )}
                </select>
                {departmentsLoading && (
                  <p className="text-xs text-gray-400 mt-1">Loading departments...</p>
                )}
                {!departmentsLoading && departments.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No departments found</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-position"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Position Applying For (Optional)
                  {positions.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">({positions.length} available)</span>
                  )}
                </label>
                <select
                  id="signup-position"
                  value={signupData.positionId}
                  onChange={(e) => setSignupData({ ...signupData, positionId: e.target.value })}
                  disabled={positionsLoading || !signupData.departmentId}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white disabled:opacity-50"
                >
                  <option value="">-- Select a position --</option>
                  {!signupData.departmentId ? (
                    <option disabled>Select a department first</option>
                  ) : positions && positions.length > 0 ? (
                    positions.map((position: any) => (
                      <option key={position._id || position.id} value={position._id || position.id}>
                        {position.positionTitle || position.title || position.name || 'Unnamed Position'}
                      </option>
                    ))
                  ) : (
                    <option disabled>No positions available for this department</option>
                  )}
                </select>
                {positionsLoading && (
                  <p className="text-xs text-gray-400 mt-1">Loading positions...</p>
                )}
                {!positionsLoading && !signupData.departmentId && (
                  <p className="text-xs text-gray-500 mt-1">Select a department to view available positions</p>
                )}
                {!positionsLoading && signupData.departmentId && positions.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No positions found for this department</p>
                )}
              </div>

              {/* Optional Candidate Fields */}
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-4">Optional candidate information</p>
                
                <div>
                  <label
                    htmlFor="signup-resume"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Resume URL (Optional)
                  </label>
                  <input
                    id="signup-resume"
                    type="url"
                    value={signupData.resumeUrl}
                    onChange={(e) => setSignupData({ ...signupData, resumeUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                    placeholder="https://example.com/resume.pdf"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-notes"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="signup-notes"
                    value={signupData.notes}
                    onChange={(e) => setSignupData({ ...signupData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500 resize-none"
                    placeholder="Additional information about your application"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
