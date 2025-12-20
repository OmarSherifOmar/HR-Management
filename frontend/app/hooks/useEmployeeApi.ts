'use client';

import { useCallback } from 'react';

export const useEmployeeApi = () => {
  const createEmployee = useCallback(async (employeeData: any) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }, []);

  const uploadProfilePicture = useCallback(async (employeeId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/employees/${employeeId}/profile-picture`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }, []);

  const searchEmployees = useCallback(async (query: string) => {
    try {
      const response = await fetch(
        `/api/employees/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search employees');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }, []);

  return {
    createEmployee,
    uploadProfilePicture,
    searchEmployees,
  };
};
