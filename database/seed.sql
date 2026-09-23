-- ==============================================================================
-- EMPLOYEE LEAVE MANAGEMENT SYSTEM - SEED DATA
-- Target Engine: TiDB Cloud / MySQL 8.0+ Compatible
-- Note: Uses INSERT ... ON DUPLICATE KEY UPDATE for idempotent reruns
-- ==============================================================================

-- ==============================================================================
-- 1. SYSTEM ROLES
-- Role IDs: 1 = Admin, 2 = Manager, 3 = Employee
-- ==============================================================================
INSERT INTO roles (id, name, description)
VALUES 
  (1, 'Admin', 'Full administrative control over users, departments, and leave policies'),
  (2, 'Manager', 'Departmental supervisor with leave approval and team calendar review authority'),
  (3, 'Employee', 'Standard organizational staff with leave application and balance tracking access')
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description);

-- ==============================================================================
-- 2. DEFAULT LEAVE TYPES
-- Standard corporate leave allocations
-- ==============================================================================
INSERT INTO leave_types (name, description, default_days, is_active)
VALUES 
  ('Casual Leave', 'Short-term personal time off and personal errands', 12, TRUE),
  ('Sick Leave', 'Medical rest, doctor appointments, and recovery', 10, TRUE),
  ('Earned Leave', 'Accrued annual vacation and planned time off', 15, TRUE),
  ('Optional Holiday', 'Floating cultural or religious observance days', 3, TRUE)
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  default_days = VALUES(default_days),
  is_active = VALUES(is_active);

-- ==============================================================================
-- 3. DEVELOPMENT / TEST USERS (DEVELOPMENT ENVIRONMENT ONLY)
-- IMPORTANT: These accounts use mock '@example.com' emails for testing RBAC.
-- DO NOT USE IN PRODUCTION. Real accounts are populated upon Google OAuth login.
-- ==============================================================================
-- Sample hierarchy:
--   1) admin.dev@example.com (Admin - role_id: 1)
--   2) manager.dev@example.com (Manager - role_id: 2, reports to Admin)
--   3) employee.dev@example.com (Employee - role_id: 3, reports to Manager)
-- ==============================================================================

INSERT INTO users (id, google_id, name, email, role_id, department, manager_id, is_active)
VALUES 
  (1, NULL, 'Dev Admin', 'admin.dev@example.com', 1, 'Human Resources', NULL, TRUE)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  role_id = VALUES(role_id),
  department = VALUES(department);

INSERT INTO users (id, google_id, name, email, role_id, department, manager_id, is_active)
VALUES 
  (2, NULL, 'Dev Manager', 'manager.dev@example.com', 2, 'Engineering', 1, TRUE)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  role_id = VALUES(role_id),
  manager_id = VALUES(manager_id),
  department = VALUES(department);

INSERT INTO users (id, google_id, name, email, role_id, department, manager_id, is_active)
VALUES 
  (3, NULL, 'Dev Employee', 'employee.dev@example.com', 3, 'Engineering', 2, TRUE)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  role_id = VALUES(role_id),
  manager_id = VALUES(manager_id),
  department = VALUES(department);

-- Reset auto-increment counter to avoid conflicts with future inserts
-- ALTER TABLE users AUTO_INCREMENT = 100;
