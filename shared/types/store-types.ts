// ─── All TypeScript types for the in-memory store ─────────────────────────────

export type StaffRole = 'RM' | 'Manager' | 'Admin'
export type StaffStatus = 'active' | 'inactive'

export interface Staff {
  id: string
  profileId?: string
  employeeCode?: string
  name: string
  email: string
  phone: string
  role: StaffRole
  status: StaffStatus
  designation?: string
  department?: string | null
  specialty?: string
  maxCapacity?: number
  joinedAt: string
  createdAt: string
}

// ─── Customer ──────────────────────────────────────────────────────────────────
export type CustomerStatus = 'active' | 'inactive' | 'prospect'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  dob: string
  panNumber: string
  assignedStaffId: string
  status: CustomerStatus
  referralCode: string
  createdAt: string
}

// ─── Lead ──────────────────────────────────────────────────────────────────────
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST'
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'WALK_IN' | 'PHONE' | 'SOCIAL_MEDIA' | 'OTHER'

export type LeadPriority = 'HIGH' | 'MEDIUM' | 'NORMAL' | 'URGENT'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  productInterest: string
  source: LeadSource
  status: LeadStatus
  assignedStaffId?: string
  priority?: LeadPriority
  referredByCustomerId?: string
  notes: string
  convertedCustomerId?: string
  createdAt: string
  updatedAt: string
}

export type DistributionMethod = 'AUTO' | 'MANUAL'
export type DistributionStatus = 'ACCEPTED' | 'CONTACT_PENDING'

export interface LeadDistributionRecord {
  id: string
  leadId: string
  leadName: string
  productInterest: string
  assignedToId: string
  assignedToName: string
  method: DistributionMethod
  status: DistributionStatus
  assignedAt: string
}

// ─── Product ───────────────────────────────────────────────────────────────────
export type ProductCategory = 'Investment' | 'Insurance' | 'Demat'
export type ProductSubCategory =
  | 'LIC' | 'Mutual Fund' | 'Bond' | 'Other Investment'
  | 'Life Insurance' | 'Health Insurance' | 'Personal Accident' | 'General Insurance'
  | 'Demat Account' | 'Trading Account' | 'Equity' | 'IPO' | 'Other Market'
export type ProductStatus = 'active' | 'inactive'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  subCategory: ProductSubCategory
  description: string
  eligibility: string
  requiredDocs: string[]
  risk: 'Low' | 'Medium' | 'High'
  minInvestment: number
  returnPa?: number
  status: ProductStatus
  createdAt: string
}

// ─── Application ───────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'LEAD_CREATED'
  | 'STAFF_ASSIGNED'
  | 'PRODUCT_SELECTED'
  | 'CUSTOMER_INTERESTED'
  | 'DOCUMENTS_REQUESTED'
  | 'DOCUMENTS_RECEIVED'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'RENEWAL_SCHEDULED'
  | 'REJECTED'

export type PendingWith = 'Customer' | 'Staff' | 'Provider' | 'None'

export interface ApplicationStatusEntry {
  status: ApplicationStatus
  timestamp: string
  note: string
  performedBy: string
}

export interface Application {
  id: string
  customerId: string
  staffId: string
  productId: string
  status: ApplicationStatus
  pendingWith: PendingWith
  nextAction: string
  notes: string
  renewalDate?: string
  statusHistory: ApplicationStatusEntry[]
  createdAt: string
  updatedAt: string
}

// ─── Document ──────────────────────────────────────────────────────────────────
export type DocumentStatus = 'REQUESTED' | 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'

export interface Document {
  id: string
  applicationId: string
  customerId: string
  name: string
  docType: string
  status: DocumentStatus
  fileData?: string // base64
  fileName?: string
  rejectionReason?: string
  uploadedAt?: string
  reviewedAt?: string
  requestedAt: string
}

// ─── Message ───────────────────────────────────────────────────────────────────
export type MessageRole = 'staff' | 'customer'

export interface Message {
  id: string
  applicationId: string
  fromRole: MessageRole
  fromId: string
  fromName: string
  content: string
  createdAt: string
}

// ─── Renewal ───────────────────────────────────────────────────────────────────
export type RenewalStatus =
  | 'UPCOMING'
  | 'REMINDER_SENT'
  | 'CUSTOMER_CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'NOT_RENEWED'

export interface Renewal {
  id: string
  applicationId: string
  customerId: string
  productId: string
  renewalDate: string
  status: RenewalStatus
  reminderSentAt?: string
  completedAt?: string
  nextRenewalDate?: string
  createdAt: string
}

// ─── Referral ──────────────────────────────────────────────────────────────────
export type ReferralStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'SUCCESSFUL' | 'LOST'

export interface Referral {
  id: string
  referrerId: string // customer id
  referredLeadId: string // lead id
  referredName: string
  status: ReferralStatus
  rewardId?: string
  createdAt: string
}

// ─── Reward ────────────────────────────────────────────────────────────────────
export type RewardType = 'REFERRAL' | 'RENEWAL_BONUS' | 'LOYALTY'
export type RewardStatus = 'ELIGIBLE' | 'PENDING_PAYMENT' | 'PAID'

export interface Reward {
  id: string
  customerId: string
  referralId?: string
  amount: number
  type: RewardType
  status: RewardStatus
  description: string
  createdAt: string
}

// ─── Activity Log ──────────────────────────────────────────────────────────────
export type ActivityEntity = 'customer' | 'lead' | 'staff' | 'product' | 'application' | 'document' | 'renewal' | 'referral' | 'reward' | 'message'

export interface ActivityLog {
  id: string
  entity: ActivityEntity
  entityId: string
  entityLabel: string
  action: string
  performedBy: string
  metadata: Record<string, unknown>
  createdAt: string
}

// ─── Notification ──────────────────────────────────────────────────────────────
export type NotificationType = 'application' | 'document' | 'renewal' | 'referral' | 'reward' | 'message'

export interface Notification {
  id: string
  title: string
  body: string
  type: NotificationType
  linkTo: string
  read: boolean
  createdAt: string
}

// ─── Reward Rule ───────────────────────────────────────────────────────────────
export interface RewardRule {
  id: string
  type: RewardType
  amountPerReferral: number
  enabled: boolean
}
