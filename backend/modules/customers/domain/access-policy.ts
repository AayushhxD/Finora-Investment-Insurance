import type { StaffRole } from '@shared/types/store-types'

export function canManageAllCustomers(role: StaffRole) {
  return role === 'Manager' || role === 'Admin'
}

export function canAccessAssignedCustomer(
  actor: { id: string; role: StaffRole },
  assignedStaffId: string,
) {
  return canManageAllCustomers(actor.role) || actor.id === assignedStaffId
}

export function canReassignCustomers(role: StaffRole) {
  return canManageAllCustomers(role)
}

