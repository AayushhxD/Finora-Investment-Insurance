'use server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getStore, newId, now, logActivity, advanceApplicationStatus, STATUS_CONFIG, getNextStatuses } from '@backend/infrastructure/mock-store/store'
import { getCustomerActor, getVisibleCustomers, requireCustomerAccess, requireCustomerActor } from '@backend/modules/customers/application/access-control'
import type { Application, ApplicationStatus } from '@shared/types/store-types'
import { z } from 'zod'

const CreateApplicationSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  staffId: z.string().min(1, 'Staff required'),
  productId: z.string().min(1, 'Product required'),
  notes: z.string().default(''),
})

export async function getApplications() {
  const actor = await requireCustomerActor()
  const visibleCustomers = await getVisibleCustomers(actor)
  const visibleCustomerIds = new Set(visibleCustomers.map(customer => customer.id))
  const customerById = new Map(visibleCustomers.map(customer => [customer.id, customer]))
  const store = getStore()
  return store.applications.filter(app => visibleCustomerIds.has(app.customerId)).map(app => {
    const customer = customerById.get(app.customerId)
    const staff = store.staff.find(s => s.id === app.staffId)
    const product = store.products.find(p => p.id === app.productId)
    return { ...app, customerName: customer?.name ?? '—', staffName: staff?.name ?? '—', productName: product?.name ?? '—', productCategory: product?.category ?? '—' }
  })
}

export async function getApplicationById(id: string) {
  const actor = await getCustomerActor()
  if (!actor) return null
  const store = getStore()
  const app = store.applications.find(a => a.id === id)
  if (!app) notFound()
  const { customer } = await requireCustomerAccess(app.customerId, actor)
  const staff = store.staff.find(s => s.id === app.staffId)
  const product = store.products.find(p => p.id === app.productId)
  const documents = store.documents.filter(d => d.applicationId === id)
  const messages = store.messages.filter(m => m.applicationId === id)
  const nextStatuses = getNextStatuses(app.status)
  return {
    ...app, customer, staff, product, documents, messages, nextStatuses,
    statusConfig: STATUS_CONFIG
  }
}

export async function createApplication(data: unknown) {
  const parsed = CreateApplicationSchema.parse(data)
  const actor = await requireCustomerActor()
  const { customer } = await requireCustomerAccess(parsed.customerId, actor)
  const store = getStore()
  const product = store.products.find(p => p.id === parsed.productId)
  const staff = store.staff.find(s => s.id === parsed.staffId)
  if (!customer) throw new Error('Customer not found')
  if (!product) throw new Error('Product not found')
  const app: Application = {
    id: newId(),
    ...parsed,
    status: 'LEAD_CREATED',
    pendingWith: 'Staff',
    nextAction: 'Assign staff to this lead',
    renewalDate: undefined,
    statusHistory: [{
      status: 'LEAD_CREATED', timestamp: now(),
      note: `Application created for ${product.name}`, performedBy: staff?.name ?? 'Staff'
    }],
    createdAt: now(), updatedAt: now()
  }
  store.applications.push(app)
  logActivity('application', app.id, `APP-${app.id}`, 'Application Created', staff?.name ?? 'Staff')
  revalidatePath('/applications')
  return { ok: true, id: app.id }
}

export async function updateApplicationStatus(
  appId: string, newStatus: ApplicationStatus, _performedBy: string, note?: string
) {
  const actor = await requireCustomerActor()
  await requireApplicationAccess(appId, actor)
  advanceApplicationStatus(appId, newStatus, actor.name, note)
  revalidatePath('/applications')
  revalidatePath(`/applications/${appId}`)
  revalidatePath('/renewals')
  return { ok: true }
}

export async function updateApplicationNotes(appId: string, notes: string) {
  await requireApplicationAccess(appId)
  const store = getStore()
  const app = store.applications.find(a => a.id === appId)
  if (!app) throw new Error('Application not found')
  app.notes = notes
  app.updatedAt = now()
  revalidatePath(`/applications/${appId}`)
  return { ok: true }
}

export async function requestDocuments(appId: string, docTypes: string[]) {
  await requireApplicationAccess(appId)
  const store = getStore()
  const app = store.applications.find(a => a.id === appId)
  if (!app) throw new Error('Application not found')
  docTypes.forEach(dt => {
    store.documents.push({
      id: newId(), applicationId: appId, customerId: app.customerId,
      name: dt, docType: dt, status: 'REQUESTED', requestedAt: now()
    })
  })
  logActivity('application', appId, `APP-${appId}`, `Documents requested: ${docTypes.join(', ')}`, 'Staff')
  revalidatePath(`/applications/${appId}`)
  revalidatePath('/documents')
  return { ok: true }
}

async function requireApplicationAccess(appId: string, actor?: Awaited<ReturnType<typeof requireCustomerActor>>) {
  const app = getStore().applications.find(application => application.id === appId)
  if (!app) notFound()
  await requireCustomerAccess(app.customerId, actor)
  return app
}

export async function getDashboardStats() {
  const actor = await requireCustomerActor()
  const visibleCustomers = await getVisibleCustomers(actor)
  const visibleCustomerIds = new Set(visibleCustomers.map(customer => customer.id))
  const store = getStore()
  const applications = store.applications.filter(app => visibleCustomerIds.has(app.customerId))
  const renewals = store.renewals.filter(renewal => visibleCustomerIds.has(renewal.customerId))
  const referrals = store.referrals.filter(referral => visibleCustomerIds.has(referral.referrerId))
  const visibleApplicationIds = new Set(applications.map(app => app.id))
  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(); in30.setDate(in30.getDate() + 30)
  return {
    totalCustomers: visibleCustomers.length,
    activeApplications: applications.filter(a => !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).length,
    pendingCases: applications.filter(a => a.pendingWith === 'Staff').length,
    upcomingRenewals: renewals.filter(r => {
      const d = new Date(r.renewalDate); return d >= new Date(today) && d <= in30 && r.status !== 'COMPLETED'
    }).length,
    activeReferrals: referrals.filter(r => !['SUCCESSFUL','LOST'].includes(r.status)).length,
    totalStaff: store.staff.filter(s => s.status === 'active').length,
    recentCustomers: visibleCustomers.slice(0, 5).map(customer => ({ ...customer, createdAt: customer.createdAt.toISOString() })),
    pendingApplications: applications.filter(a => a.pendingWith === 'Staff' && !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).slice(0, 5),
    recentActivity: store.activityLogs.filter(entry => visibleCustomerIds.has(entry.entityId) || visibleApplicationIds.has(entry.entityId)).slice(0, 10),
    applicationsByStatus: {
        LEAD_CREATED: applications.filter(a => a.status === 'LEAD_CREATED').length,
        STAFF_ASSIGNED: applications.filter(a => a.status === 'STAFF_ASSIGNED').length,
        DOCUMENTS_REQUESTED: applications.filter(a => a.status === 'DOCUMENTS_REQUESTED').length,
        DOCUMENTS_RECEIVED: applications.filter(a => a.status === 'DOCUMENTS_RECEIVED').length,
        SUBMITTED: applications.filter(a => a.status === 'SUBMITTED').length,
        PROCESSING: applications.filter(a => a.status === 'PROCESSING').length,
        APPROVED: applications.filter(a => a.status === 'APPROVED').length,
        COMPLETED: applications.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
    }
  }
}
