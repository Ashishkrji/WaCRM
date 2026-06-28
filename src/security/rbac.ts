/**
 * Role-Based Access Control (RBAC) Utility
 */

export type Role = 
  | 'Super Admin'
  | 'Administrator'
  | 'Manager'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Support Manager'
  | 'Support Executive'
  | 'Marketing Manager'
  | 'Marketing Executive'
  | 'Accountant'
  | 'HR'
  | 'Developer';

export type Permission = 
  | 'view:crm'
  | 'edit:crm'
  | 'view:analytics'
  | 'manage:users'
  | 'manage:settings'
  | 'view:audit'
  | 'manage:billing';

// Define base permissions for roles
const RolePermissions: Record<Role, Permission[]> = {
  'Super Admin': ['view:crm', 'edit:crm', 'view:analytics', 'manage:users', 'manage:settings', 'view:audit', 'manage:billing'],
  'Administrator': ['view:crm', 'edit:crm', 'view:analytics', 'manage:users', 'manage:settings', 'view:audit'],
  'Manager': ['view:crm', 'edit:crm', 'view:analytics'],
  'Sales Manager': ['view:crm', 'edit:crm', 'view:analytics'],
  'Sales Executive': ['view:crm', 'edit:crm'],
  'Support Manager': ['view:crm', 'edit:crm', 'view:analytics'],
  'Support Executive': ['view:crm', 'edit:crm'],
  'Marketing Manager': ['view:crm', 'edit:crm', 'view:analytics'],
  'Marketing Executive': ['view:crm', 'edit:crm'],
  'Accountant': ['view:billing' as Permission, 'manage:billing'],
  'HR': ['manage:users'],
  'Developer': ['view:crm', 'view:analytics', 'view:audit']
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Validates access in API routes or Server Actions
 */
export function requirePermission(userRole: Role, permission: Permission) {
  if (!hasPermission(userRole, permission)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}
