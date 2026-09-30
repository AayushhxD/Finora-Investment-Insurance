import { headers } from 'next/headers'
import { forbidden, notFound } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { auth } from '@backend/infrastructure/auth/server'
import { db } from '@backend/infrastructure/database/client'
import { auditLogs, customers, staffProfiles, user } from '@backend/infrastructure/database/schema'
import { canAccessAssignedCustomer, canManageAllCustomers } from '@backend/modules/customers/domain/access-policy'
import { eq } from 'drizzle-orm'
import type { StaffRole } from '@shared/types/store-types'

export interface CustomerActor {
  id: string
  name: string
  email: string
  role: StaffRole
  status: 'active' | 'inactive'
}

export async function getCustomerActor(): Promise<CustomerActor | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const [record] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: staffProfiles.status,
  }).from(user)
    .innerJoin(staffProfiles, eq(staffProfiles.userId, user.id))
    .where(eq(user.id, session.user.id))
    .limit(1)

  return record ?? null
}

export async function requireCustomerActor() {
  let actor = await getCustomerActor()
  if (!actor) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) forbidden()
    const [account] = await db.select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
    if (!account) forbidden()

    await db.transaction(async tx => {
      const [profile] = await tx.insert(staffProfiles).values({
        userId: account.id,
        employeeCode: `AUTO-${randomUUID().slice(0, 8).toUpperCase()}`,
        designation: account.role === 'RM' ? 'Relationship Manager' : account.role,
        status: 'active',
      }).onConflictDoNothing({ target: staffProfiles.userId }).returning({ id: staffProfiles.id })
      if (profile) {
        await tx.insert(auditLogs).values({
          userId: account.id,
          action: 'create',
          entity: 'staff_profile',
          entityId: profile.id,
          metadata: { source: 'first_authenticated_access', role: account.role },
        })
      }
    })
    actor = await getCustomerActor()
  }
  if (!actor || actor.status !== 'active') forbidden()
  return actor
}

export async function getVisibleCustomers(actor: CustomerActor) {
  if (canManageAllCustomers(actor.role)) {
    return db.select().from(customers)
  }
  return db.select().from(customers).where(eq(customers.assignedStaffId, actor.id))
}

export async function requireCustomerAccess(customerId: string, actor?: CustomerActor) {
  const currentActor = actor ?? await requireCustomerActor()
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1)
  if (!customer || !canAccessAssignedCustomer(currentActor, customer.assignedStaffId)) {
    notFound()
  }
  return { actor: currentActor, customer }
}

export function canManageCustomers(actor: CustomerActor) {
  return canManageAllCustomers(actor.role)
}