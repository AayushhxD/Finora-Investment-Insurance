import type { StaffRole } from '@shared/types/store-types'

export function canGrantEmployeeRoles(role: StaffRole) {
  return role === 'Admin'
}

export function canManageStaff(role: StaffRole) {
  return role === 'Manager' || role === 'Admin'
}

export function canViewStaff(actor: { id: string; role: StaffRole }, staffId: string) {
  return canManageStaff(actor.role) || actor.id === staffId
}