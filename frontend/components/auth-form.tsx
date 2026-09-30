'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    const name = String(data.get('name') ?? '')
    try {
      const result = mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name })
      if (result.error) {
        console.error('Auth result error:', result.error)
        setError(result.error?.message ?? 'We could not verify those details. Please try again.')
        setLoading(false)
        return
      }
      window.location.assign('/')
    } catch (err) {
      console.error('Auth request failed:', err)
      setError('We could not verify those details. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="auth-form-fields">
      {mode === 'sign-up' && (
        <div className="auth-field">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" required placeholder="Rahul Mehta" autoComplete="name" />
        </div>
      )}
      <div className="auth-field">
        <label htmlFor="email">Email Address</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <div className="auth-pass-wrap">
          <input
            id="password"
            name="password"
            type={showPass ? 'text' : 'password'}
            minLength={12}
            required
            placeholder="At least 12 characters"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          />
          <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error">
          <span style={{ fontSize: 14 }}>⚠</span> {error}
        </div>
      )}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="auth-spin" />
            {mode === 'sign-in' ? 'Signing in…' : 'Creating account…'}
          </>
        ) : (
          <>
            {mode === 'sign-in' ? 'Sign in to Finora' : 'Create account'}
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {mode === 'sign-up' && (
        <p className="auth-terms">
          By creating an account you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      )}
    </form>
  )
}

const features = [
  { icon: '📊', title: 'Smart Lead Distribution', desc: 'Auto-assign leads to RMs based on workload and specialty.' },
  { icon: '🔄', title: 'Renewal Tracking', desc: 'Never miss a policy renewal with automated reminders.' },
  { icon: '🎯', title: 'Pipeline Management', desc: 'Visual Kanban pipeline from enquiry to completion.' },
  { icon: '🏆', title: 'Referral Rewards', desc: 'Track referrals and auto-credit rewards to customers.' },
]

export function AuthPageShell({
  mode,
  heading,
  subheading,
  switchText,
  switchLink,
  switchHref,
}: {
  mode: 'sign-in' | 'sign-up'
  heading: string
  subheading: string
  switchText: string
  switchLink: string
  switchHref: string
}) {
  return (
    <div className="auth-shell">
      {/* Left panel — branding */}
      <div className="auth-panel-left">
        <div className="auth-panel-inner">
          <div className="auth-brand">
            <div className="auth-logo">F</div>
            <span>Finora</span>
          </div>
          <div className="auth-hero">
            <h2>Manage every client.<br />Close every deal.</h2>
            <p>India&apos;s most complete Investment &amp; Insurance CRM — built for relationship managers who move fast.</p>
          </div>
          <div className="auth-features">
            {features.map(f => (
              <div className="auth-feature-item" key={f.title}>
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="auth-trust">
            <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
            <span>Trusted by 200+ financial advisory firms across India</span>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      {/* Right panel — form */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>{heading}</h1>
            <p>{subheading}</p>
          </div>
          <AuthForm mode={mode} />
          <p className="auth-switch-line">
            {switchText}{' '}
            <a href={switchHref}>{switchLink}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
