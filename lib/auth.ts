import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const origin = (value?: string) => value ? [value] : []
export const auth = betterAuth({
  // Use the Postgres pool only when a DATABASE_URL is configured.
  // When unset, the adapter falls back to an in-memory implementation useful for local dev.
  database: process.env.DATABASE_URL ? pool : undefined,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', ...origin(process.env.V0_RUNTIME_URL), ...origin(process.env.V0_DEV_APP_URL), ...origin(process.env.V0_BUILD_URL), ...origin(process.env.V0_SANDBOX_URL)] : []),
    ...(process.env.NODE_ENV === 'production' ? [...origin(process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`), ...origin(process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)] : []),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
