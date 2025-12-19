import { useState, useCallback } from 'react';

interface EmployeeFilters {
  searchTerm?: string;
  department?: string;
  status?: string;
  sortBy?: 'name' | 'department' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({});

  const fetchEmployees = useCallback(async (filters?: EmployeeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.searchTerm) queryParams.append('search', filters.searchTerm);
      if (filters?.department) queryParams.append('department', filters.department);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/employees?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
      if (filters) setFilters(filters);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/employees/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return await response.json();
    } catch (err) {
      console.error('Error fetching statistics:', err);
      return null;
    }
  }, []);

  return {
    employees,
    loading,
    error,
    filters,
    fetchEmployees,
    getStatistics,
  };
};
