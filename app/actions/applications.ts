'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity, advanceApplicationStatus, STATUS_CONFIG, getNextStatuses } from '@/lib/store'
import type { Application, ApplicationStatus } from '@/lib/store-types'
import { z } from 'zod'

const CreateApplicationSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  staffId: z.string().min(1, 'Staff required'),
  productId: z.string().min(1, 'Product required'),
  notes: z.string().default(''),
})

export async function getApplications() {
  const store = getStore()
  return store.applications.map(app => {
    const customer = store.customers.find(c => c.id === app.customerId)
    const staff = store.staff.find(s => s.id === app.staffId)
    const product = store.products.find(p => p.id === app.productId)
    return { ...app, customerName: customer?.name ?? '—', staffName: staff?.name ?? '—', productName: product?.name ?? '—', productCategory: product?.category ?? '—' }
  })
}

export async function getApplicationById(id: string) {
  const store = getStore()
  const app = store.applications.find(a => a.id === id)
  if (!app) return null
  const customer = store.customers.find(c => c.id === app.customerId)
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
  const store = getStore()
  const customer = store.customers.find(c => c.id === parsed.customerId)
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
  appId: string, newStatus: ApplicationStatus, performedBy: string, note?: string
) {
  advanceApplicationStatus(appId, newStatus, performedBy, note)
  revalidatePath('/applications')
  revalidatePath(`/applications/${appId}`)
  revalidatePath('/renewals')
  return { ok: true }
}

export async function updateApplicationNotes(appId: string, notes: string) {
  const store = getStore()
  const app = store.applications.find(a => a.id === appId)
  if (!app) throw new Error('Application not found')
  app.notes = notes
  app.updatedAt = now()
  revalidatePath(`/applications/${appId}`)
  return { ok: true }
}

export async function requestDocuments(appId: string, docTypes: string[]) {
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

export async function getDashboardStats() {
  const store = getStore()
  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(); in30.setDate(in30.getDate() + 30)
  return {
    totalCustomers: store.customers.length,
    activeApplications: store.applications.filter(a => !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).length,
    pendingCases: store.applications.filter(a => a.pendingWith === 'Staff').length,
    upcomingRenewals: store.renewals.filter(r => {
      const d = new Date(r.renewalDate); return d >= new Date(today) && d <= in30 && r.status !== 'COMPLETED'
    }).length,
    activeReferrals: store.referrals.filter(r => !['SUCCESSFUL','LOST'].includes(r.status)).length,
    totalStaff: store.staff.filter(s => s.status === 'active').length,
    recentCustomers: store.customers.slice(-5).reverse(),
    pendingApplications: store.applications.filter(a => a.pendingWith === 'Staff' && !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).slice(0, 5),
    recentActivity: store.activityLogs.slice(0, 10),
    applicationsByStatus: {
      LEAD_CREATED: store.applications.filter(a => a.status === 'LEAD_CREATED').length,
      STAFF_ASSIGNED: store.applications.filter(a => a.status === 'STAFF_ASSIGNED').length,
      DOCUMENTS_REQUESTED: store.applications.filter(a => a.status === 'DOCUMENTS_REQUESTED').length,
      DOCUMENTS_RECEIVED: store.applications.filter(a => a.status === 'DOCUMENTS_RECEIVED').length,
      SUBMITTED: store.applications.filter(a => a.status === 'SUBMITTED').length,
      PROCESSING: store.applications.filter(a => a.status === 'PROCESSING').length,
      APPROVED: store.applications.filter(a => a.status === 'APPROVED').length,
      COMPLETED: store.applications.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
    }
  }
}
