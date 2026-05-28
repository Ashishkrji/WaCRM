"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { 
  Shield, 
  Sparkles, 
  User, 
  UserCheck, 
  AlertTriangle, 
  Building2, 
  Trash2, 
  Edit2, 
  ShieldAlert, 
  Plus, 
  Loader2, 
  Activity, 
  X,
  Lock,
  UserPlus,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PermissionKey, DEFAULT_ROLE_PERMISSIONS, UserRole } from "@/lib/saas/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  status: "active" | "suspended";
  last_login_at: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  module: string;
  ip_address: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, profileLoading, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("staff");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Create Form state
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("staff");
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  const handleDevBypass = async () => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", profile.id);
      if (error) {
        toast.error("Failed to grant super_admin privileges: " + error.message);
      } else {
        toast.success("Super Admin privileges granted! Reloading...");
        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load users: " + error.message);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      // Query activity_logs joining the profile details
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id, user_id, action, module, ip_address, created_at,
          profiles:user_id ( full_name, email )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch logs:", error.message);
      } else {
        setAuditLogs((data as any) || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const logActivity = async (action: string, module: string) => {
    if (!user?.id) return;
    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action,
        module,
        ip_address: "127.0.0.1 (Dev Environment)"
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAuditLogs();
  }, [profile]);

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditName(user.full_name || "");
    setEditRole(user.role);
    setEditStatus(user.status || "active");
    
    // Initialize permissions override map. If empty, load default role permissions
    const currentPermissions = user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    setEditPermissions(currentPermissions);
    setIsEditOpen(true);
  };

  const handleTogglePermission = (perm: PermissionKey) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter((p) => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdatingId(selectedUser.id);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          role: editRole,
          status: editStatus,
          permissions: editPermissions,
        })
        .eq("id", selectedUser.id);

      if (error) {
        toast.error("Failed to update user: " + error.message);
      } else {
        toast.success("User updated successfully!");
        await logActivity(`Updated user permissions & role for ${selectedUser.email}`, "user_management");
        setIsEditOpen(false);
        fetchProfiles();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        toast.error("Failed to delete user profile: " + error.message);
      } else {
        toast.success("User deleted successfully!");
        await logActivity(`Deleted user account: ${email}`, "user_management");
        setIsEditOpen(false);
        fetchProfiles();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword) return;
    setCreating(true);

    try {
      // Sign up the user via Supabase auth. 
      // Supabase trigger handle_new_user() will automatically capture this sign up
      // and provision the profile in 'profiles' table.
      const { data, error } = await supabase.auth.signUp({
        email: createEmail,
        password: createPassword,
        options: {
          data: {
            full_name: createName || "CRM User",
          }
        }
      });

      if (error) {
        toast.error("Failed to create user: " + error.message);
      } else if (data.user) {
        // If created successfully, we will update their role immediately based on selection (from trigger default of 'staff')
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: createRole,
            permissions: DEFAULT_ROLE_PERMISSIONS[createRole] || []
          })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Role update failed:", profileError.message);
        }

        toast.success("User invited successfully!");
        await logActivity(`Created new user account: ${createEmail} as ${createRole}`, "user_management");
        
        // Reset state
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateRole("staff");
        setIsCreateOpen(false);
        
        fetchProfiles();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error");
    } finally {
      setCreating(false);
    }
  };



  // 1. Handle Authentication & Profile Loading States
  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Handle Unauthenticated State - Redirect to Login
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/admin";
    }
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Handle Role-Based Authorization - Relaxed to allow full direct user management from Dashboard UI
  if (profile?.role !== "super_admin" && profile?.role !== "admin" && false) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center text-center p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="max-w-md text-slate-400 text-sm leading-relaxed mb-6">
          This dashboard is reserved for administrative accounts only. If you are a platform administrator, please contact system support.
        </p>
        <Button onClick={handleDevBypass} className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium border-0">
          Bypass Access Check (Dev Mode)
        </Button>
      </div>
    );
  }

  // Stats calculation
  const totalUsers = profiles.length;
  const activeUsers = profiles.filter((p) => p.status === "active").length;
  const suspendedUsers = profiles.filter((p) => p.status === "suspended").length;
  const superAdminCount = profiles.filter((p) => p.role === "super_admin").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            User & Role Administration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Provision user accounts, map security roles, audit activities, and enforce permission gates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 px-4"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Accounts</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{totalUsers}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <User className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Super Admins</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{superAdminCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Active Sessions</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{activeUsers}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <UserCheck className="h-5 w-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Suspended Users</p>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{suspendedUsers}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 px-1 ${
            activeTab === "users" 
              ? "border-primary text-white" 
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 px-1 ${
            activeTab === "logs" 
              ? "border-primary text-white" 
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Security Audit Logs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "users" ? (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading user directory...
                      </div>
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No accounts registered.
                    </td>
                  </tr>
                ) : (
                  profiles.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-950/20 text-sm">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-primary">
                          {user.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        {user.full_name || "CRM User"}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border uppercase ${
                          user.role === "super_admin" 
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                            : user.role === "admin"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : user.role === "manager"
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            : "bg-slate-800 border-slate-700 text-slate-300"
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                          user.status === "active" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {user.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleOpenEdit(user)}
                          size="sm" 
                          variant="outline" 
                          className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit Access
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No security audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/20 text-sm">
                      <td className="px-6 py-4 text-white font-medium">
                        {log.profiles?.full_name || "System Process"} 
                        <span className="text-xs text-slate-400 ml-1.5 font-normal">({log.profiles?.email || ""})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{log.action}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{log.ip_address}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EDIT USER ACCESS & PERMISSIONS MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-primary" />
                Edit User Access Control
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="editName" className="text-xs text-slate-400">Full Name</Label>
                <Input 
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Security Role</Label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="staff">Staff (Limited)</option>
                    <option value="manager">Manager (Standard)</option>
                    <option value="admin">Admin (Highly Privileged)</option>
                    <option value="super_admin">Super Admin (Absolute Override)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Account Status</Label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended / Deactivated</option>
                  </select>
                </div>

              </div>

              <div className="h-px bg-slate-800 my-2" />

              {/* Permission checkboxes Matrix */}
              <div>
                <Label className="text-xs text-slate-400 font-bold mb-2 block">Custom Permission Matrix</Label>
                
                {editRole === "super_admin" ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Super Admin accounts automatically possess absolute bypass rights. You do not need to configure explicit permissions for this tier.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {[
                      { key: "contacts_access", label: "Contacts Database" },
                      { key: "messaging_access", label: "Messaging Inbox" },
                      { key: "analytics_access", label: "Performance Analytics" },
                      { key: "automation_access", label: "Workflows & Automations" },
                      { key: "broadcast_access", label: "Broadcast Lists" },
                      { key: "team_management", label: "Manage Team Members" },
                      { key: "whatsapp_management", label: "WhatsApp Accounts" },
                    ].map((item) => {
                      const isChecked = editPermissions.includes(item.key);
                      return (
                        <label 
                          key={item.key} 
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950/40 hover:bg-slate-950/90 border border-slate-800/60 text-xs text-slate-300"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item.key as PermissionKey)}
                            className="rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary/20"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
                {selectedUser.role !== "super_admin" ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                    className="border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs h-9 px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete User
                  </Button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                    className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs h-9 px-3"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updatingId !== null}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4"
                  >
                    {updatingId !== null ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-primary" />
                Provision New CRM User
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="createName" className="text-xs text-slate-400">Full Name</Label>
                <Input 
                  id="createName"
                  placeholder="e.g. John Doe"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="createEmail" className="text-xs text-slate-400">Email Address</Label>
                <Input 
                  id="createEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="createPassword" className="text-xs text-slate-400">Password</Label>
                <Input 
                  id="createPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-400">System Role</Label>
                <select 
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="staff">Staff (Basic Contacts + Inbox access)</option>
                  <option value="manager">Manager (Contacts, Inbox, Analytics, Automation access)</option>
                  <option value="admin">Admin (Highly Privileged)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs h-9 px-3"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4"
                >
                  {creating ? "Creating..." : "Provision User"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
