'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { Lead, LeadStatus, LeadSource } from '@/lib/store-types'
import { z } from 'zod'

const LeadSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  productInterest: z.string().min(2, 'Product interest required'),
  source: z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']),
  assignedStaffId: z.string().optional(),
  referredByCustomerId: z.string().optional(),
  notes: z.string().default(''),
})

export async function getLeads() { return getStore().leads }
export async function getLeadById(id: string) { return getStore().leads.find(l => l.id === id) ?? null }

export async function createLead(data: unknown, referralCode?: string) {
  const parsed = LeadSchema.parse(data)
  const store = getStore()
  // Link referral if referralCode provided
  let referredByCustomerId = parsed.referredByCustomerId
  if (referralCode && !referredByCustomerId) {
    const referrer = store.customers.find(c => c.referralCode === referralCode)
    if (referrer) referredByCustomerId = referrer.id
  }
  const lead: Lead = {
    id: newId(),
    ...parsed,
    assignedStaffId: parsed.assignedStaffId || undefined,
    referredByCustomerId,
    status: 'NEW',
    createdAt: now(),
    updatedAt: now(),
  }
  store.leads.push(lead)
  // If came via referral, create referral record
  if (referredByCustomerId) {
    const { id: refId } = { id: newId() }
    store.referrals.push({
      id: refId, referrerId: referredByCustomerId, referredLeadId: lead.id,
      referredName: lead.name, status: 'PENDING', createdAt: now()
    })
  }
  logActivity('lead', lead.id, lead.name, 'Lead Created', 'Staff')
  revalidatePath('/leads')
  return { ok: true, id: lead.id }
}

export async function updateLeadStatus(id: string, status: LeadStatus, note?: string) {
  const store = getStore()
  const idx = store.leads.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Lead not found')
  store.leads[idx].status = status
  store.leads[idx].updatedAt = now()
  // Update referral status if exists
  if (status === 'CONTACTED') {
    store.referrals.filter(r => r.referredLeadId === id).forEach(r => { r.status = 'CONTACTED' })
  }
  if (status === 'CONVERTED') {
    store.referrals.filter(r => r.referredLeadId === id).forEach(r => { r.status = 'CONVERTED' })
  }
  if (status === 'LOST') {
    store.referrals.filter(r => r.referredLeadId === id).forEach(r => { r.status = 'LOST' })
  }
  logActivity('lead', id, store.leads[idx].name, `Status → ${status}`, 'Staff')
  revalidatePath('/leads')
  return { ok: true }
}

export async function convertLeadToCustomer(leadId: string, staffId: string) {
  const store = getStore()
  const lead = store.leads.find(l => l.id === leadId)
  if (!lead) throw new Error('Lead not found')
  if (lead.status === 'CONVERTED') throw new Error('Lead already converted')
  // Create customer
  const referralCode = lead.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4)
  const customer = {
    id: newId(), name: lead.name, email: lead.email, phone: lead.phone,
    address: '', city: '', dob: '', panNumber: '', assignedStaffId: staffId,
    status: 'active' as const, referralCode, createdAt: now()
  }
  store.customers.push(customer)
  lead.status = 'CONVERTED'
  lead.convertedCustomerId = customer.id
  lead.updatedAt = now()
  // Update referrals
  store.referrals.filter(r => r.referredLeadId === leadId).forEach(r => { r.status = 'CONVERTED' })
  logActivity('lead', leadId, lead.name, 'Converted to Customer', 'Staff')
  logActivity('customer', customer.id, customer.name, 'Customer Created from Lead', 'Staff')
  revalidatePath('/leads')
  revalidatePath('/customers')
  return { ok: true, customerId: customer.id }
}

export async function updateLead(id: string, data: unknown) {
  const parsed = LeadSchema.partial().parse(data)
  const store = getStore()
  const idx = store.leads.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Lead not found')
  store.leads[idx] = { ...store.leads[idx], ...parsed, updatedAt: now() }
  logActivity('lead', id, store.leads[idx].name, 'Lead Updated', 'Staff')
  revalidatePath('/leads')
  return { ok: true }
}

export async function assignLeadStaff(leadId: string, staffId: string) {
  const store = getStore()
  const idx = store.leads.findIndex(l => l.id === leadId)
  if (idx === -1) throw new Error('Lead not found')
  store.leads[idx].assignedStaffId = staffId
  store.leads[idx].updatedAt = now()
  const staff = store.staff.find(s => s.id === staffId)
  logActivity('lead', leadId, store.leads[idx].name, `Assigned to ${staff?.name ?? staffId}`, 'Admin')
  revalidatePath('/leads')
  return { ok: true }
}
