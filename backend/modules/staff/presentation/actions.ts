'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@backend/infrastructure/mock-store/store'
import { forbidden, notFound } from 'next/navigation'
import { and, asc, count, desc, eq, ilike, notInArray, or } from 'drizzle-orm'
import { db } from '@backend/infrastructure/database/client'
import { auditLogs, customers, staffProfiles, user } from '@backend/infrastructure/database/schema'
import { requireCustomerActor } from '@backend/modules/customers/application/access-control'
import { canManageStaff, canViewStaff } from '@backend/modules/staff/domain/access-policy'
import type { Staff } from '@shared/types/store-types'
import { z } from 'zod'

const StaffProfileSchema = z.object({
  userId: z.string().min(1, 'Select an existing user account'),
  employeeCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,32}$/, 'Use 2-32 letters, numbers, or hyphens'),
  designation: z.string().trim().min(2).max(100),
  department: z.string().trim().max(100).nullable().optional().transform(value => value === '' ? null : value),
  phone: z.string().trim().max(32).refine(value => value === '' || value.length >= 7).nullable().optional().transform(value => value === '' ? null : value),
})
const StaffUpdateSchema = StaffProfileSchema.omit({ userId: true }).partial()
const StaffStatusSchema = z.enum(['active', 'inactive'])
const StaffListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(''),
  status: StaffStatusSchema.optional(),
  role: z.enum(['RM', 'Manager', 'Admin']).optional(),
  designation: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  sortBy: z.enum(['createdAt', 'name', 'employeeCode']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})
function mapStaff(record: {
  profileId: string
  userId: string
  employeeCode: string
  designation: string
  department: string | null
  profilePhone: string | null
  status: 'active' | 'inactive'
  joinedAt: Date
  name: string
  email: string
  role: Staff['role']
}): Staff {
  return {
    id: record.userId,
  profileId: record.profileId,
  employeeCode: record.employeeCode,
  name: record.name,
  email: record.email,
  phone: record.profilePhone ?? '',
  role: record.role,
  status: record.status,
  designation: record.designation,
  department: record.department,
    joinedAt: record.joinedAt.toISOString().slice(0, 10),
    createdAt: record.joinedAt.toISOString(),
  }
}

function staffSelection() {
  return {
    profileId: staffProfiles.id,
    userId: user.id,
  employeeCode: staffProfiles.employeeCode,
  designation: staffProfiles.designation,
  department: staffProfiles.department,
  profilePhone: staffProfiles.phone,
  status: staffProfiles.status,
  joinedAt: staffProfiles.createdAt,
  name: user.name,
  email: user.email,
  role: user.role,
  }
}

function throwStaffConstraintError(error: unknown): never {
  const cause = typeof error === 'object' && error !== null && 'cause' in error ? error.cause : error
  if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505') {
    const constraint = 'constraint' in cause ? cause.constraint : undefined
    if (constraint === 'staff_profiles_user_id_key') throw new Error('This user account already has a staff profile.')
    if (constraint === 'staff_profiles_employee_code_key') throw new Error('That employee code is already in use.')
    throw new Error('A staff profile with those details already exists.')
  }
  throw error
}

async function requireStaffManager() {
  const actor = await requireCustomerActor()
  if (!canManageStaff(actor.role)) forbidden()
  return actor
}

export async function listStaff(query: unknown = {}) {
  const actor = await requireCustomerActor()
  const filters = StaffListSchema.parse(query)
  const conditions = []
  if (!canManageStaff(actor.role)) conditions.push(eq(staffProfiles.userId, actor.id))
  if (filters.status) conditions.push(eq(staffProfiles.status, filters.status))
  if (filters.role) conditions.push(eq(user.role, filters.role))
  if (filters.designation) conditions.push(eq(staffProfiles.designation, filters.designation))
  if (filters.department) conditions.push(eq(staffProfiles.department, filters.department))
  if (filters.search) {
    const search = `%${filters.search.replace(/[\\%_]/g, '\\$&')}%`
    conditions.push(or(ilike(staffProfiles.employeeCode, search), ilike(user.name, search), ilike(user.email, search))!)
  }

  const where = conditions.length ? and(...conditions) : undefined
  const sortColumn = filters.sortBy === 'name'
    ? user.name
    : filters.sortBy === 'employeeCode'
      ? staffProfiles.employeeCode
    : staffProfiles.createdAt
  const order = filters.sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn)
  const [{ total }] = await db.select({ total: count() })
  .from(staffProfiles)
  .innerJoin(user, eq(staffProfiles.userId, user.id))
  .where(where)
  const directoryConditions = canManageStaff(actor.role) ? [] : [eq(staffProfiles.userId, actor.id)]
  const groupedCounts = await db.select({ role: user.role, status: staffProfiles.status, total: count() })
    .from(staffProfiles)
    .innerJoin(user, eq(staffProfiles.userId, user.id))
    .where(directoryConditions.length ? and(...directoryConditions) : undefined)
    .groupBy(user.role, staffProfiles.status)
  const stats = groupedCounts.reduce((summary, row) => {
    summary.total += row.total
    if (row.status === 'active') summary.active += row.total
    if (row.status === 'inactive') summary.inactive += row.total
    if (row.role === 'RM') summary.relationshipManagers += row.total
    if (row.role === 'Manager') summary.managers += row.total
    if (row.role === 'Admin') summary.admins += row.total
    return summary
  }, { total: 0, active: 0, inactive: 0, relationshipManagers: 0, managers: 0, admins: 0 })
  const records = await db.select(staffSelection())
    .from(staffProfiles)
    .innerJoin(user, eq(staffProfiles.userId, user.id))
  .where(where)
  .orderBy(order, asc(user.id))
  .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit)

  return {
  items: records.map(mapStaff),
  page: filters.page,
  limit: filters.limit,
    total,
    totalPages: Math.ceil(total / filters.limit),
    stats,
  }
}

