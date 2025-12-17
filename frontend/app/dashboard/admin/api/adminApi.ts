import { authenticatedFetch } from '../../../context/AuthContext';

const ENDPOINTS = {
  leaveTypes: '/leaves/types',
  policies: '/leaves/configuration/policies',
  accrualRun: '/leaves/accruals/run',
  accrualHistory: '/leaves/accruals/history',
  carryRun: '/leaves/carryforward/run',
  carryHistory: '/leaves/carryforward/history',
  suspensions: '/leaves/accruals/suspensions',
  suspensionsUpdate: (id: string) => `/leaves/accruals/suspensions/${id}`,
  payrollStatus: '/payroll/sync/status',
  payrollRun: '/payroll/sync/run',
  payrollHistory: '/payroll/sync/history',
};

async function getJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function fetchLeaveTypes() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.leaveTypes}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch leave types');
  return getJson(res);
}

export async function fetchPolicies() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.policies}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch policies');
  return getJson(res);
}

export async function runAccrual(leaveTypeId?: string) {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.accrualRun}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveTypeId ? { leaveTypeId } : {}),
  });
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Accrual run failed');
  return getJson(res);
}

export async function fetchAccrualHistory() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.accrualHistory}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch accrual history');
  return getJson(res);
}

export async function runCarryForward(leaveTypeId?: string) {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.carryRun}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveTypeId ? { leaveTypeId } : {}),
  });
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Carry-forward run failed');
  return getJson(res);
}

export async function fetchCarryHistory() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.carryHistory}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch carry-forward history');
  return getJson(res);
}

export async function fetchSuspensions() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.suspensions}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch suspensions');
  return getJson(res);
}

export async function createSuspension(payload: any) {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.suspensions}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to create suspension');
  return getJson(res);
}

export async function updateSuspension(id: string, payload: any) {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.suspensionsUpdate(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to update suspension');
  return getJson(res);
}

export async function fetchPayrollStatus() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.payrollStatus}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch payroll status');
  return getJson(res);
}

export async function runPayrollSync(employeeId?: string) {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.payrollRun}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeId ? { employeeId } : {}),
  });
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Payroll sync failed');
  return getJson(res);
}

export async function fetchPayrollHistory() {
  const res = await authenticatedFetch(`http://localhost:3000${ENDPOINTS.payrollHistory}`);
  if (!res.ok) throw new Error((await getJson(res))?.message || 'Failed to fetch payroll history');
  return getJson(res);
}

export default ENDPOINTS;
