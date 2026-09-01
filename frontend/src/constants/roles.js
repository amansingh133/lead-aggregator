export const ROLE = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

export const ROLES = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.EMPLOYEE];

// Roles with org-wide ("admin-level") access - projects, all leads,
// dashboards, the Facebook Lead Ads section.
export const PRIVILEGED_ROLES = [ROLE.ADMIN, ROLE.SUPER_ADMIN];

// Human labels for role <select> options / chips.
export const ROLE_LABEL = {
  [ROLE.SUPER_ADMIN]: 'Super Admin',
  [ROLE.ADMIN]: 'Admin',
  [ROLE.EMPLOYEE]: 'Employee',
};

// Which roles the signed-in user may see / create / manage from the Team
// page - mirrors the backend's manageableRoles() in admin.controller.js.
export function manageableRoles({ isSuperAdmin, isPrimarySuperAdmin }) {
  if (isPrimarySuperAdmin) return [ROLE.EMPLOYEE, ROLE.ADMIN, ROLE.SUPER_ADMIN];
  if (isSuperAdmin) return [ROLE.EMPLOYEE, ROLE.ADMIN];
  return [ROLE.EMPLOYEE];
}
