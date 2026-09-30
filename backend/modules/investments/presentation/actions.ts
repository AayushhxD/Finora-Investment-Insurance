'use server'

import { auth } from '@backend/infrastructure/auth/server'
import { db } from '@backend/infrastructure/database/client'
import { auditLogs, investmentProducts, userInvestments } from '@backend/infrastructure/database/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getUserId() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error('Unauthorized'); return session.user.id }
export async function addInvestment(productId: number, amount: number) {
  const userId = await getUserId()
  const parsed = z.object({ productId: z.number().int().positive(), amount: z.number().positive().max(100000000) }).parse({ productId, amount })

  if (!process.env.DATABASE_URL) {
    throw new Error('Database not configured — cannot add investment in development in-memory mode')
  }

  const [product] = await db.select().from(investmentProducts).where(eq(investmentProducts.id, parsed.productId)).limit(1)
  if (!product) throw new Error('Product unavailable')
  await db.insert(userInvestments).values({ userId, productId: parsed.productId, amount: parsed.amount.toFixed(2), units: '0' })
  await db.insert(auditLogs).values({ userId, action: 'create', entity: 'investment', entityId: String(parsed.productId), metadata: { amount: parsed.amount } })
  revalidatePath('/')
  return { ok: true }
}
export async function getDashboardData() {
  const userId = await getUserId()

  // If no DATABASE_URL is configured (dev mode without Postgres), return empty lists
  if (!process.env.DATABASE_URL) {
    return { products: [], investments: [] }
  }

  try {
    const [products, investments] = await Promise.all([
      db.select().from(investmentProducts).orderBy(desc(investmentProducts.returnPa)),
      db.select().from(userInvestments).where(eq(userInvestments.userId, userId)).orderBy(desc(userInvestments.createdAt)),
    ])
    return { products, investments }
  } catch (err) {
    console.error('DB query failed in getDashboardData:', err)
    return { products: [], investments: [] }
  }
}
