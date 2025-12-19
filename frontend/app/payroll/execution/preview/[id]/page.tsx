'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { authenticatedFetch, useAuth } from '../../../../context/AuthContext';
import { ArrowLeft, AlertCircle, DollarSign, Users, Download } from 'lucide-react';

interface Employee {
  employeeId: string | { _id?: string; employeeNumber?: string; firstName?: string; lastName?: string };
  employeeNumber: string;
  employeeName: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  netPay: number;
  bankStatus: string;
  exceptions: boolean;
  employeePayrollDetailId?: string;
  hasIrregularities: boolean;
}

interface PreviewData {
  payrollRun: {
    runId: string;
    payrollPeriod: string;
    status: string;
    entity: string;
  };
  summary: {
    totalEmployees: number;
    employeesWithExceptions: number;
    employeesWithMissingBank: number;
    employeesWithNegativePay: number;
    totalBaseSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNetPay: number;
  };
  employees: Employee[];
  irregularities: Employee[];
}

export default function PayrollPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<any[] | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const userRoles = Array.isArray(user?.roles) ? user?.roles : user?.role ? [user.role] : [];
  const hasRole = (...allowed: string[]) =>
    userRoles.some((r) => allowed.map((a) => a.toLowerCase()).includes(String(r || '').toLowerCase()));

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`${URL}/payroll-execution/preview/${id}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payroll preview');
        }

        const previewData = await response.json();
        setData(previewData);
        // fetch payslips for this run (use human runId if available)
        try {
          setPayslips(null);
          const runIdForQuery = previewData?.payrollRun?.runId || id;
          const pRes = await authenticatedFetch(`${URL}/payroll-execution/payslips/run/${encodeURIComponent(runIdForQuery)}`, { method: 'GET' });
          if (pRes.ok) {
            const pJson = await pRes.json();
            setPayslips(Array.isArray(pJson) ? pJson : []);
          } else {
            setPayslips([]);
          }
        } catch (e) {
          setPayslips([]);
        }
      } catch (err: any) {
        console.error('Preview fetch error:', err);
        setError(err.message || 'An error occurred while fetching preview');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPreview();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout title="Payroll Preview" description="View employee breakdown and financial summary">
      <div className="min-h-screen bg-[#0d0d0d] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Payroll Preview</h1>
              <p className="text-gray-400 mt-1">View employee breakdown and financial summary</p>
            </div>
            {/* View escalations for this payroll run (manager/admin only) placed on the right */}
            {data && user && (user.role === 'Payroll Manager' || user.role === 'System Admin') && (
              <button
                onClick={() => router.push(`/payroll/execution/escalations/${encodeURIComponent(data.payrollRun.runId)}`)}
                className="ml-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                title="View escalations for this payroll run"
              >
                View Escalations
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading payroll preview...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Content */}
          {data && !loading && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Run ID</p>
                  <p className="text-xl font-semibold">{data.payrollRun.runId}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Entity</p>
                  <p className="text-xl font-semibold">{data.payrollRun.entity}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Payroll Period</p>
                  <p className="text-xl font-semibold">{formatDate(data.payrollRun.payrollPeriod)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 flex items-center gap-3">
                  <Users className="text-blue-400" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Employees</p>
                    <p className="text-2xl font-bold">{data.summary.totalEmployees}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Total Gross</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(data.summary.totalBaseSalary + data.summary.totalAllowances)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(data.summary.totalDeductions)}</p>
                </div>
                <div className="bg-green-900 bg-opacity-20 rounded-lg p-6 border border-green-800">
                  <p className="text-gray-400 text-sm mb-2">Total Net Pay</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(data.summary.totalNetPay)}</p>
                </div>
              </div>

              {/* Employee Breakdown */}
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users size={20} className="text-blue-400" />
                    Employee Breakdown
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800 bg-[#0d0d0d]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Employee ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Gross</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Deductions</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Net</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employees && data.employees.length > 0 ? (
                        data.employees.map((emp, idx) => {
                          // Handle employeeId being either string or object
                          const empIdStr = typeof emp.employeeId === 'object' ? emp.employeeId._id || emp.employeeId.employeeNumber || 'N/A' : emp.employeeId;
                          const empNameStr = typeof emp.employeeId === 'object' ? `${emp.employeeId.firstName || ''} ${emp.employeeId.lastName || ''}`.trim() || emp.employeeName : emp.employeeName;
                          
                          return (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-300">
                                <div>{empIdStr}</div>
                                {/** show the employeePayrollDetailId (internal doc id) for clarity */}
                                {(emp as any).employeePayrollDetailId && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <div>Detail ID: {(emp as any).employeePayrollDetailId}</div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText((emp as any).employeePayrollDetailId);
                                          // small visual feedback
                                          // eslint-disable-next-line no-alert
                                          alert('Detail ID copied to clipboard');
                                        } catch (e) {
                                          // eslint-disable-next-line no-alert
                                          alert('Failed to copy ID');
                                        }
                                      }}
                                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">{empNameStr}</td>
                              <td className="px-6 py-4 text-sm text-right text-blue-400">{formatCurrency(emp.baseSalary + emp.allowances)}</td>
                              <td className="px-6 py-4 text-sm text-right text-red-400">{formatCurrency(emp.deductions)}</td>
                              <td className="px-6 py-4 text-sm text-right text-green-400 font-semibold">{formatCurrency(emp.netPay)}</td>
                              <td className="px-6 py-4 text-sm text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {hasRole('payroll specialist') && (
                                    <button
                                      onClick={async () => {
                                      const detailId = (emp as any).employeePayrollDetailId || '';
                                      if (detailId) {
                                        router.push(`/payroll/execution/escalate?detailId=${encodeURIComponent(detailId)}`);
                                      } else {
                                        router.push(`/payroll/execution/escalate`);
                                      }
                                    }}
                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
                                  >
                                    Escalate
                                    </button>
                                  )}

                                  {hasRole('payroll specialist') && (
                                    <button
                                      onClick={async () => {
                                      try {
                                        setDownloadError(null);
                                        // find payslip for this employee from cached payslips
                                        const empId = typeof emp.employeeId === 'object' ? (emp.employeeId._id || emp.employeeNumber) : emp.employeeId;
                                        let match: any = null;
                                        if (payslips && payslips.length > 0) {
                                          match = payslips.find((ps: any) => {
                                            const pEmp = ps.employeeId;
                                            if (!pEmp) return false;
                                            if (typeof pEmp === 'object') {
                                              return String(pEmp._id) === String(empId) || String(pEmp.employeeNumber) === String(empId);
                                            }
                                            return String(pEmp) === String(empId);
                                          });
                                        }

                                        if (!match) {
                                          // fallback: refresh payslips and try again
                                          const pRes = await authenticatedFetch(`${URL}/payroll-execution/payslips/run/${encodeURIComponent(data?.payrollRun?.runId || id)}`, { method: 'GET' });
                                          if (pRes.ok) {
                                            const pJson = await pRes.json();
                                            setPayslips(Array.isArray(pJson) ? pJson : []);
                                            match = (Array.isArray(pJson) ? pJson : []).find((ps: any) => {
                                              const pEmp = ps.employeeId;
                                              if (!pEmp) return false;
                                              if (typeof pEmp === 'object') {
                                                return String(pEmp._id) === String(empId) || String(pEmp.employeeNumber) === String(empId);
                                              }
                                              return String(pEmp) === String(empId);
                                            });
                                          }
                                        }

                                        if (!match) {
                                          setDownloadError('Payslip not found for this employee. Generate payslips first.');
                                          return;
                                        }

                                        const payslipId = match._id;
                                        setDownloadLoading(payslipId);
                                        const res = await authenticatedFetch(`${URL}/payroll-execution/payslips/${payslipId}/pdf`, { method: 'GET' });
                                        if (!res.ok) {
                                          const txt = await res.text();
                                          throw new Error(txt || `Error ${res.status}`);
                                        }
                                        const blob = await res.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        // include employee name in filename when available
                                        const namePart = typeof emp.employeeId === 'object' ? `${(emp.employeeId.firstName || '').replace(/\s+/g, '_')}_${(emp.employeeId.lastName || '').replace(/\s+/g, '_')}` : emp.employeeName?.replace(/\s+/g, '_') || '';
                                        a.download = `payslip-${payslipId}${namePart ? `-${namePart}` : ''}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(url);
                                      } catch (err: any) {
                                        setDownloadError(err.message || 'Failed to download payslip PDF');
                                      } finally {
                                        setDownloadLoading(null);
                                      }
                                    }}
                                    disabled={Boolean(downloadLoading)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                                  >
                                      {downloadLoading === ( (payslips && payslips.length) ? payslips.find((ps:any)=>{
                                        const pEmp = ps.employeeId;
                                        if (!pEmp) return false;
                                        if (typeof pEmp === 'object') return String(pEmp._id) === String(typeof emp.employeeId === 'object' ? (emp.employeeId._id || emp.employeeNumber) : emp.employeeId) || String(pEmp.employeeNumber) === String(emp.employeeNumber);
                                        return String(pEmp) === String(emp.employeeId);
                                      })?._id : null) ? (
                                        'Downloading...'
                                      ) : (
                                        <Download size={16} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                            No employees in this payroll run
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
