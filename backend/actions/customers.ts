'use server'
import { revalidatePath } from 'next/cache'
import { forbidden, notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { canGrantEmployeeRoles, canReassignCustomers } from '@backend/lib/customer-policy'
import { canManageCustomers, getCustomerActor, getVisibleCustomers, requireCustomerAccess, requireCustomerActor } from '@backend/lib/customer-access'
import { db } from '@backend/lib/db'
import { auditLogs, customers, user } from '@backend/lib/db/schema'
import { getStore, newId, now, logActivity } from '@backend/lib/store'
import type { Customer, StaffRole } from '@shared/types/store-types'
import { z } from 'zod'

const CustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name required'),
  email: z.string().trim().email('Invalid email').transform(value => value.toLowerCase()),
  phone: z.string().trim().min(10, 'Phone must be at least 10 characters'),
  address: z.string().trim().min(5, 'Address required'),
  city: z.string().trim().min(2, 'City required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth'),
  panNumber: z.string().trim().length(10, 'PAN must be 10 characters').transform(value => value.toUpperCase()).pipe(z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN number')),
  assignedStaffId: z.string().min(1, 'Assign a staff member'),
  status: z.enum(['active', 'inactive', 'prospect']),
})

function toCustomer(record: typeof customers.$inferSelect): Customer {
  return { ...record, createdAt: record.createdAt.toISOString() }
}

async function getAssignableStaff(actor: NonNullable<Awaited<ReturnType<typeof getCustomerActor>>>) {
  const records = canManageCustomers(actor)
    ? await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }).from(user)
    : await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }).from(user).where(eq(user.id, actor.id))

  return records.sort((left, right) => Number(right.id === actor.id) - Number(left.id === actor.id)).map(record => ({
    ...record,
    phone: '',
    status: 'active' as const,
    joinedAt: record.createdAt.toISOString().slice(0, 10),
    createdAt: record.createdAt.toISOString(),
  }))
}

export async function getCustomerStaff() {
  const actor = await requireCustomerActor()
  return getAssignableStaff(actor)
}

export async function getCustomers() {
  const actor = await requireCustomerActor()
  const records = await getVisibleCustomers(actor)
  return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(toCustomer)
}

export async function getCustomerById(id: string) {
  const actor = await getCustomerActor()
  if (!actor) return null
  const { customer } = await requireCustomerAccess(id, actor)
  return toCustomer(customer)
}

