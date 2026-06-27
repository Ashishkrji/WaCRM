import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Organization name is required'),
  logo_url: z.string().url().optional().nullable(),
  timezone: z.string().default('UTC'),
  settings: z.record(z.string(), z.any()).default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Role name is required'),
  organization_id: z.string().uuid().optional().nullable(),
  is_system: z.boolean().default(false),
});

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  module: z.string(),
  action: z.string(),
  description: z.string().optional().nullable(),
});

export const RolePermissionSchema = z.object({
  role_id: z.string().uuid(),
  permission_id: z.string().uuid(),
});

export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role_id: z.string().uuid().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  reporting_manager: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  skills: z.array(z.string()).default([]),
});

export const AuditLogSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional().nullable(),
  action: z.string(),
  module: z.string(),
  entity_id: z.string().optional().nullable(),
  old_value: z.record(z.string(), z.any()).optional().nullable(),
  new_value: z.record(z.string(), z.any()).optional().nullable(),
  ip_address: z.string().optional().nullable(),
  device_info: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
});

export const SecurityAlertSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  details: z.record(z.string(), z.any()).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).default('OPEN'),
  resolved_by: z.string().uuid().optional().nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type SecurityAlert = z.infer<typeof SecurityAlertSchema>;
