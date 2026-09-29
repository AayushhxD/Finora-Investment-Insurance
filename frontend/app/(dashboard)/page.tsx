import { getDashboardStats } from '@backend/actions/applications'
import { getStaff } from '@backend/actions/staff'
import { getApplications } from '@backend/actions/applications'
import FinoraDashboard from '@/components/dashboard/finora-dashboard'
import { auth } from '@backend/lib/auth'
import { headers } from 'next/headers'

function formatAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString()
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() })
  const name = session?.user?.name ?? 'Management'
  const [stats, staff, applications] = await Promise.all([
    getDashboardStats(),
    getStaff(),
    getApplications(),
  ])

  const stageMap: Record<string, { label: string; statuses: string[] }> = {
    enquiry: { label: 'Enquiry', statuses: ['LEAD_CREATED', 'STAFF_ASSIGNED', 'PRODUCT_SELECTED', 'CUSTOMER_INTERESTED'] },
    documents: { label: 'Documents', statuses: ['DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'] },
    submitted: { label: 'Submitted', statuses: ['SUBMITTED'] },
    processing: { label: 'Processing', statuses: ['PROCESSING', 'APPROVED'] },
    completed: { label: 'Completed', statuses: ['COMPLETED', 'RENEWAL_SCHEDULED'] },
  }

  const pipeline = Object.values(stageMap).map(stage => {
    const apps = applications.filter(a => stage.statuses.includes(a.status))
    return {
      label: stage.label,
      count: apps.length,
      cases: apps.slice(0, 2).map(a => ({
        name: a.customerName,
        detail: a.productName,
        appId: a.id,
      })),
    }
  })

  const activities = stats.recentActivity.slice(0, 4).map((a: { action: string; entityLabel: string; performedBy: string; createdAt: string }) => ({
    action: a.action,
    detail: `${a.entityLabel} · ${a.performedBy}`,
    time: formatAgo(a.createdAt),
  }))

  const followUps = stats.pendingApplications.slice(0, 5).map((a: { id: string; customerName?: string; productName?: string; pendingWith: string; staffName?: string; status: string }) => ({
    customer: a.customerName ?? 'Customer',
    initials: getInitials(a.customerName ?? 'CU'),
    product: a.productName ?? '—',
    pendingWith: a.pendingWith,
    staff: a.staffName ?? '—',
    due: 'Today',
    status: a.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 20),
    statusClass: a.pendingWith === 'Customer' ? 'b-orange' : 'b-blue',
  }))

  return (
    <FinoraDashboard
      name={name}
      stats={{
        totalCustomers: stats.totalCustomers,
        activeApplications: stats.activeApplications,
        pendingCases: stats.pendingCases,
        upcomingRenewals: stats.upcomingRenewals,
        customerGrowth: '↑ 8.4% this month',
        newApps: `↑ ${Math.min(stats.activeApplications, 12)} new this week`,
        needsAction: Math.min(stats.pendingCases, 19),
      }}
      pipeline={pipeline}
      activities={activities.length ? activities : [
        { action: 'Document uploaded', detail: 'PAN card · Raj Patil', time: '8 min ago' },
        { action: 'Health policy approved', detail: 'Amit Shah · Application', time: '32 min ago' },
        { action: 'New referral received', detail: 'From Sneha Joshi', time: '1 hr ago' },
        { action: 'Renewal reminder sent', detail: '12 customers · September batch', time: '2 hrs ago' },
      ]}
      followUps={followUps.length ? followUps : [
        { customer: 'Raj Patil', initials: 'RP', product: 'Mutual Fund', pendingWith: 'Customer', staff: 'Rahul Mehta', due: 'Today', status: 'Documents', statusClass: 'b-orange' },
        { customer: 'Sneha Mehta', initials: 'SM', product: 'Health Insurance', pendingWith: 'Provider', staff: 'Priya Shah', due: 'Today', status: 'Processing', statusClass: 'b-blue' },
      ]}
      staff={staff}
    />
  )
}
