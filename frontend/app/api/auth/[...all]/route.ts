import { auth } from '@backend/infrastructure/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'

export const runtime = 'nodejs'

export const { GET, POST } = toNextJsHandler(auth)
