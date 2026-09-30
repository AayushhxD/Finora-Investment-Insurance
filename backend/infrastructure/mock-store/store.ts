import type {
  Staff, Customer, Lead, Product, Application, Document, Message,
  Renewal, Referral, Reward, ActivityLog, Notification, RewardRule,
  LeadDistributionRecord,
  ApplicationStatus, PendingWith, ApplicationStatusEntry
} from '@shared/types/store-types'

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _idCounter = 1000
export function newId(): string { return `${++_idCounter}` }
export function now(): string { return new Date().toISOString() }
export function daysFromNow(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]
}
export function daysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString()
}

// ─── Singleton Store ───────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __store: AppStore | undefined
}

export interface AppStore {
  staff: Staff[]
  customers: Customer[]
  leads: Lead[]
  products: Product[]
  applications: Application[]
  documents: Document[]
  messages: Message[]
  renewals: Renewal[]
  referrals: Referral[]
  rewards: Reward[]
  activityLogs: ActivityLog[]
  notifications: Notification[]
  rewardRules: RewardRule[]
  distributionHistory: LeadDistributionRecord[]
}

function createStore(): AppStore {
  const { seedStaff, seedCustomers, seedLeads, seedProducts, seedApplications,
    seedDocuments, seedMessages, seedRenewals, seedReferrals, seedRewards,
    seedActivity, seedNotifications, seedRewardRules, seedDistributionHistory } = require('./mock-data')
  return {
    staff: seedStaff(),
    customers: seedCustomers(),
    leads: seedLeads(),
    products: seedProducts(),
    applications: seedApplications(),
    documents: seedDocuments(),
    messages: seedMessages(),
    renewals: seedRenewals(),
    referrals: seedReferrals(),
    rewards: seedRewards(),
    activityLogs: seedActivity(),
    notifications: seedNotifications(),
    rewardRules: seedRewardRules(),
    distributionHistory: seedDistributionHistory(),
  }
}

export function getStore(): AppStore {
  if (!global.__store) { global.__store = createStore() }
  return global.__store
}

// ─── Activity Logger ───────────────────────────────────────────────────────────
export function logActivity(
  entity: ActivityLog['entity'],
  entityId: string,
  entityLabel: string,
  action: string,
  performedBy: string,
  metadata: Record<string, unknown> = {}
) {
  const store = getStore()
  store.activityLogs.unshift({
    id: newId(), entity, entityId, entityLabel, action, performedBy, metadata, createdAt: now()
  })
}

// ─── Notification helper ───────────────────────────────────────────────────────
export function addNotification(
  title: string, body: string,
  type: Notification['type'], linkTo: string
) {
  const store = getStore()
  store.notifications.unshift({ id: newId(), title, body, type, linkTo, read: false, createdAt: now() })
}

// ─── Status config ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string; color: string; pendingWith: PendingWith; nextAction: string
}> = {
  LEAD_CREATED:          { label: 'Lead Created',          color: '#9aa4b9', pendingWith: 'Staff',    nextAction: 'Assign staff to this lead' },
  STAFF_ASSIGNED:        { label: 'Staff Assigned',        color: '#7251e8', pendingWith: 'Staff',    nextAction: 'Select product and contact customer' },
  PRODUCT_SELECTED:      { label: 'Product Selected',      color: '#4b9ef7', pendingWith: 'Staff',    nextAction: 'Present product to customer' },
  CUSTOMER_INTERESTED:   { label: 'Customer Interested',   color: '#f4b74c', pendingWith: 'Staff',    nextAction: 'Initiate document collection' },
  DOCUMENTS_REQUESTED:   { label: 'Documents Requested',   color: '#f4a04c', pendingWith: 'Customer', nextAction: 'Upload required documents' },
  DOCUMENTS_RECEIVED:    { label: 'Documents Received',    color: '#35b87d', pendingWith: 'Staff',    nextAction: 'Verify all documents' },
  SUBMITTED:             { label: 'Submitted',             color: '#35b87d', pendingWith: 'Provider', nextAction: 'Application submitted to provider' },
  PROCESSING:            { label: 'Processing',            color: '#4b9ef7', pendingWith: 'Provider', nextAction: 'Awaiting provider processing' },
  APPROVED:              { label: 'Approved',              color: '#35b87d', pendingWith: 'Staff',    nextAction: 'Mark as completed and schedule renewal' },
  COMPLETED:             { label: 'Completed',             color: '#21a362', pendingWith: 'None',     nextAction: 'Application complete — renewal scheduled' },
  RENEWAL_SCHEDULED:     { label: 'Renewal Scheduled',     color: '#21a362', pendingWith: 'None',     nextAction: 'Renewal date has been scheduled' },
  REJECTED:              { label: 'Rejected',              color: '#db6268', pendingWith: 'None',     nextAction: 'Application was rejected' },
}

