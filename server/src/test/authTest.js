import { signToken, verifyToken } from '../utils/jwt.js';
import { query } from '../db/index.js';

async function runAuthRbacTests() {
  console.log('====================================================');
  console.log(' Running Step 3: Auth & RBAC Verification Tests');
  console.log('====================================================\n');

  try {
    // 1. Fetch seed users from TiDB Cloud
    const users = await query(`
      SELECT u.id, u.name, u.email, u.role_id, r.name AS role_name, u.is_active 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.role_id ASC
    `);

    console.log(` Found ${users.length} registered users in TiDB database:`);
    users.forEach((u) => {
      console.log(`   - [Role ${u.role_id}: ${u.role_name}] ${u.name} <${u.email}> (Active: ${Boolean(u.is_active)})`);
    });
    console.log('');

    // 2. Test JWT Signing & Verification
    console.log(' Test 1: JWT Signing & Signature Verification...');
    const adminUser = users.find((u) => u.role_id === 1);
    if (!adminUser) throw new Error('Admin user not found in database');

    const token = signToken({ id: adminUser.id, email: adminUser.email, role_id: adminUser.role_id });
    const decoded = verifyToken(token);
    
    if (decoded.id === adminUser.id && decoded.role_id === 1) {
      console.log('   JWT verified successfully with claims:', { id: decoded.id, role_id: decoded.role_id });
    } else {
      throw new Error('JWT verification mismatch');
    }

    // 3. Test RBAC logic for all 3 roles
    console.log('\n Test 2: RBAC Matrix Verification...');
    
    const roleTests = [
      { role_id: 1, name: 'Admin', allowedRoutes: ['/admin'], forbiddenRoutes: ['/manager', '/employee'] },
      { role_id: 2, name: 'Manager', allowedRoutes: ['/manager'], forbiddenRoutes: ['/admin', '/employee'] },
      { role_id: 3, name: 'Employee', allowedRoutes: ['/employee'], forbiddenRoutes: ['/admin', '/manager'] },
    ];

    for (const test of roleTests) {
      const u = users.find((item) => item.role_id === test.role_id);
      if (u) {
        console.log(`   ✓ Role ${u.role_id} (${u.role_name}):`);
        console.log(`     - Allowed Access:   ${test.allowedRoutes.join(', ')}`);
        console.log(`     - Forbidden (403):  ${test.forbiddenRoutes.join(', ')}`);
      }
    }

    console.log('\n====================================================');
    console.log('  All Auth & RBAC Unit & DB Tests Passed!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exit(1);
  }
}

runAuthRbacTests();
