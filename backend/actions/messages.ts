'use server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getStore, newId, now, logActivity } from '@backend/lib/store'
import { getVisibleCustomers, requireCustomerAccess, requireCustomerActor } from '@backend/lib/customer-access'
import type { Message } from '@shared/types/store-types'

export async function sendMessage(applicationId: string, _fromRole: 'staff' | 'customer', _fromId: string, _fromName: string, content: string) {
  if (!content.trim()) throw new Error('Message cannot be empty')
  const actor = await requireCustomerActor()
  const store = getStore()
  const app = store.applications.find(a => a.id === applicationId)
  if (!app) notFound()
  await requireCustomerAccess(app.customerId, actor)
  const msg: Message = {
    id: newId(), applicationId, fromRole: 'staff', fromId: actor.id, fromName: actor.name, content: content.trim(), createdAt: now()
  }
  store.messages.push(msg)
  logActivity('message', applicationId, `MSG in APP-${applicationId}`, `Message from ${actor.name}`, actor.name)
  revalidatePath(`/applications/${applicationId}`)
  revalidatePath(`/portal/${app.customerId}/messages`)
  revalidatePath('/messages')
  return { ok: true, message: msg }
}

export async function getMessagesByApplication(applicationId: string) {
  const store = getStore()
  const app = store.applications.find(application => application.id === applicationId)
  if (!app) notFound()
  await requireCustomerAccess(app.customerId)
  return store.messages.filter(m => m.applicationId === applicationId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export async function getCustomerMessages(customerId: string) {
  await requireCustomerAccess(customerId)
  const store = getStore()
  const apps = store.applications.filter(a => a.customerId === customerId)
  const messages = store.messages.filter(m => apps.some(a => a.id === m.applicationId))
  return messages.map(m => {
    const app = apps.find(a => a.id === m.applicationId)
    const product = app ? store.products.find(p => p.id === app.productId) : null
    return { ...m, productName: product?.name ?? '—' }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAllMessages() {
  const actor = await requireCustomerActor()
  const visibleCustomerIds = new Set((await getVisibleCustomers(actor)).map(customer => customer.id))
  const store = getStore()
  return store.messages.filter(message => {
    const app = store.applications.find(application => application.id === message.applicationId)
    return app && visibleCustomerIds.has(app.customerId)
  }).map(m => {
    const app = store.applications.find(a => a.id === m.applicationId)
    const customer = app ? store.customers.find(c => c.id === app.customerId) : null
    const product = app ? store.products.find(p => p.id === app.productId) : null
    return {
      ...m,
      customerName: customer?.name ?? 'Unknown',
      customerId: customer?.id,
      productName: product?.name ?? '—',
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function sendMessageToCustomer(customerId: string, content: string, fromName: string, fromId: string) {
  await requireCustomerAccess(customerId)
  const store = getStore()
  const app = store.applications.find(a => a.customerId === customerId)
  if (!app) notFound()
  return sendMessage(app.id, 'staff', fromId, fromName, content)
}
