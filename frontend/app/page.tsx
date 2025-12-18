'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { getAPIUrl } from './utils/apiClient';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    role: 'department employee',
  });

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!isLoading && isLoggedIn) {
      router.push('/payroll');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = getAPIUrl();
      const response = await fetch(`${API_URL}/auth/login`, {
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
        router.push('/payroll');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Make sure the backend is running on port 3002.');
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
      const API_URL = getAPIUrl();
      const response = await fetch(`${API_URL}/auth/register`, {
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
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Switch to login tab after successful registration
        setActiveTab('login');
        setError('');
        setLoginData({ email: signupData.email, password: '' });
        setSignupData({
          name: '',
          email: '',
          number: '',
          age: '',
          password: '',
          confirmPassword: '',
          role: 'department employee',
        });
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to connect to server. Make sure the backend is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // If already logged in, show option to go to dashboard or logout
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="bg-[#2a2a2a] p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">You are already logged in</h2>
          <p className="text-gray-400 mb-6">Would you like to go to the dashboard?</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/payroll')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
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
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all ${activeTab === 'login'
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
            }}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all ${activeTab === 'signup'
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
                <label
                  htmlFor="signup-role"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Role
                </label>
                <select
                  id="signup-role"
                  value={signupData.role}
                  onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 text-white"
                >
                  <option value="department employee">Department Employee</option>
                  <option value="department head">Department Head</option>
                  <option value="HR Employee">HR Employee</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="HR Admin">HR Admin</option>
                  <option value="Payroll Specialist">Payroll Specialist</option>
                  <option value="Payroll Manager">Payroll Manager</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Finance Staff">Finance Staff</option>
                  <option value="System Admin">System Admin</option>
                  <option value="Legal & Policy Admin">Legal & Policy Admin</option>
                  <option value="Job Candidate">Job Candidate</option>
                </select>
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
