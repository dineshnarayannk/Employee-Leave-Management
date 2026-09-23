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

    // ==============================================================================
    // STEP 7: ADMIN ANALYTICS, REPORTS & LEAVE POLICIES TESTS
    // ==============================================================================
    console.log('\n----------------------------------------------------');
    console.log(' STEP 7: Admin Analytics, Reports & Policy Tests');
    console.log('----------------------------------------------------');

    // Test 10: Fetch System-wide Analytics
    console.log('\n Test 10: Fetch Admin System-wide Analytics...');
    const analytics = await adminService.getAdminAnalytics(2026);
    if (!analytics || !analytics.summary || !Array.isArray(analytics.monthlyTrend)) {
      throw new Error('FAILED: Admin analytics returned invalid data structure');
    }
    console.log(`   ✓ Admin analytics retrieved: Total Requests: ${analytics.summary.totalRequests}, Approved Days: ${analytics.summary.approvedLeaveDays}, Months tracked: ${analytics.monthlyTrend.length}`);

    // Test 11: Fetch System-wide Reports
    console.log('\n Test 11: Fetch Admin System-wide Reports...');
    const reports = await adminService.getAdminReports({ year: 2026, page: 1, limit: 10 });
    if (!reports || !Array.isArray(reports.records) || typeof reports.summary?.totalRecords !== 'number') {
      throw new Error('FAILED: Admin reports returned invalid structure');
    }
    console.log(`   ✓ Admin reports retrieved: ${reports.records.length} records on page, total records: ${reports.summary.totalRecords}`);

    // Test 12: Create a new Leave Policy Category
    console.log('\n Test 12: Create new Leave Policy Type (Sabbatical Leave)...');
    const policyName = `Sabbatical Leave ${Date.now()}`;
    const newPolicy = await adminService.createLeaveType(admin.id, {
      name: policyName,
      description: 'Extended personal growth or study leave',
      default_days: 30,
      is_active: true,
    });
    console.log(`   ✓ Created policy: #${newPolicy.id} "${newPolicy.name}" with ${newPolicy.default_days} default days`);

    // Test 13: Prevent Duplicate Leave Policy Name
    console.log('\n Test 13: Verify Duplicate Policy Name Rejection...');
    try {
      await adminService.createLeaveType(admin.id, {
        name: policyName,
        description: 'Duplicate attempt',
        default_days: 15,
      });
      throw new Error('FAILED: Duplicate policy name was not rejected!');
    } catch (dupPolicyErr) {
      if (dupPolicyErr.statusCode === 409) {
        console.log('   ✓ Correctly rejected duplicate policy name with HTTP 409 Conflict.');
      } else {
        throw dupPolicyErr;
      }
    }

    // Test 14: Update Leave Policy Category
    console.log('\n Test 14: Update Leave Policy (change default days to 45)...');
    const updatedPolicy = await adminService.updateLeaveType(admin.id, newPolicy.id, {
      default_days: 45,
      description: 'Updated study and fellowship leave',
    });
    if (updatedPolicy.default_days !== 45) {
      throw new Error('FAILED: Leave policy default days did not update');
    }
    console.log(`   ✓ Updated policy default days: ${updatedPolicy.default_days}`);

    // Test 15: Toggle Leave Policy Status
    console.log('\n Test 15: Toggle Policy Active Status...');
    const deactPolicy = await adminService.updateLeaveTypeStatus(admin.id, newPolicy.id, false);
    console.log(`   ✓ Policy deactivated: is_active = ${deactPolicy.is_active}`);
    const reactPolicy = await adminService.updateLeaveTypeStatus(admin.id, newPolicy.id, true);
    console.log(`   ✓ Policy reactivated: is_active = ${reactPolicy.is_active}`);

    // Test 16: Safe Deletion of Unreferenced Policy
    console.log('\n Test 16: Safe Deletion of Unreferenced Policy...');
    const deletePolicyResult = await adminService.deleteLeaveType(admin.id, newPolicy.id);
    console.log(`   ✓ ${deletePolicyResult.message}`);

    // Test 17: Deletion Block on Referenced Policy (e.g. Casual Leave ID: 1)
    console.log('\n Test 17: Verify Deletion Block on Referenced Policy...');
    try {
      await adminService.deleteLeaveType(admin.id, 1); // Casual Leave is referenced by seed requests/balances
      throw new Error('FAILED: Deletion of referenced policy was not blocked!');
    } catch (delRefErr) {
      if (delRefErr.statusCode === 409) {
        console.log('   ✓ Correctly blocked deletion of referenced policy with HTTP 409 Conflict.');
      } else {
        throw delRefErr;
      }
    }

    // Test 18: Verify Policy Audit Logs
    console.log('\n Test 18: Verify Policy Audit Logs in TiDB...');
    const policyAuditLogs = await query(
      "SELECT action, entity_type, created_at FROM audit_logs WHERE action LIKE 'LEAVE_TYPE%' ORDER BY id DESC LIMIT 5"
    );
    console.log(`   ✓ Found ${policyAuditLogs.length} policy audit logs:`);
    policyAuditLogs.forEach((log) => console.log(`     - [${log.action}] on ${log.entity_type} at ${log.created_at}`));

    console.log('\n====================================================');
    console.log('  All Admin User & Step 7 Policy/Analytics Tests Passed!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Admin User Test Failure:', err.message);
    process.exit(1);
  }
}

runAdminUserManagementTests();

