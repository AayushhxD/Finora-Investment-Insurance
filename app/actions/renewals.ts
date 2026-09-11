'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity, addNotification } from '@/lib/store'
import type { RenewalStatus } from '@/lib/store-types'

export async function getRenewals() {
  const store = getStore()
  return store.renewals.map(r => {
    const customer = store.customers.find(c => c.id === r.customerId)
    const product = store.products.find(p => p.id === r.productId)
    const staff = customer ? store.staff.find(s => s.id === customer.assignedStaffId) : null
    const daysUntil = Math.ceil((new Date(r.renewalDate).getTime() - Date.now()) / 86400000)
    return { ...r, customerName: customer?.name ?? '—', productName: product?.name ?? '—', staffName: staff?.name ?? '—', daysUntil }
  })
}

export async function getRenewalById(id: string) {
  const store = getStore()
  const r = store.renewals.find(r => r.id === id)
  if (!r) return null
  const customer = store.customers.find(c => c.id === r.customerId)
  const product = store.products.find(p => p.id === r.productId)
  const staff = customer ? store.staff.find(s => s.id === customer.assignedStaffId) : null
  return { ...r, customer, product, staff }
}

export async function updateRenewalStatus(id: string, status: RenewalStatus, performedBy: string) {
  const store = getStore()
  const idx = store.renewals.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Renewal not found')
  store.renewals[idx].status = status
  if (status === 'REMINDER_SENT') store.renewals[idx].reminderSentAt = now()
  if (status === 'COMPLETED') {
    store.renewals[idx].completedAt = now()
    // Schedule next renewal in 1 year
    const nextDate = new Date(store.renewals[idx].renewalDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    store.renewals[idx].nextRenewalDate = nextDate.toISOString().split('T')[0]
  }
  const r = store.renewals[idx]
  const customer = store.customers.find(c => c.id === r.customerId)
  const product = store.products.find(p => p.id === r.productId)
  logActivity('renewal', id, `${product?.name ?? ''} - ${customer?.name ?? ''}`, `Renewal ${status}`, performedBy)
  revalidatePath('/renewals')
  return { ok: true }
}

export async function sendRenewalReminder(id: string, performedBy: string) {
  const store = getStore()
  const r = store.renewals.find(r => r.id === id)
  if (!r) throw new Error('Renewal not found')
  const customer = store.customers.find(c => c.id === r.customerId)
  const product = store.products.find(p => p.id === r.productId)
  await updateRenewalStatus(id, 'REMINDER_SENT', performedBy)
  addNotification('Renewal Reminder Sent', `Reminder sent to ${customer?.name} for ${product?.name}`, 'renewal', '/renewals')
  return { ok: true }
}

export async function getRenewalStats() {
  const store = getStore()
  const today = new Date()
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7)
  const in30 = new Date(today); in30.setDate(in30.getDate() + 30)
  return {
    today: store.renewals.filter(r => new Date(r.renewalDate).toDateString() === today.toDateString()).length,
    thisWeek: store.renewals.filter(r => { const d = new Date(r.renewalDate); return d >= today && d <= in7 }).length,
    thisMonth: store.renewals.filter(r => { const d = new Date(r.renewalDate); return d >= today && d <= in30 }).length,
    overdue: store.renewals.filter(r => new Date(r.renewalDate) < today && !['COMPLETED','NOT_RENEWED'].includes(r.status)).length,
  }
}
