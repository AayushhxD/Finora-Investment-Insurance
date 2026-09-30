'use server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getStore, newId, now, logActivity, addNotification } from '@backend/lib/store'
import { getVisibleCustomers, requireCustomerAccess, requireCustomerActor } from '@backend/lib/customer-access'
import type { DocumentStatus } from '@shared/types/store-types'

export async function getDocuments() {
  const actor = await requireCustomerActor()
  const visibleCustomers = await getVisibleCustomers(actor)
  const visibleCustomerIds = new Set(visibleCustomers.map(customer => customer.id))
  const customerById = new Map(visibleCustomers.map(customer => [customer.id, customer]))
  const store = getStore()
  return store.documents.filter(doc => visibleCustomerIds.has(doc.customerId)).map(doc => {
    const customer = customerById.get(doc.customerId)
    const app = store.applications.find(a => a.id === doc.applicationId)
    const product = app ? store.products.find(p => p.id === app.productId) : null
    return { ...doc, customerName: customer?.name ?? '—', productName: product?.name ?? '—' }
  })
}

export async function getDocumentsByApplication(applicationId: string) {
  const store = getStore()
  const app = store.applications.find(application => application.id === applicationId)
  if (!app) notFound()
  await requireCustomerAccess(app.customerId)
  return store.documents.filter(d => d.applicationId === applicationId)
}

async function requireDocumentAccess(docId: string) {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === docId)
  if (idx === -1) notFound()
  await requireCustomerAccess(store.documents[idx].customerId)
  return { store, idx }
}

export async function uploadDocument(docId: string, fileName: string, fileData: string) {
  const { store, idx } = await requireDocumentAccess(docId)
  store.documents[idx].status = 'UPLOADED'
  store.documents[idx].fileName = fileName
  store.documents[idx].fileData = fileData
  store.documents[idx].uploadedAt = now()
  const doc = store.documents[idx]
  logActivity('document', docId, `${doc.docType} - ${doc.customerId}`, 'Document Uploaded', 'Customer')
  addNotification('Document Uploaded', `${doc.name} has been uploaded`, 'document', `/applications/${doc.applicationId}`)
  // Check if all docs for application are uploaded
  const appDocs = store.documents.filter(d => d.applicationId === doc.applicationId)
  const allUploaded = appDocs.every(d => d.status !== 'REQUESTED')
  if (allUploaded) {
    const app = store.applications.find(a => a.id === doc.applicationId)
    if (app && app.status === 'DOCUMENTS_REQUESTED') {
      const { advanceApplicationStatus } = require('@backend/lib/store')
      advanceApplicationStatus(doc.applicationId, 'DOCUMENTS_RECEIVED', 'system', 'All documents received')
    }
  }
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  revalidatePath(`/portal/${doc.customerId}/documents`)
  return { ok: true }
}

export async function verifyDocument(docId: string, _performedBy: string) {
  const actor = await requireCustomerActor()
  const { store, idx } = await requireDocumentAccess(docId)
  store.documents[idx].status = 'VERIFIED'
  store.documents[idx].reviewedAt = now()
  const doc = store.documents[idx]
  logActivity('document', docId, doc.name, 'Document Verified', actor.name)
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function rejectDocument(docId: string, reason: string, _performedBy: string) {
  const actor = await requireCustomerActor()
  const { store, idx } = await requireDocumentAccess(docId)
  store.documents[idx].status = 'REJECTED'
  store.documents[idx].rejectionReason = reason
  store.documents[idx].reviewedAt = now()
  const doc = store.documents[idx]
  logActivity('document', docId, doc.name, `Document Rejected: ${reason}`, actor.name)
  addNotification('Document Rejected', `${doc.name} was rejected: ${reason}`, 'document', `/portal/${doc.customerId}/documents`)
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function requestMoreDocuments(applicationId: string, docTypes: string[], _performedBy: string) {
  const store = getStore()
  const app = store.applications.find(a => a.id === applicationId)
  if (!app) notFound()
  const actor = await requireCustomerActor()
  await requireCustomerAccess(app.customerId, actor)
  docTypes.forEach(dt => {
    store.documents.push({
      id: newId(), applicationId, customerId: app.customerId,
      name: dt, docType: dt, status: 'REQUESTED', requestedAt: now()
    })
  })
  logActivity('document', applicationId, `APP-${applicationId}`, `Additional documents requested: ${docTypes.join(', ')}`, actor.name)
  revalidatePath(`/applications/${applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function createDocument(customerId: string, data: any) {
  await requireCustomerAccess(customerId)
  if (data.applicationId) {
    const app = getStore().applications.find(application => application.id === data.applicationId)
    if (!app || app.customerId !== customerId) notFound()
  }
  const store = getStore()
  const doc = {
    id: newId(),
    customerId,
    applicationId: data.applicationId || 'none',
    name: data.name,
    docType: data.docType,
    status: 'UPLOADED' as DocumentStatus,
    uploadedAt: now(),
    requestedAt: now(),
    fileName: data.fileName || 'uploaded_file.pdf'
  }
  store.documents.push(doc as any)
  logActivity('document', doc.id, doc.name, 'Document Uploaded', 'Customer')
  revalidatePath(`/portal/${customerId}/documents`)
  revalidatePath('/documents')
  if (data.applicationId) revalidatePath(`/applications/${data.applicationId}`)
  return doc
}
