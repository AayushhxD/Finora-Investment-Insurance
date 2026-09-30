'use server'
import { getStore } from '@backend/infrastructure/mock-store/store'

export async function getActivityLogs(entityFilter?: string, limit = 50) {
  const logs = getStore().activityLogs
  const filtered = entityFilter ? logs.filter(l => l.entity === entityFilter) : logs
  return filtered.slice(0, limit)
}

export async function getNotifications() {
  return getStore().notifications
}

export async function markNotificationRead(id: string) {
  const n = getStore().notifications.find(n => n.id === id)
  if (n) n.read = true
  return { ok: true }
}

export async function markAllNotificationsRead() {
  getStore().notifications.forEach(n => { n.read = true })
  return { ok: true }
}

export async function getReports() {
  const store = getStore()
  // Customer report
  const customerReport = store.staff.map(s => ({
    staffName: s.name, role: s.role,
    customers: store.customers.filter(c => c.assignedStaffId === s.id).length,
    activeCustomers: store.customers.filter(c => c.assignedStaffId === s.id && c.status === 'active').length,
  }))

  // Staff report
  const staffReport = store.staff.map(s => {
    const apps = store.applications.filter(a => a.staffId === s.id)
    const customers = store.customers.filter(c => c.assignedStaffId === s.id)
    const renewals = store.renewals.filter(r => customers.some(c => c.id === r.customerId))
    const referrals = store.referrals.filter(r => customers.some(c => c.id === r.referrerId))
    return {
      staffId: s.id, staffName: s.name, role: s.role,
      totalApplications: apps.length,
      activeApplications: apps.filter(a => !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).length,
      completedApplications: apps.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
      pendingApplications: apps.filter(a => a.pendingWith === 'Staff').length,
      upcomingRenewals: renewals.filter(r => r.status === 'UPCOMING' || r.status === 'REMINDER_SENT').length,
      referrals: referrals.length,
      customers: customers.length,
    }
  })

  // Product report
  const productReport = store.products.map(p => {
    const apps = store.applications.filter(a => a.productId === p.id)
    return {
      productId: p.id, name: p.name, category: p.category,
      enquiries: apps.length,
      active: apps.filter(a => !['COMPLETED','REJECTED','RENEWAL_SCHEDULED'].includes(a.status)).length,
      completed: apps.filter(a => a.status === 'COMPLETED' || a.status === 'RENEWAL_SCHEDULED').length,
      rejected: apps.filter(a => a.status === 'REJECTED').length,
    }
  })

  // Renewal report
  const renewalReport = {
    upcoming: store.renewals.filter(r => r.status === 'UPCOMING').length,
    contacted: store.renewals.filter(r => r.status === 'CUSTOMER_CONTACTED' || r.status === 'REMINDER_SENT').length,
    completed: store.renewals.filter(r => r.status === 'COMPLETED').length,
    overdue: store.renewals.filter(r => new Date(r.renewalDate) < new Date() && !['COMPLETED','NOT_RENEWED'].includes(r.status)).length,
    notRenewed: store.renewals.filter(r => r.status === 'NOT_RENEWED').length,
  }

  // Referral report
  const referralReport = {
    total: store.referrals.length,
    contacted: store.referrals.filter(r => ['CONTACTED','CONVERTED','SUCCESSFUL'].includes(r.status)).length,
    converted: store.referrals.filter(r => ['CONVERTED','SUCCESSFUL'].includes(r.status)).length,
    successful: store.referrals.filter(r => r.status === 'SUCCESSFUL').length,
    totalRewards: store.rewards.reduce((s, r) => s + r.amount, 0),
    byCustomer: store.customers.map(c => ({
      customerId: c.id, name: c.name,
      referrals: store.referrals.filter(r => r.referrerId === c.id).length,
      successful: store.referrals.filter(r => r.referrerId === c.id && r.status === 'SUCCESSFUL').length,
      earned: store.rewards.filter(r => r.customerId === c.id).reduce((s, r) => s + r.amount, 0),
    })).filter(c => c.referrals > 0)
  }

  return { customerReport, staffReport, productReport, renewalReport, referralReport }
}
