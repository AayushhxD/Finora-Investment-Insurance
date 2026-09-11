'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { Message } from '@/lib/store-types'

export async function sendMessage(applicationId: string, fromRole: 'staff' | 'customer', fromId: string, fromName: string, content: string) {
  if (!content.trim()) throw new Error('Message cannot be empty')
  const store = getStore()
  const app = store.applications.find(a => a.id === applicationId)
  if (!app) throw new Error('Application not found')
  const msg: Message = {
    id: newId(), applicationId, fromRole, fromId, fromName, content: content.trim(), createdAt: now()
  }
  store.messages.push(msg)
  logActivity('message', applicationId, `MSG in APP-${applicationId}`, `Message from ${fromName}`, fromName)
  revalidatePath(`/applications/${applicationId}`)
  revalidatePath(`/portal/${app.customerId}/messages`)
  revalidatePath('/messages')
  return { ok: true, message: msg }
}

export async function getMessagesByApplication(applicationId: string) {
  return getStore().messages.filter(m => m.applicationId === applicationId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export async function getCustomerMessages(customerId: string) {
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
  const store = getStore()
  return store.messages.map(m => {
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
  const store = getStore()
  const app = store.applications.find(a => a.customerId === customerId)
  if (!app) throw new Error('No active application found for this customer')
  return sendMessage(app.id, 'staff', fromId, fromName, content)
}
