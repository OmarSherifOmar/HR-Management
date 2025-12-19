// Eligibility page removed — eligibility is now managed from the Personalized Entitlements flow.
// This placeholder keeps the route safe but intentionally does not expose the old UI.

import DashboardLayout from '../../../components/DashboardLayout';

export default function EligibilityRulesPagePlaceholder() {
  return (
    <DashboardLayout title="Eligibility rules" description="Eligibility is managed from the Personalized Entitlements UI">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Eligibility Management Deprecated</h2>
        <p className="text-sm text-gray-400 mt-2">Eligibility rules are now configured when assigning entitlements. Use the Personalized Entitlements page.</p>
      </div>
    </DashboardLayout>
  );
                                <span className="text-white">{position.title}</span>
                                <span className="text-gray-500 text-sm ml-2">({position.code})</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Leave blank to allow all positions
                      </p>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    {/* Current Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tenure */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Minimum Tenure</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.minTenureMonths 
                            ? `${policy.eligibility.minTenureMonths} months`
                            : leaveType.minTenureMonths
                            ? `${leaveType.minTenureMonths} months`
                            : 'No minimum'
                          }
                        </p>
                      </div>

                      {/* Contract Types */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Contract Types</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.contractTypesAllowed && policy.eligibility.contractTypesAllowed.length > 0
                            ? `${policy.eligibility.contractTypesAllowed.length} type(s)`
                            : 'All types allowed'
                          }
                        </p>
                      </div>

                      {/* Positions */}
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Positions</p>
                        <p className="text-white font-medium">
                          {policy?.eligibility?.positionsAllowed && policy.eligibility.positionsAllowed.length > 0
                            ? `${policy.eligibility.positionsAllowed.length} position(s)`
                            : 'All positions allowed'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Detailed View */}
                    {policy?.eligibility && (policy.eligibility.contractTypesAllowed?.length || policy.eligibility.positionsAllowed?.length) && (
                      <div className="pt-4 border-t border-gray-800 space-y-3">
                        {policy.eligibility.contractTypesAllowed && policy.eligibility.contractTypesAllowed.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Allowed Contract Types:</p>
                            <div className="flex flex-wrap gap-2">
                              {policy.eligibility.contractTypesAllowed.map((ct) => (
                                <span
                                  key={ct}
                                  className="px-3 py-1 bg-purple-900/30 border border-purple-700 text-purple-300 rounded-full text-sm"
                                >
                                  {formatContractType(ct)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {policy.eligibility.positionsAllowed && policy.eligibility.positionsAllowed.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Allowed Positions:</p>
                            <div className="flex flex-wrap gap-2">
                              {policy.eligibility.positionsAllowed.map((posId) => (
                                <span
                                  key={posId}
                                  className="px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-full text-sm"
                                >
                                  {getPositionName(posId)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
