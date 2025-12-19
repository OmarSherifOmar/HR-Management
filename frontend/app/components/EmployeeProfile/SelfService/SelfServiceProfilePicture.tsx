'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { RoleBasedAccess } from '../../Auth/RoleBasedAccess';
import { useCanAccess } from '@/app/hooks/useRole';
import { Upload, X, AlertCircle, Check } from 'lucide-react';

export default function SelfServiceProfilePicture() {
  const { user } = useAuth();
  const { canUploadProfilePicture } = useCanAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingPicture, setExistingPicture] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing profile picture on mount
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        console.log('[SelfServiceProfilePicture] Fetching profile...');
        const response = await fetch('http://localhost:3000/employees/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[SelfServiceProfilePicture] Profile data:', data);
          if (data.profilePictureUrl) {
            const fullUrl = data.profilePictureUrl.startsWith('http')
              ? data.profilePictureUrl
              : `http://localhost:3000${data.profilePictureUrl}`;
            console.log('[SelfServiceProfilePicture] Setting existing picture:', fullUrl);
            setExistingPicture(fullUrl);
          } else {
            console.log('[SelfServiceProfilePicture] No profilePictureUrl in response');
          }
        }
      } catch (err) {
        console.error('[SelfServiceProfilePicture] Error fetching profile:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfilePicture();
  }, []);

  // Listen for profile update events from change requests approval
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[SelfServiceProfilePicture] Profile update event received:', customEvent.detail);
      
      // Refresh profile picture
      const fetchProfilePicture = async () => {
        try {
          const response = await fetch('http://localhost:3000/employees/me', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.profilePictureUrl) {
              const fullUrl = data.profilePictureUrl.startsWith('http')
                ? data.profilePictureUrl
                : `http://localhost:3000${data.profilePictureUrl}`;
              setExistingPicture(fullUrl);
            }
          }
        } catch (err) {
          console.error('[SelfServiceProfilePicture] Error refreshing picture:', err);
        }
      };

      fetchProfilePicture();
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert data URL to base64
      const base64 = preview.split(',')[1];
      const fileName = `profile-${user?.id || Date.now()}.jpg`;

      console.log('[SelfServiceProfilePicture] Uploading profile picture...');
      const response = await fetch('http://localhost:3000/employees/me/profile-picture', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64,
          fileName,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SelfServiceProfilePicture] Upload error:', errorData);
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }

      const uploadResponse = await response.json();
      console.log('[SelfServiceProfilePicture] Upload response:', uploadResponse);
      
      // Refetch profile to get the updated profile picture URL
      try {
        const profileResponse = await fetch('http://localhost:3000/employees/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('[SelfServiceProfilePicture] Refreshed profile data:', profileData);
          if (profileData.profilePictureUrl) {
            const fullUrl = profileData.profilePictureUrl.startsWith('http')
              ? profileData.profilePictureUrl
              : `http://localhost:3000${profileData.profilePictureUrl}`;
            console.log('[SelfServiceProfilePicture] Setting picture from refreshed profile:', fullUrl);
            setExistingPicture(fullUrl);
          } else {
            // Fallback: Set preview as existing picture
            console.log('[SelfServiceProfilePicture] No profilePictureUrl in response, using preview');
            setExistingPicture(preview);
          }
        }
      } catch (fetchErr) {
        console.error('[SelfServiceProfilePicture] Failed to refresh profile:', fetchErr);
        // Fallback: Set preview as existing picture
        setExistingPicture(preview);
      }

      setSuccess('Profile picture updated successfully!');
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[SelfServiceProfilePicture] Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
  };

  return (
    <RoleBasedAccess requiredAccess={canUploadProfilePicture}>
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">Profile Picture</h3>

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

        <div className="flex gap-6">
          {/* Current Picture */}
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-3">Current Picture</p>
            <div className="w-32 h-32 bg-[#1a1a1a] rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
              {isFetching ? (
                <div className="text-center text-gray-400">
                  <p className="text-xs">Loading...</p>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : existingPicture ? (
                <img
                  src={existingPicture}
                  alt="Current Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('[SelfServiceProfilePicture] Image failed to load:', existingPicture);
                    setError(`Failed to load image: ${existingPicture}`);
                  }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-xs">No image</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-3">Upload New Picture</p>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-[#333333]/50 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-white font-medium text-sm">Choose image</p>
                <p className="text-gray-400 text-xs mt-1">
                  or drag and drop
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  JPG, PNG up to 5MB
                </p>
              </button>
            </div>

            {preview && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Check size={16} />
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleBasedAccess>
  );
}
