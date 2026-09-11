'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity, addNotification } from '@/lib/store'
import type { DocumentStatus } from '@/lib/store-types'

export async function getDocuments() {
  const store = getStore()
  return store.documents.map(doc => {
    const customer = store.customers.find(c => c.id === doc.customerId)
    const app = store.applications.find(a => a.id === doc.applicationId)
    const product = app ? store.products.find(p => p.id === app.productId) : null
    return { ...doc, customerName: customer?.name ?? '—', productName: product?.name ?? '—' }
  })
}

export async function getDocumentsByApplication(applicationId: string) {
  return getStore().documents.filter(d => d.applicationId === applicationId)
}

export async function uploadDocument(docId: string, fileName: string, fileData: string) {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === docId)
  if (idx === -1) throw new Error('Document not found')
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
      const { advanceApplicationStatus } = require('@/lib/store')
      advanceApplicationStatus(doc.applicationId, 'DOCUMENTS_RECEIVED', 'system', 'All documents received')
    }
  }
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  revalidatePath(`/portal/${doc.customerId}/documents`)
  return { ok: true }
}

export async function verifyDocument(docId: string, performedBy: string) {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === docId)
  if (idx === -1) throw new Error('Document not found')
  store.documents[idx].status = 'VERIFIED'
  store.documents[idx].reviewedAt = now()
  const doc = store.documents[idx]
  logActivity('document', docId, doc.name, 'Document Verified', performedBy)
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function rejectDocument(docId: string, reason: string, performedBy: string) {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === docId)
  if (idx === -1) throw new Error('Document not found')
  store.documents[idx].status = 'REJECTED'
  store.documents[idx].rejectionReason = reason
  store.documents[idx].reviewedAt = now()
  const doc = store.documents[idx]
  logActivity('document', docId, doc.name, `Document Rejected: ${reason}`, performedBy)
  addNotification('Document Rejected', `${doc.name} was rejected: ${reason}`, 'document', `/portal/${doc.customerId}/documents`)
  revalidatePath(`/applications/${doc.applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function requestMoreDocuments(applicationId: string, docTypes: string[], performedBy: string) {
  const store = getStore()
  const app = store.applications.find(a => a.id === applicationId)
  if (!app) throw new Error('Application not found')
  docTypes.forEach(dt => {
    store.documents.push({
      id: newId(), applicationId, customerId: app.customerId,
      name: dt, docType: dt, status: 'REQUESTED', requestedAt: now()
    })
  })
  logActivity('document', applicationId, `APP-${applicationId}`, `Additional documents requested: ${docTypes.join(', ')}`, performedBy)
  revalidatePath(`/applications/${applicationId}`)
  revalidatePath('/documents')
  return { ok: true }
}

export async function createDocument(customerId: string, data: any) {
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
