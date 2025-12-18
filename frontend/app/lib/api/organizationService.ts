const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create department');
  }
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
}

export async function getDepartmentById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch department');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to update department');
  return response.json();
}

export async function deactivateDepartment(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to deactivate department');
  return response.json();
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
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete department');
  }
  return response.json();
}

export async function getActivePositions(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/departments/${id}/activePositions`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch active positions');
  return response.json();
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
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create position');
  }
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch positions');
  return response.json();
}

export async function getPositionById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch position');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to update position');
  return response.json();
}

export async function deactivatePosition(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/positions/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to deactivate position');
  return response.json();
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
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete position');
  }
  return response.json();
}

// === CHANGE REQUESTS ===
export async function getChangeRequests(token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch change requests');
  return response.json();
}

export async function getUserChangeRequests(token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/user/my-requests`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch user change requests');
  return response.json();
}

export async function getChangeRequestById(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch change request');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to approve change request');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to reject change request');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to create change request');
  return response.json();
}

export async function submitChangeRequest(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to submit change request');
  return response.json();
}

export async function deleteChangeRequest(id: string, token?: string) {
  const response = await fetch(`${API_BASE}/api/org/requests/${id}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete change request');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch pay grades');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch position assignments');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch structure approvals');
  return response.json();
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
  if (!response.ok) throw new Error('Failed to fetch structure change logs');
  return response.json();
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to search employees (${response.status})`);
  }
  return response.json();
}