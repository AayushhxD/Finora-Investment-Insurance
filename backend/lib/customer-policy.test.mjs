import assert from 'node:assert/strict'
import test from 'node:test'
import { canAccessAssignedCustomer, canGrantEmployeeRoles, canManageAllCustomers, canReassignCustomers } from './customer-policy.ts'

test('assigned employees can access their customers only', () => {
  assert.equal(canAccessAssignedCustomer({ id: 'employee-a', role: 'RM' }, 'employee-a'), true)
  assert.equal(canAccessAssignedCustomer({ id: 'employee-b', role: 'RM' }, 'employee-a'), false)
})

test('management can access customers across assignments', () => {
  assert.equal(canAccessAssignedCustomer({ id: 'manager', role: 'Manager' }, 'employee-a'), true)
  assert.equal(canAccessAssignedCustomer({ id: 'admin', role: 'Admin' }, 'employee-a'), true)
})

test('reassignment changes which employee can access the customer', () => {
  const assignment = { assignedStaffId: 'employee-a' }
  const employeeA = { id: 'employee-a', role: 'RM' }
  const employeeB = { id: 'employee-b', role: 'RM' }
  assert.equal(canAccessAssignedCustomer(employeeA, assignment.assignedStaffId), true)
  assignment.assignedStaffId = 'employee-b'
  assert.equal(canAccessAssignedCustomer(employeeA, assignment.assignedStaffId), false)
  assert.equal(canAccessAssignedCustomer(employeeB, assignment.assignedStaffId), true)
})

test('only management can reassign and only admins can grant roles', () => {
  assert.equal(canReassignCustomers('RM'), false)
  assert.equal(canReassignCustomers('Manager'), true)
  assert.equal(canGrantEmployeeRoles('Manager'), false)
  assert.equal(canGrantEmployeeRoles('Admin'), true)
  assert.equal(canManageAllCustomers('RM'), false)
})