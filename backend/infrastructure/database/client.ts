import { drizzle } from 'drizzle-orm/node-postgres'
import { loadEnvConfig } from '@next/env'
import { Pool } from 'pg'
import * as schema from './schema'

loadEnvConfig(process.cwd())

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
	throw new Error('DATABASE_URL is required. Configure it in the repository root .env.local file.')
}

export const pool = new Pool({
	connectionString: databaseUrl,
	max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
	ssl: databaseUrl.includes('supabase') || process.env.DATABASE_SSL === 'true'
		? { rejectUnauthorized: false }
		: undefined,
})

export const db = drizzle(pool, { schema })
