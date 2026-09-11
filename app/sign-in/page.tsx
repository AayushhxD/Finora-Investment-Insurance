import { AuthPageShell } from '@/components/auth-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In — Finora CRM' }

export default function SignInPage() {
  return (
    <AuthPageShell
      mode="sign-in"
      heading="Welcome back."
      subheading="Sign in to your Finora workspace to continue."
      switchText="New to Finora?"
      switchLink="Create a free account"
      switchHref="/sign-up"
    />
  )
}
