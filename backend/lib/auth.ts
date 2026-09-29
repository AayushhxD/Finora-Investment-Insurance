import { betterAuth } from 'better-auth'
import { pool } from '@backend/lib/db'

const origin = (value?: string) => value ? [value] : []
const secret = process.env.BETTER_AUTH_SECRET
if (!secret || secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be configured with at least 32 characters.')
}

export const auth = betterAuth({
  database: pool,
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    ...origin(process.env.BETTER_AUTH_URL),
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', ...origin(process.env.V0_RUNTIME_URL), ...origin(process.env.V0_DEV_APP_URL), ...origin(process.env.V0_BUILD_URL), ...origin(process.env.V0_SANDBOX_URL)] : []),
    ...(process.env.NODE_ENV === 'production' ? [...origin(process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`), ...origin(process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)] : []),
  ],
})
