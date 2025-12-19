'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import {
  Mail,
  Phone,
  MapPin,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface ContactUpdateRequest {
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function SelfServiceContactInfo() {
  const { user } = useAuth();
  const { canUpdateMyContact } = useCanAccess();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [contactData, setContactData] = useState({
    mobilePhone: '',
    address: '',
    city: '',
    country: '',
    personalEmail: '',
  });
  const [originalData, setOriginalData] = useState({
    mobilePhone: '',
    address: '',
    city: '',
    country: '',
    personalEmail: '',
  });
  const [changeRequests, setChangeRequests] = useState<ContactUpdateRequest[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch('http://localhost:3000/employees/me', {
        credentials: 'include',
      });
      
      if (response.status === 401) {
        console.warn('Authentication expired. Please log in again.');
        setError('Your session has expired. Please log in again.');
        return;
      }
      
      if (response.status === 403) {
        console.warn('Access denied to profile.');
        setError('Access Denied: You do not have permission to view this profile. Please contact your administrator.');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SelfServiceContactInfo] Fetched profile:', data);
        const contactInfo = {
          mobilePhone: data.mobilePhone || '',
          address: data.address?.streetAddress || '',
          city: data.address?.city || '',
          country: data.address?.country || '',
          personalEmail: data.personalEmail || '',
        };
        console.log('[SelfServiceContactInfo] Setting contact data:', contactInfo);
        setContactData(contactInfo);
        setOriginalData(contactInfo);
      } else {
        console.error('Failed to fetch profile:', response.statusText);
        setError(`Failed to load profile: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please check your connection.');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Listen for profile update events from change requests approval
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[SelfServiceContactInfo] Profile update event received:', customEvent.detail);
      
      // Refresh profile data
      fetchProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, [fetchProfile]);

  const handleInputChange = (field: keyof typeof contactData, value: string) => {
    setContactData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Sending contact update:', {
        mobilePhone: contactData.mobilePhone,
        address: contactData.address,
        personalEmail: contactData.personalEmail,
      });

      const response = await fetch('http://localhost:3000/employees/me/contact', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobilePhone: contactData.mobilePhone,
          address: contactData.address,
          city: contactData.city,
          country: contactData.country,
          personalEmail: contactData.personalEmail,
        }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('API JSON Error:', errorData);
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
        } catch (parseErr) {
          try {
            const errorText = await response.text();
            console.error('API Text Error:', errorText);
            if (errorText && errorText.length > 0) {
              errorMessage = errorText.substring(0, 200);
            }
          } catch (textErr) {
            console.error('Could not parse error response');
          }
        }
        
        // If error message is still generic, add more context
        if (errorMessage.startsWith('Error:')) {
          if (response.status === 400) {
            errorMessage += ' - Please check your input data';
          } else if (response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (response.status === 404) {
            errorMessage += ' - Employee profile not found';
          } else if (response.status === 500) {
            errorMessage += ' - Server error. Please try again later';
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Update result:', result);

      // Backend returns either:
      // { updated } - if phone/address changed
      // { changeRequest } - if email needs approval
      // { updated, changeRequest } - if both changed
      // or just the employee object if nothing changed
      
      let successMsg = 'Contact information updated successfully!';
      
      // Only create change request if email actually changed
      const emailChanged = contactData.personalEmail !== originalData.personalEmail;
      
      if (result.changeRequest && emailChanged) {
        setChangeRequests((prev) => [
          ...prev,
          {
            field: 'personalEmail',
            oldValue: originalData.personalEmail,
            newValue: contactData.personalEmail,
            reason: 'Self-service update',
            status: 'pending',
          },
        ]);
        successMsg = result.updated
          ? 'Phone and address updated. Email change submitted for approval.'
          : 'Email change submitted for approval.';
      }

      setSuccess(successMsg);
      setOriginalData(contactData);
      setIsEditing(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Update error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContactData(originalData);
    setIsEditing(false);
    setError('');
  };

  return (
    <RoleBasedAccess requiredAccess={canUpdateMyContact}>
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Contact Information</h3>
          {!isEditing && !isFetching && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
          )}
        </div>

        {isFetching && (
          <div className="p-4 text-center text-gray-400">
            <p>Loading profile information...</p>
          </div>
        )}

        {!isFetching && (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Mobile Phone */}
              <div className="flex items-start gap-4">
                <Phone size={20} className="text-blue-400 mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">
                    Mobile Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={contactData.mobilePhone}
                      onChange={(e) =>
                        handleInputChange('mobilePhone', e.target.value)
                      }
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter mobile phone"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {contactData.mobilePhone || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-blue-400 mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={contactData.address}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      rows={3}
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {contactData.address || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* City */}
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-blue-400 mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={contactData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter your city"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {contactData.city || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-blue-400 mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={contactData.country}
                      onChange={(e) =>
                        handleInputChange('country', e.target.value)
                      }
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter your country"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {contactData.country || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Email */}
              <div className="flex items-start gap-4">
                <Mail size={20} className="text-blue-400 mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">
                    Personal Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={contactData.personalEmail}
                      onChange={(e) =>
                        handleInputChange('personalEmail', e.target.value)
                      }
                      className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter personal email"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {contactData.personalEmail || 'Not provided'}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-gray-400 mt-1">
                      Email changes require HR approval
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Check size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}

            {/* Pending Change Requests */}
            {changeRequests.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-yellow-400 mb-3">
                  Pending Changes
                </h4>
                <div className="space-y-2">
                  {changeRequests
                    .filter((req) => req.status === 'pending')
                    .map((req, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-yellow-900/20 border border-yellow-700 rounded text-sm text-yellow-200"
                      >
                        {req.field}: {req.oldValue} → {req.newValue}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RoleBasedAccess>
  );
}
