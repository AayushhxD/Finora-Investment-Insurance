import { AuthPageShell } from '@/components/auth-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Account — Finora CRM' }

export default function SignUpPage() {
  return (
    <AuthPageShell
      mode="sign-up"
      heading="Get started free."
      subheading="Create your Finora workspace in under 2 minutes."
      switchText="Already have an account?"
      switchLink="Sign in"
      switchHref="/sign-in"
    />
  )
}
