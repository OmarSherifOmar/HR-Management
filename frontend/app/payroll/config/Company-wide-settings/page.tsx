"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Download, RefreshCw } from 'lucide-react';

// IANA Timezones
const TIMEZONES  = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Algiers",
  "Africa/Asmara",
  "Africa/Asmera",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Banjul",
  "Africa/Bissau",
  "Africa/Blantyre",
  "Africa/Brazzaville",
  "Africa/Bujumbura",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Ceuta",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Dar_es_Salaam",
  "Africa/Djibouti",
  "Africa/Douala",
  "Africa/El_Aaiun",
  "Africa/Freetown",
  "Africa/Gaborone",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Juba",
  "Africa/Kampala",
  "Africa/Khartoum",
  "Africa/Kigali",
  "Africa/Kinshasa",
  "Africa/Lagos",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Luanda",
  "Africa/Lubumbashi",
  "Africa/Lusaka",
  "Africa/Malabo",
  "Africa/Maputo",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Mogadishu",
  "Africa/Monrovia",
  "Africa/Nairobi",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Sao_Tome",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Windhoek",
  "Etc/GMT-2",
  "Etc/GMT-3",
  "Etc/GMT-4",
  "Etc/GMT-5",
  "Etc/GMT-6",
  "Etc/GMT-7",
  "Etc/GMT-8",
  "Etc/GMT-9",
  "Etc/GMT-10",
  "Etc/GMT-11",
  "Etc/GMT-12",
  "Etc/GMT0",
  "Etc/Greenwich",
  "Europe/Dublin",
  "Europe/Gibraltar",
  "Europe/Guernsey",
  "Europe/Helsinki",
  "Europe/Isle_of_Man",
  "Europe/Istanbul",
  "Europe/Jersey",
  "Europe/Kaliningrad",
  "Europe/Kiev",
 
];


// ISO 4217 Currencies
const CURRENCIES = [
  "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN",
  "BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BRL",
  "BSD","BTN","BWP","BYN","BZD",
  "CAD","CDF","CHF","CLP","CNY","COP","CRC","CUP","CVE","CZK",
  "DJF","DKK","DOP","DZD",
  "EGP","ERN","ETB","EUR",
  "FJD","FKP",
  "GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD",
  "HKD","HNL","HRK","HTG","HUF",
  "IDR","ILS","INR","IQD","IRR","ISK",
  "JMD","JOD","JPY",
  "KES","KGS","KHR","KMF","KRW","KWD","KYD","KZT",
  "LAK","LBP","LKR","LRD","LSL","LYD",
  "MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN",
  "NAD","NGN","NIO","NOK","NPR","NZD",
  "OMR",
  "PAB","PEN","PGK","PHP","PKR","PLN","PYG",
  "QAR",
  "RON","RSD","RUB","RWF",
  "SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","SSP","STN","SYP","SZL",
  "THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS",
  "UAH","UGX","USD","UYU","UZS",
  "VES","VND",
  "XAF","XCD","XOF","XPF",
  "YER",
  "ZAR","ZMW"
];


const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function http<T = any>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
    });

    const status = response.status;
    const ok = response.ok;

    let data: T | undefined;
    let error: string | undefined;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await response.json();
        if (ok) data = json;
        else error = json.message || json.error || `HTTP ${status}`;
      } catch (parseError) {
        error = `Failed to parse response: ${parseError}`;
      }
    } else {
      try {
        const text = await response.text();
        if (ok) data = text as unknown as T;
        else error = text || `HTTP ${status}`;
      } catch (textError) {
        error = `Failed to read response: ${textError}`;
      }
    }

    if (!ok && !error) error = `Request failed with status ${status}`;

    return { ok, status, data, error };
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      error: `Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`,
    };
  }
}

