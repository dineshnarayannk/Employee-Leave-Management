import { query, getConnection, closePool } from '../db/index.js';
import * as leaveService from '../services/leaveService.js';
import { calculateInclusiveDays, isValidDateStr, formatISODate } from '../utils/dateUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 STEP 5: AUTOMATED TEST SUITE - LEAVE MANAGEMENT ENGINE');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // Test Group 1: Date & Day Calculation Utilities
    // -------------------------------------------------------------
    console.log('--- Group 1: Date Calculation Utilities ---');
    assert(isValidDateStr('2026-10-05') === true, 'Valid date string format recognised');
    assert(isValidDateStr('2026-02-29') === false, 'Invalid leap day in non-leap year rejected');
    assert(isValidDateStr('invalid-date') === false, 'Malformed date string rejected');

    const days3 = calculateInclusiveDays('2026-10-05', '2026-10-07');
    assert(days3 === 3, `Oct 5 to Oct 7 calculates exactly 3 inclusive days (got: ${days3})`);

    const days1 = calculateInclusiveDays('2026-10-05', '2026-10-05');
    assert(days1 === 1, `Oct 5 to Oct 5 calculates exactly 1 inclusive day (got: ${days1})`);

    let dateOrderError = false;
    try {
      calculateInclusiveDays('2026-10-08', '2026-10-05');
    } catch (e) {
      dateOrderError = true;
    }
    assert(dateOrderError, 'Reversed dates throw error');

    // -------------------------------------------------------------
    // Test Group 2: Leave Types API
    // -------------------------------------------------------------
    console.log('\n--- Group 2: Leave Types & Balances ---');
    const leaveTypes = await leaveService.getLeaveTypes();
    assert(Array.isArray(leaveTypes) && leaveTypes.length >= 4, `Active leave types retrieved (found: ${leaveTypes.length})`);
    const casualType = leaveTypes.find((lt) => lt.name === 'Casual Leave');
    assert(casualType && casualType.default_days > 0, 'Casual Leave type exists with default allocation');

    // -------------------------------------------------------------
    // Test Group 3: Setup Test Users & Manager Assignment
    // -------------------------------------------------------------
    console.log('\n--- Group 3: Test Fixture Setup ---');
    // Ensure test manager (id: 2) and test employee (id: 3) exist
    await query(
      `INSERT INTO users (id, name, email, role_id, department, manager_id, is_active)
       VALUES (2, 'Dev Manager', 'manager.dev@example.com', 2, 'Engineering', 1, TRUE)
       ON DUPLICATE KEY UPDATE name = 'Dev Manager', role_id = 2, is_active = TRUE`
    );

    await query(
      `INSERT INTO users (id, name, email, role_id, department, manager_id, is_active)
       VALUES (3, 'Dev Employee', 'employee.dev@example.com', 3, 'Engineering', 2, TRUE)
       ON DUPLICATE KEY UPDATE name = 'Dev Employee', role_id = 3, manager_id = 2, is_active = TRUE`
    );

    // Clean up test leave requests for employee 3 to have a clean state
    await query('DELETE FROM leave_requests WHERE employee_id = 3');

    // Initialize / Reset leave balances for employee 3 for 2026
    await query('DELETE FROM leave_balances WHERE employee_id = 3 AND year = 2026');
    const balances = await leaveService.getEmployeeBalances(3, 2026);
    assert(balances.length >= 4, `Employee leave balances initialized automatically for 2026 (found: ${balances.length} categories)`);
    const employeeCasualBalance = balances.find((b) => b.leave_type_name === 'Casual Leave');
    assert(employeeCasualBalance && employeeCasualBalance.remaining_days === 12, 'Casual Leave starts with 12 allocated and 12 remaining days');

    // -------------------------------------------------------------
    // Test Group 4: Leave Application Workflow & Validations
    // -------------------------------------------------------------
    console.log('\n--- Group 4: Leave Application & Validations ---');

    // Test insufficient balance rejection
    let insufficientBalanceCaught = false;
    try {
      await leaveService.createLeaveRequest(3, {
        leave_type_id: casualType.id,
        start_date: '2026-11-01',
        end_date: '2026-11-20', // 20 days > 12 remaining
        reason: 'Long vacation exceeding balance',
      });
    } catch (err) {
      insufficientBalanceCaught = true;
      assert(err.message.includes('Insufficient leave balance'), `Proper rejection message for insufficient balance: ${err.message}`);
    }
    assert(insufficientBalanceCaught, 'Application with insufficient balance was rejected');

    // Test valid leave application (2 days)
    const validReq = await leaveService.createLeaveRequest(3, {
      leave_type_id: casualType.id,
      start_date: '2026-11-02',
      end_date: '2026-11-03', // 2 days
      reason: 'Personal errands',
    });

    assert(validReq && validReq.id > 0, `Leave request created with ID #${validReq.id}`);
    assert(validReq.status === 'PENDING', 'New leave request has status PENDING');
    assert(validReq.days === 2, 'Leave request duration is exactly 2 days');

    // Check that balance was NOT deducted on PENDING status
    const balancesAfterPending = await leaveService.getEmployeeBalances(3, 2026);
    const casualAfterPending = balancesAfterPending.find((b) => b.leave_type_name === 'Casual Leave');
    assert(casualAfterPending.remaining_days === 12 && casualAfterPending.used_days === 0, 'Pending request does not deduct leave balance');

    // Test overlapping request rejection
    let overlapCaught = false;
    try {
      await leaveService.createLeaveRequest(3, {
        leave_type_id: casualType.id,
        start_date: '2026-11-03',
        end_date: '2026-11-05', // Overlaps with 2026-11-03
        reason: 'Overlapping request',
      });
    } catch (err) {
      overlapCaught = true;
      assert(err.message.includes('overlapping'), `Overlapping leave request properly blocked: ${err.message}`);
    }
    assert(overlapCaught, 'Overlapping leave application rejected');

    // -------------------------------------------------------------
    // Test Group 5: Employee Retrieval & Cancellation
    // -------------------------------------------------------------
    console.log('\n--- Group 5: Employee Requests & Cancellation ---');

    const empRequests = await leaveService.getEmployeeRequests(3, { page: 1, limit: 10 });
    assert(empRequests.requests.length >= 1, `Employee can view own requests (found: ${empRequests.requests.length})`);

    // Employee cancels request
    const cancelledReq = await leaveService.cancelLeaveRequest(validReq.id, 3);
    assert(cancelledReq.status === 'CANCELLED', `Request #${validReq.id} status updated to CANCELLED`);

    // Attempting to cancel already cancelled request fails
    let doubleCancelCaught = false;
    try {
      await leaveService.cancelLeaveRequest(validReq.id, 3);
    } catch (err) {
      doubleCancelCaught = true;
    }
    assert(doubleCancelCaught, 'Cannot cancel already cancelled request');

    // -------------------------------------------------------------
    // Test Group 6: Manager Review & Atomic Transactions
    // -------------------------------------------------------------
    console.log('\n--- Group 6: Manager Review & Atomic Transactions ---');

    // Create a new request to be approved (3 days)
    const reqToApprove = await leaveService.createLeaveRequest(3, {
      leave_type_id: casualType.id,
      start_date: '2026-11-10',
      end_date: '2026-11-12', // 3 days
      reason: 'Attending family wedding',
    });

    // Another manager (id: 999) cannot review request
    let unauthorizedReviewCaught = false;
    try {
      await leaveService.approveLeaveRequest(reqToApprove.id, 999, 'Approved');
    } catch (err) {
      unauthorizedReviewCaught = true;
    }
    assert(unauthorizedReviewCaught, 'Unauthorized manager review blocked');

    // Manager (id: 2) approves request
    const approvedReq = await leaveService.approveLeaveRequest(reqToApprove.id, 2, 'Approved. Have fun!');
    assert(approvedReq.status === 'APPROVED', `Request #${reqToApprove.id} status updated to APPROVED`);
    assert(approvedReq.manager_response === 'Approved. Have fun!', 'Manager response persisted');

    // Check that balance WAS deducted after approval
    const balancesAfterApproval = await leaveService.getEmployeeBalances(3, 2026);
    const casualAfterApproval = balancesAfterApproval.find((b) => b.leave_type_name === 'Casual Leave');
    assert(
      casualAfterApproval.used_days === 3 && casualAfterApproval.remaining_days === 9,
      `Leave balance atomically deducted: used_days = 3, remaining_days = 9 (got used: ${casualAfterApproval.used_days}, remaining: ${casualAfterApproval.remaining_days})`
    );

    // Double-approval must fail
    let doubleApprovalCaught = false;
    try {
      await leaveService.approveLeaveRequest(reqToApprove.id, 2, 'Approved again');
    } catch (err) {
      doubleApprovalCaught = true;
    }
    assert(doubleApprovalCaught, 'Cannot approve already approved request (idempotency/lock check)');

    // Create another request to test REJECTION (2 days)
    const reqToReject = await leaveService.createLeaveRequest(3, {
      leave_type_id: casualType.id,
      start_date: '2026-11-16',
      end_date: '2026-11-17', // 2 days
      reason: 'Urgent project crunch overlap',
    });

    const rejectedReq = await leaveService.rejectLeaveRequest(
      reqToReject.id,
      2,
      'Critical release scheduled during these dates.'
    );
    assert(rejectedReq.status === 'REJECTED', `Request #${reqToReject.id} status updated to REJECTED`);
    assert(rejectedReq.manager_response.includes('Critical release'), 'Rejection reason persisted');

    // Verify rejection did NOT deduct balance
    const balancesAfterRejection = await leaveService.getEmployeeBalances(3, 2026);
    const casualAfterRejection = balancesAfterRejection.find((b) => b.leave_type_name === 'Casual Leave');
    assert(
      casualAfterRejection.used_days === 3 && casualAfterRejection.remaining_days === 9,
      'Rejection does not alter leave balance'
    );

    // -------------------------------------------------------------
    // Test Group 7: Notifications & Audit Logging
    // -------------------------------------------------------------
    console.log('\n--- Group 7: Notifications & Audit Logs ---');

    const empNotifs = await leaveService.getUserNotifications(3);
    assert(empNotifs.length >= 2, `Employee received approval and rejection notifications (found: ${empNotifs.length})`);

    const mgrNotifs = await leaveService.getUserNotifications(2);
    assert(mgrNotifs.length >= 2, `Manager received application and cancellation notifications (found: ${mgrNotifs.length})`);

    const auditLogs = await query(
      `SELECT action, entity_type, entity_id FROM audit_logs 
       WHERE entity_id IN (?, ?) OR action LIKE 'LEAVE%'
       ORDER BY id DESC LIMIT 5`,
      [reqToApprove.id, reqToReject.id]
    );
    // -------------------------------------------------------------
    // Test Group 9: Step 6 Notifications Center & Security
    // -------------------------------------------------------------
    console.log('\n--- Group 9: Step 6 Notifications Center & Security ---');

    // 1. Employee only sees their own notifications
    const empOnlyNotifs = await leaveService.getUserNotifications(3);
    const hasOtherUserNotif = empOnlyNotifs.some((n) => n.user_id && n.user_id !== 3);
    assert(!hasOtherUserNotif, 'Employee sees ONLY their own notifications');

    // 2. Employee marks their own notification as read
    if (empOnlyNotifs.length > 0) {
      const targetNotif = empOnlyNotifs[0];
      const markRes = await leaveService.markNotificationAsRead(targetNotif.id, 3);
      assert(markRes.success === true, `Employee successfully marked notification #${targetNotif.id} as read`);

      // 3. Employee CANNOT mark another user's (manager 2) notification as read
      const mgrNotifs = await leaveService.getUserNotifications(2);
      if (mgrNotifs.length > 0) {
        let unauthorizedNotifMarkCaught = false;
        try {
          await leaveService.markNotificationAsRead(mgrNotifs[0].id, 3); // Employee 3 tries to mark Manager 2's notif
        } catch (err) {
          unauthorizedNotifMarkCaught = true;
          assert(err.statusCode === 403 || err.message.includes('Access denied'), `Cross-user notification modification blocked: ${err.message}`);
        }
        assert(unauthorizedNotifMarkCaught, 'User blocked from modifying another user\'s notification');
      }

      // 4. Mark all as read works correctly
      const markAllRes = await leaveService.markAllNotificationsAsRead(3);
      assert(markAllRes.success === true, 'Mark all notifications as read succeeded');
      const unreadAfter = await leaveService.getUserNotifications(3, { unreadOnly: true });
      assert(unreadAfter.length === 0, 'Zero unread notifications remaining after markAllAsRead');
    }

    // -------------------------------------------------------------
    // Test Group 10: Step 6 Employee Calendar & Month Filtering
    // -------------------------------------------------------------
    console.log('\n--- Group 10: Step 6 Employee Calendar & Month Filtering ---');

    // Employee calendar query for November 2026 (2026-11)
    const empNovRequests = await leaveService.getEmployeeRequests(3, { month: '2026-11' });
    assert(empNovRequests.requests.length >= 2, `Employee calendar retrieved requests for 2026-11 (found: ${empNovRequests.requests.length})`);

    // Status filtering works (APPROVED)
    const empApprovedOnly = await leaveService.getEmployeeRequests(3, { status: 'APPROVED' });
    const allAreApproved = empApprovedOnly.requests.every((r) => r.status === 'APPROVED');
    assert(allAreApproved && empApprovedOnly.requests.length >= 1, 'Status filter correctly isolated APPROVED leaves');

    // Search filter works
    const empSearch = await leaveService.getEmployeeRequests(3, { search: 'family wedding' });
    assert(empSearch.requests.length >= 1 && empSearch.requests[0].reason.includes('family wedding'), 'Search filter matches keyword in reason');

    // -------------------------------------------------------------
    // Test Group 11: Step 6 Manager Team Calendar & Scope Security
    // -------------------------------------------------------------
    console.log('\n--- Group 11: Step 6 Manager Team Calendar & Scope Security ---');

    // Manager 2 team requests
    const mgrTeamRequests = await leaveService.getManagerRequests(2, { month: '2026-11' });
    assert(mgrTeamRequests.requests.length >= 2, `Manager retrieved team leaves for 2026-11 (found: ${mgrTeamRequests.requests.length})`);

    // Manager 2 filtering by employee_id = 3
    const mgrFilterEmp = await leaveService.getManagerRequests(2, { employee_id: 3 });
    const onlyEmp3 = mgrFilterEmp.requests.every((r) => r.employee_id === 3);
    assert(onlyEmp3 && mgrFilterEmp.requests.length >= 2, 'Manager employee filter isolates specific direct report');

    // Manager 999 (no direct reports) retrieves empty list
    const unrelatedMgr = await leaveService.getManagerRequests(999, {});
    assert(unrelatedMgr.requests.length === 0, 'Unrelated manager sees 0 requests from other teams');

    // -------------------------------------------------------------
    // Test Group 12: Step 6 Leave Request Details & Ownership Security
    // -------------------------------------------------------------
    console.log('\n--- Group 12: Step 6 Detailed Request Views & Authorization ---');

    // Employee 3 views own request details
    const empReqDetail = await leaveService.getLeaveRequestById(reqToApprove.id, { id: 3, role_id: 3 });
    assert(empReqDetail.id === reqToApprove.id, `Employee successfully retrieved details for request #${reqToApprove.id}`);
    assert(empReqDetail.days === 3, `Calculated duration is 3 inclusive days (${empReqDetail.start_date} to ${empReqDetail.end_date})`);

    // Another employee (id: 4) attempts to view Employee 3's request -> must throw 403
    let crossEmployeeAccessBlocked = false;
    try {
      await leaveService.getLeaveRequestById(reqToApprove.id, { id: 4, role_id: 3 });
    } catch (err) {
      crossEmployeeAccessBlocked = true;
      assert(err.statusCode === 403, `Cross-employee request view blocked: ${err.message}`);
    }
    assert(crossEmployeeAccessBlocked, 'Employee cannot view another employee\'s leave request details');

    // Manager 2 (assigned manager) can view request details
    const mgrReqDetail = await leaveService.getLeaveRequestById(reqToApprove.id, { id: 2, role_id: 2 });
    assert(mgrReqDetail.id === reqToApprove.id && mgrReqDetail.manager_response === 'Approved. Have fun!', 'Manager successfully retrieved team request details with supervisor notes');

    // Another manager (id: 999) attempts to view Employee 3's request -> must throw 403
    let crossManagerAccessBlocked = false;
    try {
      await leaveService.getLeaveRequestById(reqToApprove.id, { id: 999, role_id: 2 });
    } catch (err) {
      crossManagerAccessBlocked = true;
      assert(err.statusCode === 403, `Cross-manager team request view blocked: ${err.message}`);
    }
    assert(crossManagerAccessBlocked, 'Manager cannot view requests outside their direct reports');

    // -------------------------------------------------------------
    // Test Group 13: Step 6 Dashboard Integration & Upcoming Leaves
    // -------------------------------------------------------------
    console.log('\n--- Group 13: Step 6 Dashboard Widgets & Upcoming Leaves ---');

    const empStats = await leaveService.getEmployeeStats(3);
    assert(empStats.totalRequests >= 3, `Employee total requests metric accurate (got: ${empStats.totalRequests})`);
    assert(Array.isArray(empStats.upcomingLeaves), 'Employee stats includes upcomingLeaves array');

    const mgrDashboardStats = await leaveService.getManagerStats(2);
    assert(Array.isArray(mgrDashboardStats.upcomingTeamLeaves), 'Manager stats includes upcomingTeamLeaves array');

    console.log('\n======================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    await closePool();
  }
}

runTests().then(() => {
  process.exit(failed > 0 ? 1 : 0);
});

