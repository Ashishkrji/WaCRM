export type UserRole = "super_admin" | "admin" | "manager" | "staff" | "user";

export type PermissionKey =
  | "contacts_access"
  | "messaging_access"
  | "analytics_access"
  | "settings_access"
  | "automation_access"
  | "team_management"
  | "broadcast_access"
  | "api_access"
  | "whatsapp_management";

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  super_admin: [
    "contacts_access",
    "messaging_access",
    "analytics_access",
    "settings_access",
    "automation_access",
    "team_management",
    "broadcast_access",
    "api_access",
    "whatsapp_management",
  ],
  admin: [
    "contacts_access",
    "messaging_access",
    "analytics_access",
    "settings_access",
    "automation_access",
    "team_management",
    "broadcast_access",
    "whatsapp_management",
  ],
  manager: [
    "contacts_access",
    "messaging_access",
    "analytics_access",
    "automation_access",
  ],
  staff: [
    "contacts_access",
    "messaging_access",
  ],
  user: [
    "contacts_access",
    "messaging_access",
  ],
};

interface MinimalProfile {
  role?: string | null;
  permissions?: string[] | null;
}

/**
 * Checks if a profile has authorization for a specific permission module.
 */
export function hasPermission(
  profile: MinimalProfile | undefined | null,
  permission: PermissionKey
): boolean {
  if (!profile) return false;

  const role = (profile.role as UserRole) || "staff";
  
  // Super Admins have absolute override access
  if (role === "super_admin") return true;

  // Check default role permissions mapping
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
  if (rolePermissions.includes(permission)) return true;

  // Check specific custom permission array overrides
  const userPermissions = profile.permissions || [];
  if (userPermissions.includes(permission)) return true;

  return false;
}