interface CompanyWideSettings {
  _id: string;
  payDate: string;
  timeZone: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateSettingsData {
  payDate?: string;
  timeZone?: string;
  currency?: string;
}

export default function CompanyWideSettingsPage() {
  const [settings, setSettings] = useState<CompanyWideSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateSettingsData>({ payDate: '', timeZone: '', currency: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);
  const [currSearch, setCurrSearch] = useState('');
  const [currOpen, setCurrOpen] = useState(false);

  const [backups, setBackups] = useState<string[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    const res = await http<CompanyWideSettings>('/payroll-configuration/company-wide-settings/current');
    if (res.ok && res.data) {
      setSettings(res.data);
      const payDateObj = new Date(res.data.payDate);
      setFormData({
        payDate: payDateObj.toLocaleDateString('en-CA'),
        timeZone: res.data.timeZone || '',
        currency: res.data.currency || 'EGP',
      });
      setTzSearch(res.data.timeZone || '');
      setCurrSearch(res.data.currency || '');
    } else {
      setError(res.error || 'Failed to fetch settings');
    }
    setLoading(false);
  };

  const fetchBackups = async () => {
    setBackupsLoading(true);
    const res = await http<string[]>('/payroll-configuration/backups');
    if (res.ok && res.data) setBackups(res.data);
    setBackupsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, []);

  const handleRefresh = () => {
    fetchSettings();
    fetchBackups();
  };

  const validate = (data: UpdateSettingsData) => {
    if (!data.payDate?.trim()) return 'Pay date is required';
    const payDateObj = new Date(data.payDate);
    if (isNaN(payDateObj.getTime())) return 'Invalid pay date format';
    if (!data.timeZone?.trim()) return 'Time zone is required';
    if (!data.currency?.trim()) return 'Currency is required';
    return null;
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(formData);
    if (v) {
      setFormError(v);
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const updateData: UpdateSettingsData = {
      payDate: new Date(formData.payDate!).toISOString().split('T')[0],
      timeZone: formData.timeZone,
      currency: formData.currency,
    };

    const res = await http<CompanyWideSettings>('/payroll-configuration/company-wide-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (res.ok) {
      setIsEditOpen(false);
      fetchSettings();
    } else setFormError(res.error || 'Failed to update settings');
    setSubmitting(false);
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    const res = await http('/payroll-configuration/backups', { method: 'POST' });
    if (res.ok) {
      fetchBackups();
    } else {
      alert(res.error || 'Failed to create backup');
    }
    setCreatingBackup(false);
  };

  return (
    <DashboardLayout title="Payroll Config — Company-wide Settings" description="Manage global company settings and backups">
      <div className="space-y-8">
        {/* Settings Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Company Settings</h1>
              <p className="text-gray-400">Configure global payroll settings for your organization</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRefresh} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2">
                <RefreshCw size={16} /> Refresh
              </button>
              <button onClick={() => setIsEditOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Edit Settings
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center text-gray-400">Loading...</div>
          ) : settings ? (
            <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Pay Date</p>
                  <p className="text-lg text-white">{new Date(settings.payDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Time Zone</p>
                  <p className="text-lg text-white">{settings.timeZone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Currency</p>
                  <p className="text-lg text-white">{settings.currency}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg p-8 text-center text-gray-400">No settings found</div>
          )}

          {isEditOpen && settings && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Edit Company Settings</h3>
                {formError && <div className="bg-red-600/20 border border-red-600 rounded p-3 mb-4"><p className="text-red-300 text-sm">{formError}</p></div>}
                <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pay Date *</label>
                    <input
                      type="date"
                      value={formData.payDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, payDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tzSearch}
                        onChange={(e) => { setTzSearch(e.target.value); setTzOpen(true); }}
                        onFocus={() => setTzOpen(true)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
                        placeholder="Search timezones..."
                      />
                      {tzOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg max-h-48 overflow-y-auto z-10">
                          {TIMEZONES.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase())).map(tz => (
                            <button
                              key={tz}
                              type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, timeZone: tz })); setTzSearch(tz); setTzOpen(false); }}
                              className="w-full text-left px-3 py-2 text-white hover:bg-[#333333] transition-colors"
                            >
                              {tz}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Currency *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currSearch}
                        onChange={(e) => { setCurrSearch(e.target.value); setCurrOpen(true); }}
                        onFocus={() => setCurrOpen(true)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white"
                        placeholder="Search currencies..."
                      />
                      {currOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg max-h-48 overflow-y-auto z-10">
                          {CURRENCIES.filter(curr => curr.toLowerCase().includes(currSearch.toLowerCase())).map(curr => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, currency: curr })); setCurrSearch(curr); setCurrOpen(false); }}
                              className="w-full text-left px-3 py-2 text-white hover:bg-[#333333] transition-colors"
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className="px-4 py-2 text-gray-300 hover:text-white"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {submitting ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Backups Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Database Backups</h2>
              <p className="text-gray-400">Create and manage system backups</p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-green-800 flex items-center gap-2"
            >
              <Download size={16} /> {creatingBackup ? 'Creating...' : 'Create Backup'}
            </button>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#333333]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Backup Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {backupsLoading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Loading backups...</td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">No backups found</td>
                  </tr>
                ) : (
                  backups.map((backup) => {
                    // Extract admin name and timestamp from backup directory name
                    // Format: 2025-12-16T04-30-45-123Z_AdminName
                    const lastUnderscoreIndex = backup.lastIndexOf('_');
                    const timestampPart = backup.substring(0, lastUnderscoreIndex);
                    const adminNamePart = backup.substring(lastUnderscoreIndex + 1);
                    
                    // Restore ISO format: 2025-12-16T04-30-45-123Z -> 2025-12-16T04:30:45.123Z
                    const isoTimestamp = timestampPart
                      .replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3}Z)/, 'T$1:$2:$3.$4');
                    const createdDate = new Date(isoTimestamp);
                    const createdStr = !isNaN(createdDate.getTime()) ? createdDate.toLocaleString() : 'Invalid date';
                    
                    return (
                      <tr key={backup} className="hover:bg-[#333333] transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{adminNamePart.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4 text-gray-400">{createdStr}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
