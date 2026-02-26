export type Permission =
    | 'user:manage'           // Full user management (Super Admin)
    | 'report:view_all'       // Strategic reports (Director)
    | 'finance:dashboard'     // Full financial dashboard (Finance Manager)
    | 'finance:approve'       // Approve payments (Finance Manager)
    | 'finance:reports'       // Generate financial reports (Finance Manager)
    | 'finance:transactions'  // Record transactions (Accounts Assistant)
    | 'finance:payouts'       // Process driver payouts (Accounts Assistant)
    | 'driver:manage'         // Manage drivers (Driver Relations Manager)
    | 'driver:performance'    // View performance (Driver Relations Manager)
    | 'driver:complaints'     // Handle complaints (Driver Relations Manager)
    | 'ride:monitor'          // Monitor rides (Operations Supervisor)
    | 'ride:allocate'         // Manage trip allocations (Operations Supervisor)
    | 'ride:issues'           // Handle ride issues (Operations Supervisor)
    | 'system:health'         // Oversee system health (IT Manager)
    | 'system:infrastructure' // Manage infrastructure (IT Manager)
    | 'system:technical'      // Technical system access (Developer/SysAdmin)
    | 'driver:approve'         // Approve driver applications (Driver Relations/CEO)
    | 'finance:view_docs'      // View sensitive financial docs (Finance/CEO)
    | 'admin:dashboard';       // Basic admin dashboard access

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    super_admin: [
        'user:manage',
        'report:view_all',
        'finance:view_docs',
        'driver:approve',
        'admin:dashboard'
    ],
    director_ceo: [
        'report:view_all',
        'finance:view_docs',
        'driver:approve',
        'admin:dashboard'
    ],
    finance_manager: [
        'finance:dashboard',
        'finance:approve',
        'finance:reports',
        'finance:view_docs',
        'admin:dashboard'
    ],
    accounts_assistant: [
        'finance:transactions',
        'finance:payouts',
        'admin:dashboard'
    ],
    driver_relations_manager: [
        'driver:manage',
        'driver:performance',
        'driver:complaints',
        'driver:approve',
        'admin:dashboard'
    ],
    operations_supervisor: [
        'ride:monitor',
        'ride:allocate',
        'ride:issues',
        'admin:dashboard'
    ],
    it_manager: [
        'system:health',
        'system:infrastructure',
        'admin:dashboard'
    ],
    system_admin_developer: [
        'system:technical',
        'admin:dashboard'
    ],
    driver: [],
    passenger: []
};

// Hierarchy definition: which roles does each role inherit?
export const ROLE_HIERARCHY: Record<string, string[]> = {
    super_admin: ['director_ceo', 'system_admin_developer'], // Super Admin inherits top-level manager roles
    director_ceo: ['finance_manager', 'driver_relations_manager', 'it_manager'],
    finance_manager: ['accounts_assistant'],
    driver_relations_manager: ['operations_supervisor'],
    it_manager: ['system_admin_developer'],
    accounts_assistant: [],
    operations_supervisor: [],
    system_admin_developer: [],
    driver: [],
    passenger: []
};

/**
 * Returns all permissions for a given role, including inherited ones.
 */
export const getAllPermissions = (role: string): Permission[] => {
    const permissions = new Set<Permission>(ROLE_PERMISSIONS[role] || []);
    const inheritedRoles = ROLE_HIERARCHY[role] || [];

    for (const inheritedRole of inheritedRoles) {
        const inheritedPermissions = getAllPermissions(inheritedRole);
        inheritedPermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
};

/**
 * Checks if a role has a specific permission (directly or inherited).
 */
export const hasPermission = (role: string, permission: Permission): boolean => {
    const allPerms = getAllPermissions(role);
    return allPerms.includes(permission);
};
