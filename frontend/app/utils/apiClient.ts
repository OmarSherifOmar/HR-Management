// API utility functions for frontend-backend communication
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
  });

  return response;
};

export const getAPIUrl = () => API_URL;
