'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';

type ResetBasis = 'CALENDAR_YEAR' | 'FISCAL_YEAR' | 'HIRE_DATE_ANNIVERSARY';

interface LeaveYearConfig {
  resetBasis: ResetBasis;
  fiscalYearStartMonth?: number;
  fiscalYearStartDay?: number;
  proRateFirstYear: boolean;
  gracePeriodDays: number;
}

interface LeaveYearDates {
  startDate: string;
  endDate: string;
  nextResetDate: string;
}

export default function LeaveYearConfigPage() {
  const [config, setConfig] = useState<LeaveYearConfig>({
    resetBasis: 'CALENDAR_YEAR',
    fiscalYearStartMonth: 1,
    fiscalYearStartDay: 1,
    proRateFirstYear: true,
    gracePeriodDays: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [previewDates, setPreviewDates] = useState<LeaveYearDates | null>(null);
  const [testHireDate, setTestHireDate] = useState('2024-03-15');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config.resetBasis === 'HIRE_DATE_ANNIVERSARY') {
      calculatePreview();
    } else {
      calculatePreview();
    }
  }, [config, testHireDate]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/leaves/year-config', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const calculatePreview = async () => {
    try {
      let url = 'http://localhost:3000/leaves/year-config/calculate-dates?';
      if (config.resetBasis === 'HIRE_DATE_ANNIVERSARY') {
        url += `hireDate=${testHireDate}`;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPreviewDates(data);
      }
    } catch (error) {
      console.error('Failed to calculate preview:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const response = await fetch('http://localhost:3000/leaves/year-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Reset to default configuration (Calendar Year)?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/leaves/year-config/reset-to-default', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        alert('Reset to default configuration');
      }
    } catch (error) {
      console.error('Failed to reset:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout title="Leave Year Configuration" description="Define leave year and reset rules">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Leave Year Configuration</h1>
            <p className="text-gray-400 mt-1">
              Define how and when leave balances reset according to labor law and company policy
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetToDefault}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed relative"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
              {saved && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  ✓ Saved
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reset Basis Configuration</h2>
            
            {/* Reset Basis Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Reset Basis *</label>
              <p className="text-xs text-gray-500 mb-3">
                Determines when leave balances are reset and renewed
              </p>
              
              <div className="space-y-3">
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  config.resetBasis === 'CALENDAR_YEAR' ? 'border-blue-600 bg-blue-900/20' : 'border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="resetBasis"
                    value="CALENDAR_YEAR"
                    checked={config.resetBasis === 'CALENDAR_YEAR'}
                    onChange={(e) => setConfig({ ...config, resetBasis: e.target.value as ResetBasis })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-white">Calendar Year</div>
                    <div className="text-sm text-gray-400">
                      January 1st to December 31st (Standard calendar year)
                    </div>
                  </div>
                </label>

                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  config.resetBasis === 'FISCAL_YEAR' ? 'border-blue-600 bg-blue-900/20' : 'border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="resetBasis"
                    value="FISCAL_YEAR"
                    checked={config.resetBasis === 'FISCAL_YEAR'}
                    onChange={(e) => setConfig({ ...config, resetBasis: e.target.value as ResetBasis })}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white">Fiscal Year</div>
                    <div className="text-sm text-gray-400 mb-3">
                      Custom fiscal year start date (e.g., April 1st for some regions)
                    </div>
                    
                    {config.resetBasis === 'FISCAL_YEAR' && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Start Month</label>
                          <select
                            value={config.fiscalYearStartMonth}
                            onChange={(e) => setConfig({ ...config, fiscalYearStartMonth: parseInt(e.target.value) })}
                            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 text-sm focus:border-blue-600 focus:outline-none"
                          >
                            {monthNames.map((month, index) => (
                              <option key={index} value={index + 1}>{month}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Start Day</label>
                          <input
                            type="number"
                            value={config.fiscalYearStartDay}
                            onChange={(e) => setConfig({ ...config, fiscalYearStartDay: parseInt(e.target.value) })}
                            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-2 py-1 text-sm focus:border-blue-600 focus:outline-none"
                            min="1"
                            max="31"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  config.resetBasis === 'HIRE_DATE_ANNIVERSARY' ? 'border-blue-600 bg-blue-900/20' : 'border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="resetBasis"
                    value="HIRE_DATE_ANNIVERSARY"
                    checked={config.resetBasis === 'HIRE_DATE_ANNIVERSARY'}
                    onChange={(e) => setConfig({ ...config, resetBasis: e.target.value as ResetBasis })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-white">Hire Date Anniversary</div>
                    <div className="text-sm text-gray-400">
                      Based on each employee's hire date (personalized per employee)
                    </div>
                    <div className="text-xs text-amber-400 mt-1">
                      ⚠️ Each employee has their own reset date
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <h3 className="font-semibold text-white mb-2">Additional Settings</h3>
              
              <label className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-gray-700 rounded">
                <div>
                  <div className="font-medium text-white">Pro-Rate First Year</div>
                  <div className="text-sm text-gray-400">
                    Calculate proportional entitlement based on hire date in first year
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.proRateFirstYear}
                  onChange={(e) => setConfig({ ...config, proRateFirstYear: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <div className="p-3 bg-[#1a1a1a] border border-gray-700 rounded">
                <label className="block font-medium text-white mb-1">Grace Period (Days)</label>
                <div className="text-sm text-gray-400 mb-2">
                  Days after reset date where employees can still use old balance
                </div>
                <input
                  type="number"
                  value={config.gracePeriodDays}
                  onChange={(e) => setConfig({ ...config, gracePeriodDays: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                  min="0"
                  max="365"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 30 days grace period allows employees to use carry-forward balance until Jan 31st
                </p>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
            
            {config.resetBasis === 'HIRE_DATE_ANNIVERSARY' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Test Hire Date</label>
                <input
                  type="date"
                  value={testHireDate}
                  onChange={(e) => setTestHireDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}

            {previewDates && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded">
                  <div className="text-xs text-gray-400 mb-1">Leave Year Start</div>
                  <div className="font-semibold text-blue-400">
                    {new Date(previewDates.startDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="p-3 bg-green-900/30 border border-green-700/50 rounded">
                  <div className="text-xs text-gray-400 mb-1">Leave Year End</div>
                  <div className="font-semibold text-green-400">
                    {new Date(previewDates.endDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="p-3 bg-purple-900/30 border border-purple-700/50 rounded">
                  <div className="text-xs text-gray-400 mb-1">Next Reset Date</div>
                  <div className="font-semibold text-purple-400">
                    {new Date(previewDates.nextResetDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {config.gracePeriodDays > 0 && (
                  <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded">
                    <div className="text-xs text-gray-400 mb-1">Grace Period Until</div>
                    <div className="font-semibold text-amber-400">
                      {new Date(
                        new Date(previewDates.nextResetDate).getTime() + 
                        config.gracePeriodDays * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-[#1a1a1a] border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-sm text-white mb-2">ℹ️ How This Works</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {config.resetBasis === 'CALENDAR_YEAR' && (
                  <>
                    <li>• Leave balances reset on January 1st each year</li>
                    <li>• All employees reset on the same date</li>
                    <li>• Simple and easy to manage</li>
                  </>
                )}
                {config.resetBasis === 'FISCAL_YEAR' && (
                  <>
                    <li>• Leave balances reset on your fiscal year start</li>
                    <li>• All employees reset on the same date</li>
                    <li>• Aligns with company fiscal planning</li>
                  </>
                )}
                {config.resetBasis === 'HIRE_DATE_ANNIVERSARY' && (
                  <>
                    <li>• Each employee has their own reset date</li>
                    <li>• Based on their hire date anniversary</li>
                    <li>• More fair but requires more management</li>
                  </>
                )}
                {config.proRateFirstYear && (
                  <li className="text-green-400">✓ Pro-rating enabled for new hires</li>
                )}
                {config.gracePeriodDays > 0 && (
                  <li className="text-blue-400">✓ {config.gracePeriodDays}-day grace period active</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Compliance Info */}
        <div className="mt-6 bg-amber-900/20 border border-amber-700/50 rounded-lg p-6">
          <h3 className="font-bold text-amber-400 mb-2">📋 Legal Compliance Notes</h3>
          <div className="text-sm text-amber-300/80 space-y-1">
            <p>• This configuration affects all leave policies and entitlements across the system</p>
            <p>• Ensure compliance with local labor laws regarding leave year definitions</p>
            <p>• Some jurisdictions require specific reset dates (e.g., hire date anniversary)</p>
            <p>• Changes to this configuration may require recalculation of existing entitlements</p>
            <p>• Grace periods help manage transition periods during year-end resets</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
