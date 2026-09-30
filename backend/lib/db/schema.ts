import { boolean, check, date, index, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { CustomerStatus, StaffRole } from '@shared/types/store-types'

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull().default(false),
	image: text('image'),
	role: text('role').$type<StaffRole>().notNull().default('RM'),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, table => [
	check('user_role_check', sql`${table.role} in ('RM', 'Manager', 'Admin')`),
	index('user_role_idx').on(table.role),
])
export const session = pgTable('session', { id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull() })
export const account = pgTable('account', { id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() })
export const verification = pgTable('verification', { id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow() })
export const investmentProducts = pgTable('investment_products', { id: serial('id').primaryKey(), name: text('name').notNull(), category: text('category').notNull(), fundSize: numeric('fundSize').notNull(), returnPa: numeric('returnPa').notNull(), risk: text('risk').notNull(), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const userInvestments = pgTable('user_investments', { id: serial('id').primaryKey(), userId: text('userId').notNull(), productId: integer('productId').notNull(), amount: numeric('amount').notNull(), units: numeric('units').notNull().default('0'), status: text('status').notNull().default('active'), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const insurancePolicies = pgTable('insurance_policies', { id: serial('id').primaryKey(), userId: text('userId').notNull(), policyNumber: text('policyNumber').notNull(), provider: text('provider').notNull(), type: text('type').notNull(), coverage: numeric('coverage').notNull(), premium: numeric('premium').notNull(), renewalDate: date('renewalDate').notNull(), status: text('status').notNull().default('active'), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const auditLogs = pgTable('audit_logs', { id: serial('id').primaryKey(), userId: text('userId').notNull(), action: text('action').notNull(), entity: text('entity').notNull(), entityId: text('entityId'), metadata: jsonb('metadata').notNull().default({}), createdAt: timestamp('createdAt').notNull().defaultNow() })
export const customers = pgTable('customers', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone').notNull(),
	address: text('address').notNull(),
	city: text('city').notNull(),
	dob: date('dob').notNull(),
	panNumber: text('pan_number').notNull(),
	createdById: text('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
	assignedStaffId: text('assigned_staff_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
	status: text('status').$type<CustomerStatus>().notNull().default('active'),
	referralCode: text('referral_code').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
	check('customers_status_check', sql`${table.status} in ('active', 'inactive', 'prospect')`),
	uniqueIndex('customers_email_key').on(table.email),
	uniqueIndex('customers_pan_number_key').on(table.panNumber),
	uniqueIndex('customers_referral_code_key').on(table.referralCode),
	index('customers_created_by_id_idx').on(table.createdById),
	index('customers_assigned_staff_id_idx').on(table.assignedStaffId),
])

export type InvestmentProduct = typeof investmentProducts.$inferSelect
export type InsurancePolicy = typeof insurancePolicies.$inferSelect
export type UserInvestment = typeof userInvestments.$inferSelect
export type CustomerRecord = typeof customers.$inferSelect