export const APPLICATION_STATUS_FLOW: ApplicationStatus[] = [
  'LEAD_CREATED', 'STAFF_ASSIGNED', 'PRODUCT_SELECTED', 'CUSTOMER_INTERESTED',
  'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED', 'SUBMITTED', 'PROCESSING',
  'APPROVED', 'COMPLETED', 'RENEWAL_SCHEDULED'
]

export function getNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  const idx = APPLICATION_STATUS_FLOW.indexOf(current)
  if (idx === -1 || current === 'REJECTED') return []
  const next: ApplicationStatus[] = []
  if (idx < APPLICATION_STATUS_FLOW.length - 1) next.push(APPLICATION_STATUS_FLOW[idx + 1])
  if (current !== 'COMPLETED' && current !== 'RENEWAL_SCHEDULED') next.push('REJECTED')
  return next
}

export function advanceApplicationStatus(
  appId: string, newStatus: ApplicationStatus, performedBy: string, note?: string
) {
  const store = getStore()
  const app = store.applications.find(a => a.id === appId)
  if (!app) throw new Error('Application not found')
  const cfg = STATUS_CONFIG[newStatus]
  const entry: ApplicationStatusEntry = {
    status: newStatus, timestamp: now(),
    note: note ?? cfg.label, performedBy
  }
  app.status = newStatus
  app.pendingWith = cfg.pendingWith
  app.nextAction = cfg.nextAction
  app.updatedAt = now()
  app.statusHistory.push(entry)

  // Side effects
  if (newStatus === 'COMPLETED') {
    // Schedule renewal
    const renewalDate = daysFromNow(365)
    app.renewalDate = renewalDate
    const renewal: Renewal = {
      id: newId(), applicationId: appId, customerId: app.customerId,
      productId: app.productId, renewalDate, status: 'UPCOMING',
      createdAt: now()
    }
    store.renewals.push(renewal)
    advanceApplicationStatus(appId, 'RENEWAL_SCHEDULED', 'system', 'Renewal automatically scheduled')

    // Check for referrals linked to this customer's lead conversion
    store.referrals.forEach(ref => {
      if (ref.status === 'CONVERTED') {
        const lead = store.leads.find(l => l.id === ref.referredLeadId)
        if (lead?.convertedCustomerId === app.customerId) {
          ref.status = 'SUCCESSFUL'
          // Create reward
          const rule = store.rewardRules.find(r => r.type === 'REFERRAL' && r.enabled)
          const amount = rule?.amountPerReferral ?? 500
          const reward: Reward = {
            id: newId(), customerId: ref.referrerId, referralId: ref.id,
            amount, type: 'REFERRAL', status: 'ELIGIBLE',
            description: `Referral reward for ${lead?.name ?? 'customer'}`,
            createdAt: now()
          }
          store.rewards.push(reward)
          ref.rewardId = reward.id
          addNotification('Referral Reward!', `You earned ₹${amount} for a successful referral`, 'reward', '/portal/' + ref.referrerId + '/rewards')
        }
      }
    })
  }
  logActivity('application', appId, `APP-${appId}`, `Status → ${STATUS_CONFIG[newStatus].label}`, performedBy)
}
