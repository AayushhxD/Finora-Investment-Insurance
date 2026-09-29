'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@backend/lib/store'

export async function getReferrals() {
  const store = getStore()
  return store.referrals.map(r => {
    const referrer = store.customers.find(c => c.id === r.referrerId)
    const lead = store.leads.find(l => l.id === r.referredLeadId)
    const reward = r.rewardId ? store.rewards.find(rw => rw.id === r.rewardId) : null
    return { ...r, referrerName: referrer?.name ?? '—', leadStatus: lead?.status ?? '—', rewardAmount: reward?.amount }
  })
}

export async function getCustomerReferrals(customerId: string) {
  const store = getStore()
  const customer = store.customers.find(c => c.id === customerId)
  if (!customer) return null
  const referrals = store.referrals.filter(r => r.referrerId === customerId).map(r => {
    const lead = store.leads.find(l => l.id === r.referredLeadId)
    const reward = r.rewardId ? store.rewards.find(rw => rw.id === r.rewardId) : null
    return { ...r, leadName: lead?.name ?? r.referredName, leadStatus: lead?.status ?? '—', rewardAmount: reward?.amount }
  })
  const stats = {
    total: referrals.length,
    contacted: referrals.filter(r => ['CONTACTED','CONVERTED','SUCCESSFUL'].includes(r.status)).length,
    converted: referrals.filter(r => ['CONVERTED','SUCCESSFUL'].includes(r.status)).length,
    successful: referrals.filter(r => r.status === 'SUCCESSFUL').length,
    totalEarned: referrals.filter(r => r.status === 'SUCCESSFUL' && r.rewardAmount).reduce((s, r) => s + (r.rewardAmount ?? 0), 0)
  }
  return { referrals, stats, referralCode: customer.referralCode, referralLink: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/?ref=${customer.referralCode}` }
}

export async function generateReferralLink(customerId: string) {
  const store = getStore()
  const customer = store.customers.find(c => c.id === customerId)
  if (!customer) throw new Error('Customer not found')
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/?ref=${customer.referralCode}`
}

export async function createManualReferral(referrerId: string, leadId: string) {
  const store = getStore()
  const existing = store.referrals.find(r => r.referrerId === referrerId && r.referredLeadId === leadId)
  if (existing) throw new Error('Referral already exists')
  const lead = store.leads.find(l => l.id === leadId)
  if (!lead) throw new Error('Lead not found')
  const referral = { id: newId(), referrerId, referredLeadId: leadId, referredName: lead.name, status: 'PENDING' as const, createdAt: now() }
  store.referrals.push(referral)
  lead.referredByCustomerId = referrerId
  logActivity('referral', referral.id, `Referral: ${lead.name}`, 'Manual Referral Created', 'Staff')
  revalidatePath('/referrals')
  return { ok: true }
}
