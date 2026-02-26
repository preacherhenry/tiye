
import { getAllPermissions, hasPermission, Permission } from './src/config/roles';

const testRoles = [
    'super_admin',
    'director_ceo',
    'finance_manager',
    'accounts_assistant',
    'driver_relations_manager',
    'operations_supervisor',
    'it_manager',
    'system_admin_developer'
];

console.log('--- RBAC Hierarchy Test ---');

testRoles.forEach(role => {
    const perms = getAllPermissions(role);
    console.log(`Role: ${role}`);
    console.log(`Permissions (${perms.length}): ${perms.join(', ')}`);
    console.log('---------------------------');
});

// Specific inheritance checks
console.log('Inheritance Checks:');
console.log('Does super_admin have finance:dashboard?', hasPermission('super_admin', 'finance:dashboard'));
console.log('Does director_ceo have finance:dashboard?', hasPermission('director_ceo', 'finance:dashboard'));
console.log('Does accounts_assistant have finance:dashboard?', hasPermission('accounts_assistant', 'finance:dashboard'));
console.log('Does finance_manager have finance:payouts?', hasPermission('finance_manager', 'finance:payouts'));