export async function getStaff() {
  return (await listStaff({ limit: 100 })).items
}

export async function getStaffById(id: string) {
  const actor = await requireCustomerActor()
  if (!canViewStaff(actor, id)) notFound()
  const [record] = await db.select(staffSelection())
  .from(staffProfiles)
  .innerJoin(user, eq(staffProfiles.userId, user.id))
  .where(eq(staffProfiles.userId, id))
    .limit(1)
  return record ? mapStaff(record) : null
}

export async function getUnlinkedStaffUsers() {
  await requireStaffManager()
  const linked = db.select({ userId: staffProfiles.userId }).from(staffProfiles)
  return db.select({ id: user.id, name: user.name, email: user.email })
  .from(user)
  .where(notInArray(user.id, linked))
  .orderBy(asc(user.name))
}

export async function createStaff(data: unknown) {
  const actor = await requireStaffManager()
  const parsed = StaffProfileSchema.parse(data)
  const [account] = await db.select({ id: user.id }).from(user).where(eq(user.id, parsed.userId)).limit(1)
  if (!account) notFound()

  try {
    const profile = await db.transaction(async tx => {
      const [created] = await tx.insert(staffProfiles).values({
        userId: parsed.userId,
        employeeCode: parsed.employeeCode,
        designation: parsed.designation,
        department: parsed.department || null,
        phone: parsed.phone || null,
        status: 'active',
      }).returning()
      await tx.insert(auditLogs).values({
        userId: actor.id,
        action: 'create',
        entity: 'staff_profile',
        entityId: created.id,
        metadata: { employeeCode: created.employeeCode, linkedUserId: created.userId },
      })
      return created
    })
    revalidatePath('/staff')
    return { ok: true, id: profile.userId }
  } catch (error) {
    throwStaffConstraintError(error)
  }
}

export async function updateStaff(id: string, data: unknown) {
  const actor = await requireStaffManager()
  const parsed = StaffUpdateSchema.parse(data)
  const [current] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, id)).limit(1)
  if (!current) notFound()

  try {
    const updated = await db.transaction(async tx => {
      const [record] = await tx.update(staffProfiles)
        .set({ ...parsed, updatedAt: new Date() })
        .where(eq(staffProfiles.userId, id))
        .returning()
      await tx.insert(auditLogs).values({
        userId: actor.id,
        action: 'update',
        entity: 'staff_profile',
        entityId: current.id,
        metadata: {
          before: { employeeCode: current.employeeCode, designation: current.designation, department: current.department, phone: current.phone },
          after: { employeeCode: record.employeeCode, designation: record.designation, department: record.department, phone: record.phone },
        },
      })
      return record
    })
    revalidatePath('/staff')
    revalidatePath('/customers')
    return { ok: true, id: updated.userId }
  } catch (error) {
    throwStaffConstraintError(error)
  }
}

export async function updateStaffStatus(id: string, status: unknown) {
  const actor = await requireStaffManager()
  const parsedStatus = StaffStatusSchema.parse(status)
  const [current] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, id)).limit(1)
  if (!current) notFound()
  if (current.status === parsedStatus) return { ok: true }

  await db.transaction(async tx => {
    await tx.update(staffProfiles)
      .set({ status: parsedStatus, updatedAt: new Date() })
      .where(eq(staffProfiles.userId, id))
    await tx.insert(auditLogs).values({
      userId: actor.id,
      action: parsedStatus === 'active' ? 'activate' : 'deactivate',
      entity: 'staff_profile',
      entityId: current.id,
      metadata: { before: current.status, after: parsedStatus },
    })
  })
  revalidatePath('/staff')
  revalidatePath('/customers')
  return { ok: true }
}

export async function deleteStaff(id: string) {
  return updateStaffStatus(id, 'inactive')
}

export async function getStaffCustomers(staffId: string) {
  const actor = await requireCustomerActor()
  if (!canViewStaff(actor, staffId)) notFound()
  const [profile] = await db.select({ status: staffProfiles.status })
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, staffId))
    .limit(1)
  if (!profile) notFound()
  return db.select().from(customers).where(eq(customers.assignedStaffId, staffId)).orderBy(desc(customers.createdAt))
}

export async function getStaffStats(staffId: string) {
  const actor = await requireCustomerActor()
  if (!canViewStaff(actor, staffId)) notFound()
  const [profile] = await db.select({ status: staffProfiles.status })
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, staffId))
    .limit(1)
  if (!profile) notFound()
  const assignedCustomers = await db.select({ id: customers.id })
    .from(customers)
    .where(eq(customers.assignedStaffId, staffId))
  const customerIds = new Set(assignedCustomers.map(customer => customer.id))
  const store = getStore()
  const applications = store.applications.filter(application => customerIds.has(application.customerId))
  const renewals = store.renewals.filter(renewal => customerIds.has(renewal.customerId))
  const referrals = store.referrals.filter(referral => customerIds.has(referral.referrerId))
  return {
    status: profile.status,
    totalCustomers: customerIds.size,
    activeApplications: applications.filter(application => !['COMPLETED', 'REJECTED', 'RENEWAL_SCHEDULED'].includes(application.status)).length,
    completedApplications: applications.filter(application => application.status === 'COMPLETED' || application.status === 'RENEWAL_SCHEDULED').length,
    pendingApplications: applications.filter(application => application.pendingWith === 'Staff').length,
    upcomingRenewals: renewals.filter(renewal => renewal.status === 'UPCOMING' || renewal.status === 'REMINDER_SENT').length,
    referrals: referrals.length,
  }
}