export async function createCustomer(data: unknown) {
  const actor = await requireCustomerActor()
  const parsed = CustomerSchema.parse(data)
  const canAssignOthers = canReassignCustomers(actor.role)
  if (!canAssignOthers && parsed.assignedStaffId !== actor.id) forbidden()
  const [assignee] = await db.select({ id: user.id }).from(user).where(eq(user.id, parsed.assignedStaffId)).limit(1)
  if (!assignee) notFound()

  const referralCode = `${parsed.name.replace(/[^a-z\d]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X')}${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const customer = await db.transaction(async tx => {
    const [created] = await tx.insert(customers).values({
      id: randomUUID(),
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      city: parsed.city,
      dob: parsed.dob,
      panNumber: parsed.panNumber,
      createdById: actor.id,
      assignedStaffId: parsed.assignedStaffId,
      status: parsed.status,
      referralCode,
    }).returning({ id: customers.id, name: customers.name })

    await tx.insert(auditLogs).values({
      userId: actor.id,
      action: 'create',
      entity: 'customer',
      entityId: created.id,
      metadata: { assignedStaffId: parsed.assignedStaffId },
    })
    return created
  })
  logActivity('customer', customer.id, customer.name, 'Customer Created', actor.name)
  revalidatePath('/customers')
  return { ok: true, id: customer.id }
}

export async function updateCustomer(id: string, data: unknown) {
  const actor = await requireCustomerActor()
  const parsed = CustomerSchema.partial().parse(data)
  const { customer: current } = await requireCustomerAccess(id, actor)
  const reassigned = parsed.assignedStaffId && parsed.assignedStaffId !== current.assignedStaffId
  if (reassigned && !canReassignCustomers(actor.role)) forbidden()
  if (reassigned) {
    const [assignee] = await db.select({ id: user.id }).from(user).where(eq(user.id, parsed.assignedStaffId!)).limit(1)
    if (!assignee) notFound()
  }

  const updated = await db.transaction(async tx => {
    const [record] = await tx.update(customers)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning({ id: customers.id, name: customers.name })
    if (!record) notFound()

    if (reassigned) {
      await tx.insert(auditLogs).values({
        userId: actor.id,
        action: 'reassign',
        entity: 'customer',
        entityId: id,
        metadata: { fromStaffId: current.assignedStaffId, toStaffId: parsed.assignedStaffId },
      })
    }
    await tx.insert(auditLogs).values({ userId: actor.id, action: 'update', entity: 'customer', entityId: id })
    return record
  })
  logActivity('customer', id, updated.name, 'Customer Updated', actor.name)
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  revalidatePath(`/portal/${id}`)
  return { ok: true }
}

export async function deleteCustomer(id: string) {
  const { actor, customer } = await requireCustomerAccess(id)
  await db.transaction(async tx => {
    await tx.insert(auditLogs).values({ userId: actor.id, action: 'delete', entity: 'customer', entityId: id })
    await tx.delete(customers).where(eq(customers.id, id))
  })
  logActivity('customer', id, customer.name, 'Customer Deleted', actor.name)
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  revalidatePath(`/portal/${id}`)
  return { ok: true }
}

export async function getCustomerFullProfile(id: string) {
  const actor = await getCustomerActor()
  if (!actor) return null
  const customer = toCustomer((await requireCustomerAccess(id, actor)).customer)
  const store = getStore()
  const staff = (await getAssignableStaff(actor)).find(member => member.id === customer.assignedStaffId)
  const applications = store.applications.filter(a => a.customerId === id)
  const documents = store.documents.filter(d => d.customerId === id)
  const messages = store.messages.filter(m => m.fromId === id || applications.some(a => a.id === m.applicationId))
  const renewals = store.renewals.filter(r => r.customerId === id)
  const referrals = store.referrals.filter(r => r.referrerId === id)
  const rewards = store.rewards.filter(r => r.customerId === id)
  const activity = store.activityLogs.filter(a =>
    a.entityId === id || applications.some(app => app.id === a.entityId)
  ).slice(0, 20)
  return { customer, staff, applications, documents, messages, renewals, referrals, rewards, activity }
}

export async function reassignCustomerStaff(customerId: string, newStaffId: string) {
  const actor = await requireCustomerActor()
  if (!canReassignCustomers(actor.role)) forbidden()
  const { customer: current } = await requireCustomerAccess(customerId, actor)
  const [target] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, newStaffId)).limit(1)
  if (!target) notFound()
  const updated = await db.transaction(async tx => {
    const [record] = await tx.update(customers)
      .set({ assignedStaffId: target.id, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
      .returning({ id: customers.id, name: customers.name })
    if (!record) notFound()
    await tx.insert(auditLogs).values({
      userId: actor.id,
      action: 'reassign',
      entity: 'customer',
      entityId: customerId,
      metadata: { fromStaffId: current.assignedStaffId, toStaffId: target.id },
    })
    return record
  })
  logActivity('customer', customerId, updated.name, `Reassigned to ${target.name}`, actor.name)
  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  revalidatePath(`/portal/${customerId}`)
  return { ok: true }
}

export async function grantEmployeeRole(employeeId: string, role: StaffRole) {
  const actor = await requireCustomerActor()
  if (!canGrantEmployeeRoles(actor.role)) forbidden()
  const parsedRole = z.enum(['RM', 'Manager', 'Admin']).parse(role)
  const [target] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, employeeId)).limit(1)
  if (!target) notFound()
  if (target.role === parsedRole) return { ok: true }

  await db.transaction(async tx => {
    await tx.update(user).set({ role: parsedRole, updatedAt: new Date() }).where(eq(user.id, employeeId))
    await tx.insert(auditLogs).values({
      userId: actor.id,
      action: 'grant_role',
      entity: 'user',
      entityId: employeeId,
      metadata: { fromRole: target.role, toRole: parsedRole },
    })
  })
  revalidatePath('/staff')
  revalidatePath('/customers')
  return { ok: true }
}
