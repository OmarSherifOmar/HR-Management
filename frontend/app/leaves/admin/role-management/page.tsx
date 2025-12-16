"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";

interface Permission {
  key: string;
  label: string;
  category: string;
}

interface RolePermissions {
  role: string;
  permissions: string[];
  description: string;
  canDelegate: boolean;
  maxApprovalAmount?: number;
}

interface UserRole {
  userId: string;
  role: string;
  assignedBy: string;
  assignedAt: string;
  scope?: {
    type: string;
    entityId?: string;
  };
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

export default function RoleManagementPage() {
  const { user, isLoggedIn, isLoading, refreshPermissions } = useAuth();
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "approvals">("roles");
  
  // Role permissions state
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  
  // User assignment state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeRoles, setEmployeeRoles] = useState<UserRole[]>([]);
  const [assignRole, setAssignRole] = useState<string>("");
  const [assignScope, setAssignScope] = useState<string>("organization");
  const [assignValidFrom, setAssignValidFrom] = useState<string>("");
  const [assignValidUntil, setAssignValidUntil] = useState<string>("");
  
  // Approval chain state
  const [approvalChain, setApprovalChain] = useState<any[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }

    if (!isLoading && user && user.role !== 'HR Admin') {
      router.replace('/dashboard');
      return;
    }

    if (!isLoading && isLoggedIn) {
      fetchInitialData();
    }
  }, [isLoading, isLoggedIn, user, router]);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchAllRoles(),
      fetchAvailablePermissions(),
      fetchEmployees(),
      fetchApprovalChain(),
    ]);
  };

  const fetchAllRoles = async () => {
    try {
      const response = await fetch("http://localhost:3000/leaves/role-management/roles", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err: any) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await fetch("http://localhost:3000/leaves/role-management/available-permissions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      
      // Group permissions by category
      const permissions: Permission[] = (data.permissions || []).map((p: string) => ({
        key: p,
        label: formatPermissionLabel(p),
        category: getPermissionCategory(p),
      }));
      
      setAvailablePermissions(permissions);
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:3000/employees/searchs", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchApprovalChain = async () => {
    try {
      const response = await fetch("http://localhost:3000/leaves/role-management/approval-chain", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch approval chain");
      const data = await response.json();
      setApprovalChain(data.chain || []);
    } catch (err: any) {
      console.error("Error fetching approval chain:", err);
    }
  };

  const handleSelectRole = async (role: string) => {
    setSelectedRole(role);
    try {
      const response = await fetch(`http://localhost:3000/leaves/role-management/roles/${role}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch role details");
      const data = await response.json();
      setRolePermissions(data);
    } catch (err: any) {
      console.error("Error fetching role details:", err);
    }
  };

  const handleSelectEmployee = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    try {
      const response = await fetch(`http://localhost:3000/leaves/role-management/users/${employeeId}/roles`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch employee roles");
      const data = await response.json();
      setEmployeeRoles(data.roles || []);
    } catch (err: any) {
      console.error("Error fetching employee roles:", err);
      setEmployeeRoles([]);
    }
  };

  const handleTogglePermission = async (permission: string) => {
    if (!rolePermissions) return;
    
    const hasPermission = rolePermissions.permissions.includes(permission);
    
    try {
      setLoading(true);
      setError(null);
      
      const url = hasPermission
        ? `http://localhost:3000/leaves/role-management/roles/${selectedRole}/permissions/${permission}`
        : `http://localhost:3000/leaves/role-management/roles/${selectedRole}/permissions`;
      
      const response = await fetch(url, {
        method: hasPermission ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: hasPermission ? undefined : JSON.stringify({ permission }),
      });
      
      if (!response.ok) throw new Error("Failed to update permission");
      
      const data = await response.json();
      setRolePermissions(data);
      setSuccess(`Permission ${hasPermission ? "removed" : "added"} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh roles list
      fetchAllRoles();
      
      // Refresh current user's permissions if they modified their own role
      if (user && selectedRole === user.role) {
        await refreshPermissions();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedEmployee || !assignRole) {
      setError("Please select an employee and role");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3000/leaves/role-management/users/${selectedEmployee}/roles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            role: assignRole,
            scope: {
              type: assignScope,
            },
            validFrom: assignValidFrom || undefined,
            validUntil: assignValidUntil || undefined,
          }),
        }
      );
      
      if (!response.ok) throw new Error("Failed to assign role");
      
      setSuccess("Role assigned successfully");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh employee roles
      handleSelectEmployee(selectedEmployee);
      
      // Refresh current user's permissions if they assigned a role to themselves
      if (user && user._id === selectedEmployee) {
        await refreshPermissions();
      }
      
      // Reset form
      setAssignRole("");
      setAssignScope("organization");
      setAssignValidFrom("");
      setAssignValidUntil("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async (role: string) => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3000/leaves/role-management/users/${selectedEmployee}/roles/${role}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      
      if (!response.ok) throw new Error("Failed to revoke role");
      
      setSuccess("Role revoked successfully");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh employee roles
      handleSelectEmployee(selectedEmployee);
      
      // Refresh current user's permissions if they revoked their own role
      if (user && user._id === selectedEmployee) {
        await refreshPermissions();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPermissionLabel = (permission: string): string => {
    return permission
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getPermissionCategory = (permission: string): string => {
    if (permission.includes("REQUEST")) return "Request";
    if (permission.includes("APPROVE") || permission.includes("REJECT")) return "Approval";
    if (permission.includes("VIEW")) return "View";
    if (permission.includes("MANAGE")) return "Management";
    if (permission.includes("AUDIT")) return "Admin";
    return "Other";
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Role Management" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const groupedPermissions = groupPermissionsByCategory(availablePermissions);

  return (
    <DashboardLayout
      title="Leave Role & Permission Management"
      description="Manage user roles and permissions for leave requests, approvals, and viewing."
    >
      {/* Info Banner */}
      <div className="mb-6 bg-blue-900/30 border border-blue-700 text-blue-200 px-4 py-3 rounded">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Live Permission System</h3>
            <p className="mt-1 text-sm">
              Changes to role permissions take effect immediately. When you assign a permission to a role, 
              users with that role will instantly see new menu items in their dashboard sidebar.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "roles"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            User Assignments
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "approvals"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            Approval Chain
          </button>
        </nav>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Role Permissions Tab */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List */}
          <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Roles</h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.role}
                  onClick={() => handleSelectRole(role.role)}
                  className={`w-full text-left px-4 py-3 rounded-md transition ${
                    selectedRole === role.role
                      ? "bg-blue-600 text-white"
                      : "bg-[#1a1a1a] text-gray-300 hover:bg-[#333333]"
                  }`}
                >
                  <div className="font-medium">{role.role.replace(/_/g, " ")}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {role.permissions.length} permissions
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Details */}
          <div className="lg:col-span-2 bg-[#2a2a2a] rounded-lg shadow-md p-6">
            {rolePermissions ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {rolePermissions.role.replace(/_/g, " ")}
                  </h2>
                  <p className="text-gray-400 text-sm">{rolePermissions.description}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-gray-400">
                      Can Delegate: {rolePermissions.canDelegate ? "✓ Yes" : "✗ No"}
                    </span>
                    {rolePermissions.maxApprovalAmount && (
                      <span className="text-gray-400">
                        Max Approval: {rolePermissions.maxApprovalAmount} days
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const hasPermission = rolePermissions.permissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-md hover:bg-[#333333] cursor-pointer"
                            >
                              <span className="text-gray-300">{perm.label}</span>
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => handleTogglePermission(perm.key)}
                                disabled={loading}
                                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Select a role to view and manage permissions
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Assignments Tab */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Selection & Role Assignment */}
          <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Assign Role to User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Employee *
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={assignRole}
                      onChange={(e) => setAssignRole(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.role} value={role.role}>
                          {role.role.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Scope
                    </label>
                    <select
                      value={assignScope}
                      onChange={(e) => setAssignScope(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="organization">Organization-wide</option>
                      <option value="department">Department</option>
                      <option value="team">Team</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Valid From (Optional)
                      </label>
                      <input
                        type="date"
                        value={assignValidFrom}
                        onChange={(e) => setAssignValidFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Valid Until (Optional)
                      </label>
                      <input
                        type="date"
                        value={assignValidUntil}
                        onChange={(e) => setAssignValidUntil(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAssignRole}
                    disabled={loading || !assignRole}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Assigning..." : "Assign Role"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Current Roles for Selected Employee */}
          <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Current Roles</h2>
            
            {selectedEmployee ? (
              employeeRoles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No roles assigned to this employee
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeRoles.map((userRole, index) => (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] p-4 rounded-md border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-white">
                            {userRole.role.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Scope: {userRole.scope?.type || "Organization"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeRole(userRole.role)}
                          disabled={loading}
                          className="text-red-400 hover:text-red-300 text-sm disabled:text-gray-600"
                        >
                          Revoke
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Assigned: {new Date(userRole.assignedAt).toLocaleDateString()}
                      </div>
                      {userRole.validUntil && (
                        <div className="text-xs text-yellow-500 mt-1">
                          Expires: {new Date(userRole.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-400">
                Select an employee to view their roles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval Chain Tab */}
      {activeTab === "approvals" && (
        <div className="bg-[#2a2a2a] rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Leave Approval Chain</h2>
          <p className="text-gray-400 text-sm mb-6">
            Hierarchical approval workflow based on roles and permissions
          </p>
          
          {approvalChain.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No approval chain configured
            </div>
          ) : (
            <div className="space-y-4">
              {approvalChain.map((level, index) => (
                <div
                  key={index}
                  className="bg-[#1a1a1a] p-4 rounded-md border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">
                        Level {index + 1}: {level.role?.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {level.description}
                      </div>
                      {level.maxApprovalAmount && (
                        <div className="text-xs text-gray-500 mt-1">
                          Can approve up to {level.maxApprovalAmount} days
                        </div>
                      )}
                    </div>
                    <div className="text-2xl text-blue-500">→</div>
                  </div>
                </div>
              ))}
              <div className="bg-green-900/30 p-4 rounded-md border-l-4 border-green-500">
                <div className="font-medium text-green-300">✓ Approved</div>
                <div className="text-sm text-gray-400 mt-1">
                  Leave request is approved and processed
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
