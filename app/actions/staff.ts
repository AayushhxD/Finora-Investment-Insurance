'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { Staff, StaffRole, StaffStatus } from '@/lib/store-types'
import { z } from 'zod'

const StaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['RM', 'Manager', 'Admin']),
  status: z.enum(['active', 'inactive']),
  joinedAt: z.string().min(1, 'Join date required'),
})

export async function getStaff() {
  return getStore().staff
}

export async function getStaffById(id: string) {
  return getStore().staff.find(s => s.id === id) ?? null
}

export async function createStaff(data: unknown) {
  const parsed = StaffSchema.parse(data)
  const staff: Staff = { id: newId(), ...parsed, createdAt: now() }
  getStore().staff.push(staff)
  logActivity('staff', staff.id, staff.name, 'Staff Created', 'Admin')
  revalidatePath('/staff')
  return { ok: true, id: staff.id }
}

export async function updateStaff(id: string, data: unknown) {
  const parsed = StaffSchema.partial().parse(data)
  const store = getStore()
  const idx = store.staff.findIndex(s => s.id === id)
  if (idx === -1) throw new Error('Staff not found')
  store.staff[idx] = { ...store.staff[idx], ...parsed }
  logActivity('staff', id, store.staff[idx].name, 'Staff Updated', 'Admin')
  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return { ok: true }
}

export async function deleteStaff(id: string) {
  const store = getStore()
  const idx = store.staff.findIndex(s => s.id === id)
  if (idx === -1) throw new Error('Staff not found')
  const name = store.staff[idx].name
  store.staff.splice(idx, 1)
  logActivity('staff', id, name, 'Staff Deleted', 'Admin')
  revalidatePath('/staff')
  return { ok: true }
}

export async function getStaffStats(staffId: string) {
  const store = getStore()
  const customers = store.customers.filter(c => c.assignedStaffId === staffId)
  const applications = store.applications.filter(a => a.staffId === staffId)
  const renewals = store.renewals.filter(r =>
    applications.some(a => a.id === r.applicationId)
  )
  const referrals = store.referrals.filter(r =>
    customers.some(c => c.id === r.referrerId)
  )
  return {
    totalCustomers: customers.length,
    activeApplications: applications.filter(a => !['COMPLETED', 'REJECTED', 'RENEWAL_SCHEDULED'].includes(a.status)).length,
    completedApplications: applications.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
    pendingApplications: applications.filter(a => a.pendingWith === 'Staff').length,
    upcomingRenewals: renewals.filter(r => r.status === 'UPCOMING' || r.status === 'REMINDER_SENT').length,
    referrals: referrals.length,
  }
}
