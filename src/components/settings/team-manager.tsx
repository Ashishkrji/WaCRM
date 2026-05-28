"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Loader2, 
  Check, 
  AlertTriangle,
  X,
  Target,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck,
  Ban,
  Activity,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { PermissionKey, DEFAULT_ROLE_PERMISSIONS, UserRole } from "@/lib/saas/permissions";

// Interface matching DB profiles table
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  status: "active" | "suspended";
  created_at: string;
  beta_features?: string[];
}

const PRESET_SPECIALTIES = [
  "WhatsApp Support",
  "Lead Qualification",
  "Sales Manager",
  "Demo Booker",
  "Customer Success",
  "Tech Support",
  "System Administrator"
];

export function TeamManager() {
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);

  // Add Member form state
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("staff");
  const [createStatus, setCreateStatus] = useState<"active" | "suspended">("active");
  const [createSpecialty, setCreateSpecialty] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Member form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("staff");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Quick Change Task state
  const [quickSpecialty, setQuickSpecialty] = useState("");
  const [taskUpdating, setTaskUpdating] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load team members: " + error.message);
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
      toast.error("Unexpected error loading profiles");
    } finally {
      setLoading(false);
    }
  };

  // Specialty parsing helpers
  const getMemberSpecialty = (betaFeatures: string[] | undefined | null): string => {
    if (!betaFeatures) return "General Agent";
    const specialtyFeature = betaFeatures.find((f) => f.startsWith("task:"));
    return specialtyFeature ? specialtyFeature.replace("task:", "") : "General Agent";
  };

  const cleanBetaFeaturesOfTask = (betaFeatures: string[] | undefined | null): string[] => {
    return (betaFeatures || []).filter((f) => !f.startsWith("task:"));
  };

  // CREATE / INVITE USER
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword || !createName) {
      toast.error("Name, Email, and Password are required");
      return;
    }
    setCreating(true);

    try {
      // 1. Sign up the user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: createEmail,
        password: createPassword,
        options: {
          data: {
            full_name: createName,
          },
        },
      });

      if (error) {
        toast.error("Failed to register auth account: " + error.message);
        setCreating(false);
        return;
      }

      if (data.user) {
        // Prepare specialty tag in beta_features
        const betaFeatures: string[] = [];
        if (createSpecialty.trim()) {
          betaFeatures.push(`task:${createSpecialty.trim()}`);
        }

        // 2. Update the automatically provisioned profile record with correct role, permissions, status and specialty
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: createRole,
            permissions: DEFAULT_ROLE_PERMISSIONS[createRole] || [],
            status: createStatus,
            beta_features: betaFeatures,
          })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Failed to configure profile properties:", profileError.message);
          toast.warning("User registered, but custom profile properties failed to set.");
        } else {
          toast.success("Team member invited successfully!");
        }

        // Reset form & state
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateRole("staff");
        setCreateStatus("active");
        setCreateSpecialty("");
        setIsCreateOpen(false);
        fetchMembers();
      }
    } catch (err) {
      console.error("Invite error:", err);
      toast.error("An unexpected error occurred while inviting member");
    } finally {
      setCreating(false);
    }
  };

  // EDIT MEMBER DETAILS
  const handleOpenEdit = (member: UserProfile) => {
    setSelectedMember(member);
    setEditName(member.full_name || "");
    setEditRole(member.role);
    setEditStatus(member.status || "active");
    setEditSpecialty(getMemberSpecialty(member.beta_features));
    setEditPermissions(member.permissions || DEFAULT_ROLE_PERMISSIONS[member.role] || []);
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
    if (!selectedMember) return;
    setUpdating(true);

    try {
      // Rebuild beta features while maintaining non-task flags
      const cleanedFeatures = cleanBetaFeaturesOfTask(selectedMember.beta_features);
      if (editSpecialty.trim()) {
        cleanedFeatures.push(`task:${editSpecialty.trim()}`);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          role: editRole,
          status: editStatus,
          permissions: editPermissions,
          beta_features: cleanedFeatures,
        })
        .eq("id", selectedMember.id);

      if (error) {
        toast.error("Failed to update profile: " + error.message);
      } else {
        toast.success("Team member updated successfully!");
        setIsEditOpen(false);
        fetchMembers();
      }
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  // QUICK CHANGE SPECIALTY / TASK
  const handleOpenQuickTask = (member: UserProfile) => {
    setSelectedMember(member);
    setQuickSpecialty(getMemberSpecialty(member.beta_features));
    setIsTaskOpen(true);
  };

  const handleSaveQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setTaskUpdating(true);

    try {
      const cleanedFeatures = cleanBetaFeaturesOfTask(selectedMember.beta_features);
      if (quickSpecialty.trim()) {
        cleanedFeatures.push(`task:${quickSpecialty.trim()}`);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          beta_features: cleanedFeatures,
        })
        .eq("id", selectedMember.id);

      if (error) {
        toast.error("Failed to update assigned task: " + error.message);
      } else {
        toast.success("Assigned task/specialty updated!");
        setIsTaskOpen(false);
        fetchMembers();
      }
    } catch (err) {
      console.error("Quick task error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setTaskUpdating(false);
    }
  };

  // DELETE MEMBER
  const handleOpenDelete = (member: UserProfile) => {
    setSelectedMember(member);
    setIsDeleteOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedMember.id);

      if (error) {
        toast.error("Failed to delete user profile: " + error.message);
      } else {
        toast.success("Team member deleted successfully!");
        setIsDeleteOpen(false);
        fetchMembers();
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error("An unexpected error occurred while deleting member");
    } finally {
      setDeleting(false);
    }
  };

  // Badge Color Handlers
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]";
      case "admin":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "manager":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "staff":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Unlocked: Always allow adding/editing/deleting team members from the Dashboard UI
  const isSuperAdminOrAdmin = true;

  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-slate-400 text-sm">Fetching team credentials...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-bold text-white tracking-wide">Team & Agent Management</CardTitle>
            </div>
            <CardDescription className="text-slate-400 mt-1.5 max-w-lg leading-relaxed">
              Add and manage your agents, customize permission scopes, and designate tasks or primary specializations.
            </CardDescription>
          </div>
          {isSuperAdminOrAdmin && (
            <Button 
              onClick={() => setIsCreateOpen(true)} 
              className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Add Team Member
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="pt-6">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-slate-600 mb-4 animate-pulse" />
              <p className="text-slate-300 text-base font-semibold">No team profiles configured</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Provision agent roles and credentials to delegate inbox coverage and pipelines.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 border-b border-slate-800/80 p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-900/10">
                <div className="col-span-5 md:col-span-4">Member</div>
                <div className="col-span-3 md:col-span-3">Role & Permissions</div>
                <div className="col-span-3 md:col-span-3">Assigned Task / Specialty</div>
                <div className="hidden md:block md:col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right"></div>
              </div>
              
              {/* Rows */}
              <div className="divide-y divide-slate-800/60">
                {members.map((member) => {
                  const specialty = getMemberSpecialty(member.beta_features);
                  const isCurrentUser = member.user_id === user?.id;

                  return (
                    <div 
                      key={member.id} 
                      className={`grid grid-cols-12 items-center gap-4 p-4 transition-all hover:bg-slate-900/30 ${
                        isCurrentUser ? "bg-slate-900/10 border-l-2 border-primary" : ""
                      }`}
                    >
                      {/* Name & Email */}
                      <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-slate-800 ring-offset-2 ring-offset-slate-950 transition-all group-hover:scale-105">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                            {member.full_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {member.full_name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block truncate mt-0.5">{member.email}</span>
                        </div>
                      </div>

                      {/* Role & Permissions Badge */}
                      <div className="col-span-3 md:col-span-3 flex flex-wrap gap-1.5 items-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(member.role)}`}>
                          {member.role === "super_admin" && <ShieldCheck className="h-3 w-3" />}
                          {member.role === "admin" && <Shield className="h-3 w-3" />}
                          {member.role === "manager" && <Activity className="h-3 w-3" />}
                          {member.role === "staff" && <UserCheck className="h-3 w-3" />}
                          <span className="capitalize">{member.role?.replace("_", " ")}</span>
                        </span>
                        
                        {/* Number of permissions overrides */}
                        {member.permissions && member.permissions.length > 0 && (
                          <span 
                            className="hidden md:inline-flex items-center text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5" 
                            title={member.permissions.join(", ")}
                          >
                            {member.permissions.length} Overrides
                          </span>
                        )}
                      </div>

                      {/* Specialty Task */}
                      <div className="col-span-3 md:col-span-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium bg-slate-900 border border-slate-800/80 text-slate-300">
                          <Target className="h-3 w-3 text-cyan-400" />
                          <span className="truncate max-w-[150px]">{specialty}</span>
                        </span>
                        {isSuperAdminOrAdmin && (
                          <button
                            onClick={() => handleOpenQuickTask(member)}
                            className="text-slate-500 hover:text-cyan-400 transition-colors p-1 hover:bg-slate-900 rounded-md"
                            title="Change Assigned Task/Specialty"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Status */}
                      <div className="hidden md:flex md:col-span-1 justify-center items-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          member.status === "active" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]" 
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${member.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                          <span className="capitalize">{member.status || "active"}</span>
                        </span>
                      </div>

                      {/* Actions Menu */}
                      <div className="col-span-1 flex justify-end">
                        {isSuperAdminOrAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-44">
                              <DropdownMenuItem 
                                onClick={() => handleOpenEdit(member)}
                                className="gap-2 focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                Edit Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenQuickTask(member)}
                                className="gap-2 focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <Target className="h-3.5 w-3.5 text-cyan-400" />
                                Change Task
                              </DropdownMenuItem>
                              {!isCurrentUser && (
                                <>
                                  <DropdownMenuSeparator className="bg-slate-800" />
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDelete(member)}
                                    className="gap-2 text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Account
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span title="Contact an administrator to modify properties">
                            <Info className="h-4 w-4 text-slate-600" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MEMBER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create an authentication account and setup profile attributes for a new agent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMember} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-slate-300">Full Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-slate-300">Email Address</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="e.g. agent@company.com"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-pass" className="text-slate-300">Login Password</Label>
              <Input
                id="create-pass"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                required
                minLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-role" className="text-slate-300">System Role</Label>
                <select
                  id="create-role"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff / Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-status" className="text-slate-300">Account Status</Label>
                <select
                  id="create-status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as "active" | "suspended")}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-specialty" className="text-slate-300">Primary Task / Specialty</Label>
              <div className="flex gap-2">
                <Input
                  id="create-specialty"
                  value={createSpecialty}
                  onChange={(e) => setCreateSpecialty(e.target.value)}
                  placeholder="e.g. Sales Qualification"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRESET_SPECIALTIES.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCreateSpecialty(p)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Inviting...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MEMBER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg shadow-2xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Team Credentials
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update {selectedMember?.email}'s profiles settings, override scopes, and task priorities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-slate-300">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-800/80 border-slate-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-role" className="text-slate-300">System Role</Label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as UserRole;
                    setEditRole(nextRole);
                    setEditPermissions(DEFAULT_ROLE_PERMISSIONS[nextRole] || []);
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff / Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-slate-300">Account Status</Label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "suspended")}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-specialty" className="text-slate-300">Assigned Task / Specialty</Label>
              <Input
                id="edit-specialty"
                value={editSpecialty}
                onChange={(e) => setEditSpecialty(e.target.value)}
                placeholder="e.g. Sales Qualification"
                className="bg-slate-800/80 border-slate-700 text-white"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRESET_SPECIALTIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditSpecialty(p)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      editSpecialty === p 
                        ? "bg-primary/20 text-primary border-primary/30" 
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Permissions Scope Override */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <Label className="text-slate-300 font-semibold block">Custom Scope Overrides</Label>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                By default, this role inherits standard settings. Select checkbox inputs below to customize specific authorizations for this profile.
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                {(Object.keys(DEFAULT_ROLE_PERMISSIONS.super_admin) as unknown as PermissionKey[]).map((permKey) => {
                  const label = permKey.replace("_", " ");
                  const checked = editPermissions.includes(permKey);
                  return (
                    <label 
                      key={permKey} 
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-1 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePermission(permKey)}
                        className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-0 focus:ring-offset-0 size-3.5 accent-primary"
                      />
                      <span className="capitalize">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK CHANGE TASK DIALOG */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              Change Assigned Task
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Reassign the primary workspace duty or specialty target for {selectedMember?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuickTask} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-specialty" className="text-slate-300">Current Specialty Assignment</Label>
              <Input
                id="quick-specialty"
                value={quickSpecialty}
                onChange={(e) => setQuickSpecialty(e.target.value)}
                placeholder="e.g. Sales Inbound Support"
                className="bg-slate-800/80 border-slate-700 text-white focus:border-cyan-500/50"
                required
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_SPECIALTIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickSpecialty(p)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    quickSpecialty === p 
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={taskUpdating}
                className="bg-cyan-600 hover:bg-cyan-550 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                {taskUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating Task...
                  </>
                ) : (
                  "Change Assignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to permanently delete the account for <strong className="text-white">{selectedMember?.full_name} ({selectedMember?.email})</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-xs text-red-400 leading-relaxed">
            <strong>Warning:</strong> Deleting a team member removes their database profile permanently. All historic pipeline logs, deals, or conversations assigned to this user will become unassigned. This operation cannot be undone.
          </div>

          <DialogFooter className="pt-2 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteMember}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
