'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { Customer, CustomerStatus } from '@/lib/store-types'
import { z } from 'zod'

const CustomerSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be 10 digits'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  dob: z.string().min(1, 'Date of birth required'),
  panNumber: z.string().min(10, 'PAN must be 10 characters').max(10),
  assignedStaffId: z.string().min(1, 'Assign a staff member'),
  status: z.enum(['active', 'inactive', 'prospect']),
})

export async function getCustomers() { return getStore().customers }
export async function getCustomerById(id: string) { return getStore().customers.find(c => c.id === id) ?? null }

export async function createCustomer(data: unknown) {
  const parsed = CustomerSchema.parse(data)
  const referralCode = parsed.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4)
  const customer: Customer = { id: newId(), ...parsed, referralCode, createdAt: now() }
  getStore().customers.push(customer)
  logActivity('customer', customer.id, customer.name, 'Customer Created', 'Staff')
  revalidatePath('/customers')
  return { ok: true, id: customer.id }
}

export async function updateCustomer(id: string, data: unknown) {
  const parsed = CustomerSchema.partial().parse(data)
  const store = getStore()
  const idx = store.customers.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Customer not found')
  store.customers[idx] = { ...store.customers[idx], ...parsed }
  logActivity('customer', id, store.customers[idx].name, 'Customer Updated', 'Staff')
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  return { ok: true }
}

export async function deleteCustomer(id: string) {
  const store = getStore()
  const idx = store.customers.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Customer not found')
  const name = store.customers[idx].name
  store.customers.splice(idx, 1)
  logActivity('customer', id, name, 'Customer Deleted', 'Admin')
  revalidatePath('/customers')
  return { ok: true }
}

export async function getCustomerFullProfile(id: string) {
  const store = getStore()
  const customer = store.customers.find(c => c.id === id)
  if (!customer) return null
  const staff = store.staff.find(s => s.id === customer.assignedStaffId)
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
  const store = getStore()
  const idx = store.customers.findIndex(c => c.id === customerId)
  if (idx === -1) throw new Error('Customer not found')
  const oldStaffId = store.customers[idx].assignedStaffId
  store.customers[idx].assignedStaffId = newStaffId
  const newStaff = store.staff.find(s => s.id === newStaffId)
  logActivity('customer', customerId, store.customers[idx].name, `Reassigned to ${newStaff?.name ?? newStaffId}`, 'Admin')
  revalidatePath(`/customers/${customerId}`)
  return { ok: true }
}
