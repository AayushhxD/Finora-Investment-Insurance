'use server'
import { revalidatePath } from 'next/cache'
import { getStore, newId, now, logActivity } from '@/lib/store'
import type { DistributionMethod, LeadPriority } from '@/lib/store-types'

function getStaffLoad(staffId: string) {
  const store = getStore()
  return store.applications.filter(
    a => a.staffId === staffId && !['COMPLETED', 'REJECTED', 'RENEWAL_SCHEDULED'].includes(a.status)
  ).length + store.leads.filter(l => l.assignedStaffId === staffId && l.status !== 'CONVERTED' && l.status !== 'LOST').length
}

function pickBestStaff(productInterest: string) {
  const store = getStore()
  const active = store.staff.filter(s => s.status === 'active' && s.role === 'RM')
  const interest = productInterest.toLowerCase()

  const scored = active.map(s => {
    let score = 0
    const load = getStaffLoad(s.id)
    const cap = s.maxCapacity ?? 35
    const specialty = (s.specialty ?? '').toLowerCase()

    if (interest.includes('mutual') || interest.includes('bond') || interest.includes('investment')) {
      if (specialty.includes('mutual') || specialty.includes('fund')) score += 30
    }
    if (interest.includes('insurance') || interest.includes('lic') || interest.includes('health') || interest.includes('life')) {
      if (specialty.includes('insurance')) score += 30
    }
    if (interest.includes('demat') || interest.includes('market') || interest.includes('trading')) {
      if (specialty.includes('demat') || specialty.includes('market')) score += 30
    }

    const capacityRatio = load / cap
    score += Math.max(0, 40 - capacityRatio * 40)
    return { staff: s, load, cap, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.staff ?? active[0]
}

export async function getLeadDistributionData() {
  const store = getStore()
  const unassigned = store.leads.filter(l => !l.assignedStaffId && !['CONVERTED', 'LOST'].includes(l.status))
  const activeStaff = store.staff.filter(s => s.status === 'active')
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const distributedToday = store.distributionHistory.filter(
    d => new Date(d.assignedAt) >= todayStart
  ).length

  const workload = activeStaff.map(s => {
    const load = getStaffLoad(s.id)
    const cap = s.maxCapacity ?? 35
    const pct = Math.round((load / cap) * 100)
    let availability = 'Available'
    if (pct >= 85) availability = 'Near capacity'
    else if (pct <= 40) availability = 'High availability'
    return {
      id: s.id,
      name: s.name,
      load,
      cap,
      pct,
      specialty: s.specialty ?? 'General',
      availability,
    }
  })

  return {
    unassignedCount: unassigned.length,
    distributedToday,
    autoDistributionRate: 82,
    availableStaff: activeStaff.filter(s => s.role === 'RM').length,
    totalStaff: activeStaff.filter(s => s.role === 'RM').length + store.staff.filter(s => s.status === 'inactive').length,
    unassignedLeads: unassigned.map(l => ({
      ...l,
      receivedAgo: formatAgo(l.createdAt),
      priority: l.priority ?? 'NORMAL',
    })),
    workload,
    history: store.distributionHistory.slice().reverse(),
  }
}

function formatAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`
}

export async function distributeLead(data: {
  leadId: string
  staffId?: string
  mode: 'AUTO' | 'MANUAL'
  priority?: LeadPriority
  note?: string
}) {
  const store = getStore()
  const idx = store.leads.findIndex(l => l.id === data.leadId)
  if (idx === -1) throw new Error('Lead not found')

  const lead = store.leads[idx]
  const method: DistributionMethod = data.mode === 'AUTO' ? 'AUTO' : 'MANUAL'
  const staff = data.mode === 'AUTO'
    ? pickBestStaff(lead.productInterest)
    : store.staff.find(s => s.id === data.staffId)

  if (!staff) throw new Error('No available staff found')

  store.leads[idx] = {
    ...lead,
    assignedStaffId: staff.id,
    priority: data.priority ?? lead.priority,
    status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
    updatedAt: now(),
  }

  store.distributionHistory.unshift({
    id: newId(),
    leadId: lead.id,
    leadName: lead.name,
    productInterest: lead.productInterest,
    assignedToId: staff.id,
    assignedToName: staff.name,
    method,
    status: 'ACCEPTED',
    assignedAt: now(),
  })

  logActivity('lead', lead.id, lead.name, `Distributed to ${staff.name} (${method})`, 'Admin', { note: data.note })

  revalidatePath('/lead-distribution')
  revalidatePath('/leads')
  revalidatePath('/')
  return { ok: true, staffName: staff.name }
}

export async function distributeAllUnassigned() {
  const store = getStore()
  const unassigned = store.leads.filter(l => !l.assignedStaffId && !['CONVERTED', 'LOST'].includes(l.status))
  let count = 0
  for (const lead of unassigned) {
    await distributeLead({ leadId: lead.id, mode: 'AUTO' })
    count++
  }
  return { ok: true, count }
}
