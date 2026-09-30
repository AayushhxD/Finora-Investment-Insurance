import { auth } from '@backend/lib/auth'
import { NextResponse } from 'next/server'

// Dev-only: seed a user into the auth adapter (memory or DB) so you can sign in
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  try {
    const body = await request.json()
    const { email, password, name } = body
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    const result = await (auth.api as any).signUpEmail({ body: { email, password, name } })
    return NextResponse.json(result, { status: result.error ? 400 : 200 })
  } catch (err) {
    console.error('Seed user failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
