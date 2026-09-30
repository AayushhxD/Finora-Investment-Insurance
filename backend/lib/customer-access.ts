import { headers } from 'next/headers'
import { forbidden, notFound } from 'next/navigation'
import { auth } from '@backend/lib/auth'
import { db } from '@backend/lib/db'
import { customers, user } from '@backend/lib/db/schema'
import { canAccessAssignedCustomer, canManageAllCustomers } from '@backend/lib/customer-policy'
import { eq } from 'drizzle-orm'
import type { StaffRole } from '@shared/types/store-types'

export interface CustomerActor {
  id: string
  name: string
  email: string
  role: StaffRole
}

export async function getCustomerActor(): Promise<CustomerActor | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const [record] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }).from(user).where(eq(user.id, session.user.id)).limit(1)

  return record ?? null
}

export async function requireCustomerActor() {
  const actor = await getCustomerActor()
  if (!actor) forbidden()
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