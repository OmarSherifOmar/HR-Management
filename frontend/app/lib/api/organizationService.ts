const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Helper to handle API response errors with proper 403 messages
 */
async function handleResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  // Try to get error message from response
  let errorMessage = defaultErrorMessage;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || defaultErrorMessage;
  } catch {
    // Use default message if parsing fails
  }

  // Handle 401 - Unauthorized (session expired)
  if (response.status === 401) {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('tokenExpiry');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  // Handle 403 - Forbidden (access denied)
  if (response.status === 403) {
    const friendlyMessage = errorMessage.toLowerCase().includes('unauthorized') 
      ? 'Access Denied: You do not have the required permissions to perform this action. Please contact your administrator if you believe this is an error.'
      : `Access Denied: ${errorMessage}`;
    throw new ApiError(friendlyMessage, 403);
  }

  // Handle other errors
  throw new ApiError(errorMessage, response.status);
}

// Department types
export interface Department {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  headPositionId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Position types
export interface Position {
  _id?: string;
  code: string;
  title: string;
  description?: string;
  departmentId: string;
  reportsToPositionId?: string;
  payGradeId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Change Request types
export interface ChangeRequest {
  _id?: string;
  employeeProfileId?: string;
  positionId?: string;
  departmentId?: string;
  requestType: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'IMPLEMENTED' | 'PENDING';
  description?: string;
  reason?: string;
  comments?: string;
  details?: string | any;
  createdAt?: string;
  updatedAt?: string;
  requestNumber?: string;
  targetDepartmentId?: string;
  targetPositionId?: string;
}

// Employee types
export interface Employee {
  _id?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  workEmail?: string;
  primaryPositionId?: any;
  primaryDepartmentId?: any;
  status?: string;
  dateOfHire?: string;
}

// === DEPARTMENTS ===
export async function createDepartment(data: any, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/createDepartment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Failed to create department');
}

export async function getDepartments(token?: string, active?: boolean) {
  let url = `${API_BASE}/api/org/departments`;
  if (active !== undefined) {
    url += `?active=${active}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch departments');
}

export async function getDepartmentById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch department');
}

export async function updateDepartment(id: string, data: any, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Failed to update department');
}

export async function deactivateDepartment(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to deactivate department');
}

export async function deleteDepartment(id: string, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/api/org/departments/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to delete department');
}

export async function getActivePositions(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}/activePositions`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch active positions');
}

// === POSITIONS ===
export async function createPosition(data: any, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Failed to create position');
}

export async function getPositions(token?: string, filters?: { departmentId?: string; active?: string }) {
  let url = `${API_BASE}/api/org/positions`;
  const params = new URLSearchParams();
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.active) params.append('active', filters.active);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch positions');
}

export async function getPositionById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch position');
}

export async function updatePosition(id: string, data: any, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/${id}/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Failed to update position');
}

export async function deactivatePosition(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to deactivate position');
}

export async function deletePosition(id: string, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/api/org/positions/${id}/delete`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to delete position');
}

// === CHANGE REQUESTS ===
export async function getChangeRequests(token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch change requests');
}

export async function getUserChangeRequests(token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/user/my-requests`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch user change requests');
}

export async function getChangeRequestById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch change request');
}

export async function approveChangeRequest(id: string, comments: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ comments }),
  });
  return handleResponse(response, 'Failed to approve change request');
}

export async function rejectChangeRequest(id: string, comments: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ comments }),
  });
  return handleResponse(response, 'Failed to reject change request');
}

export async function createChangeRequest(data: any, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Failed to create change request');
}

export async function submitChangeRequest(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to submit change request');
}

export async function deleteChangeRequest(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to delete change request');
}

// === PAY GRADES ===
export async function getPayGrades(token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const tokenValue = token || localStorage.getItem('token');
  if (tokenValue) {
    headers['Authorization'] = `Bearer ${tokenValue}`;
  }

  const response = await fetch(`${API_BASE}/api/org/requests/pay-grades`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch pay grades');
}

// === POSITION ASSIGNMENTS ===
export async function getPositionAssignments(token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const tokenValue = token || localStorage.getItem('token');
  if (tokenValue) {
    headers['Authorization'] = `Bearer ${tokenValue}`;
  }

  const response = await fetch(`${API_BASE}/api/org/requests/data/position-assignments`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch position assignments');
}

// === STRUCTURE APPROVALS ===
export async function getStructureApprovals(token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const tokenValue = token || localStorage.getItem('token');
  if (tokenValue) {
    headers['Authorization'] = `Bearer ${tokenValue}`;
  }

  const response = await fetch(`${API_BASE}/api/org/requests/data/structure-approvals`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch structure approvals');
}

// === STRUCTURE CHANGE LOGS ===
export async function getStructureChangeLogs(token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const tokenValue = token || localStorage.getItem('token');
  if (tokenValue) {
    headers['Authorization'] = `Bearer ${tokenValue}`;
  }

  const response = await fetch(`${API_BASE}/api/org/requests/data/structure-change-logs`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to fetch structure change logs');
}

// === EMPLOYEES ===
export async function searchEmployeeByNumber(employeeNumber: string, token?: string): Promise<Employee[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const tokenValue = token || localStorage.getItem('token');
  if (tokenValue) {
    headers['Authorization'] = `Bearer ${tokenValue}`;
  }

  const response = await fetch(`${API_BASE}/api/org/requests/search-employees?employeeNumber=${encodeURIComponent(employeeNumber)}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleResponse(response, 'Failed to search employees');
}