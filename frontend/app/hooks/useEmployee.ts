import { useState, useCallback } from 'react';

interface UseEmployeeProps {
  initialData?: any;
}

export const useEmployee = ({ initialData }: UseEmployeeProps = {}) => {
  const [employee, setEmployee] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch employee');
      const data = await response.json();
      setEmployee(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching employee:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmployee = useCallback(async (employeeId: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      const data = await response.json();
      setEmployee(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error updating employee:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error deleting employee:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employee,
    setEmployee,
    loading,
    error,
    fetchEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
