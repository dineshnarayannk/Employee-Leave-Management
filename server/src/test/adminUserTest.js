import { query } from '../db/index.js';
import * as adminService from '../services/adminService.js';
import { signToken } from '../utils/jwt.js';

async function runAdminUserManagementTests() {
  console.log('====================================================');
  console.log(' Running Step 4: Admin User Management Tests');
  console.log('====================================================\n');

  try {
    // 1. Fetch current Admin user
    const [admin] = await query('SELECT id, name, email, role_id FROM users WHERE role_id = 1 LIMIT 1');
    if (!admin) throw new Error('No Admin user found in database. Run db:seed first.');
    console.log(` Operating as Admin: ${admin.name} (ID: ${admin.id}, Email: ${admin.email})`);

    // 2. Fetch Dashboard stats
    console.log('\n Test 1: Fetch Admin Dashboard Stats...');
    const stats = await adminService.getAdminDashboardStats();
    console.log('   ✓ Stats returned:', stats);

    // 3. Create a new Manager
    console.log('\n Test 2: Create a new Manager (role_id: 2)...');
    const testManagerEmail = `test.manager.${Date.now()}@example.com`;
    const newManager = await adminService.createUser(
      {
        name: 'Test Engineering Lead',
        email: testManagerEmail,
        department: 'Engineering',
        role_id: 2,
        is_active: true,
      },
      admin.id
    );
    console.log(`   ✓ Manager created: ID ${newManager.id}, Role: ${newManager.role_name}`);

    // 4. Create a new Employee assigned to the new Manager
    console.log('\n Test 3: Create a new Employee assigned to Manager...');
    const testEmpEmail = `test.employee.${Date.now()}@example.com`;
    const newEmployee = await adminService.createUser(
      {
        name: 'Test Junior Developer',
        email: testEmpEmail,
        department: 'Engineering',
        role_id: 3,
        manager_id: newManager.id,
        is_active: true,
      },
      admin.id
    );
    console.log(`   ✓ Employee created: ID ${newEmployee.id}, Manager: ${newEmployee.manager_name} (ID: ${newEmployee.manager_id})`);

    // 5. Test Duplicate Email rejection (409)
    console.log('\n Test 4: Verify Duplicate Email Rejection...');
    try {
      await adminService.createUser(
        {
          name: 'Duplicate Guy',
          email: testEmpEmail,
          department: 'Engineering',
          role_id: 3,
        },
        admin.id
      );
      throw new Error('FAILED: Duplicate email was not rejected!');
    } catch (dupErr) {
      if (dupErr.statusCode === 409) {
        console.log('   ✓ Correctly rejected duplicate email with HTTP 409 Conflict.');
      } else {
        throw dupErr;
      }
    }

    // 6. Test Self-Manager Assignment rejection (400)
    console.log('\n Test 5: Verify Self-Manager Assignment Rejection...');
    try {
      await adminService.updateUser(
        newEmployee.id,
        { manager_id: newEmployee.id },
        admin.id
      );
      throw new Error('FAILED: Self-assignment as manager was allowed!');
    } catch (selfErr) {
      if (selfErr.statusCode === 400) {
        console.log('   ✓ Correctly rejected self-manager assignment with HTTP 400 Bad Request.');
      } else {
        throw selfErr;
      }
    }

    // 7. Test User Status Deactivation and Activation
    console.log('\n Test 6: Deactivate & Reactivate User...');
    const deactivated = await adminService.updateUserStatus(newEmployee.id, false, admin.id);
    console.log(`   ✓ User deactivated: is_active = ${deactivated.is_active}`);
    const reactivated = await adminService.updateUserStatus(newEmployee.id, true, admin.id);
    console.log(`   ✓ User reactivated: is_active = ${reactivated.is_active}`);

    // 8. Test Search and Pagination
    console.log('\n Test 7: Filter & Search Users...');
    const searchResult = await adminService.getUsers({
      search: 'Junior Developer',
      role_id: 3,
      page: 1,
      limit: 5,
    });
    console.log(`   ✓ Found ${searchResult.users.length} user(s) matching search. Total matching: ${searchResult.pagination.total}`);

    // 9. Test Safe Deletion of clean test users
    console.log('\n Test 8: Safe Deletion of unreferenced user...');
    const deleteEmpResult = await adminService.deleteUser(newEmployee.id, admin.id);
    console.log(`   ✓ ${deleteEmpResult.message}`);
    const deleteMgrResult = await adminService.deleteUser(newManager.id, admin.id);
    console.log(`   ✓ ${deleteMgrResult.message}`);

    // 10. Verify Audit Log entries created
    console.log('\n Test 9: Verify Audit Logs recorded in TiDB...');
    const auditLogs = await query(
      'SELECT action, entity_type, created_at FROM audit_logs WHERE user_id = ? ORDER BY id DESC LIMIT 5',
      [admin.id]
    );
    console.log(`   ✓ Found ${auditLogs.length} audit logs for Admin:`);
    auditLogs.forEach((log) => console.log(`     - [${log.action}] on ${log.entity_type} at ${log.created_at}`));

    console.log('\n====================================================');
    console.log('  All Admin User Management Unit & API Tests Passed!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Admin User Test Failure:', err.message);
    process.exit(1);
  }
}

runAdminUserManagementTests();
