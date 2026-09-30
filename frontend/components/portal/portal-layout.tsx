'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Customer } from '@shared/types/store-types'
import { Home, FileText, FolderOpen, MessageCircle, RefreshCw, Share2, Gift } from 'lucide-react'

export default function PortalLayout({ customer, children, activeSection }: {
  customer: Customer
  children: React.ReactNode
  activeSection?: string
}) {
  const pathname = usePathname()
  const base = `/portal/${customer.id}`

  const links = [
    { href: base, label: 'Overview', icon: <Home size={16} /> },
    { href: `${base}/applications`, label: 'Applications', icon: <FileText size={16} /> },
    { href: `${base}/documents`, label: 'Documents', icon: <FolderOpen size={16} /> },
    { href: `${base}/messages`, label: 'Messages', icon: <MessageCircle size={16} /> },
    { href: `${base}/renewals`, label: 'Renewals', icon: <RefreshCw size={16} /> },
    { href: `${base}/referrals`, label: 'Refer & Earn', icon: <Share2 size={16} /> },
    { href: `${base}/rewards`, label: 'Rewards', icon: <Gift size={16} /> },
  ]

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>IX</div>
          <strong style={{ fontSize: 18, letterSpacing: -0.5 }}>Invest<span style={{ color: 'var(--green)' }}>X</span></strong>
          <span style={{ color: 'var(--line)', fontSize: 20, margin: '0 4px' }}>|</span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Customer Portal</span>
        </div>
        <nav className="portal-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
              {l.icon}{l.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{customer.email}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e7f8ef', display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--green)' }}>
            {customer.name[0]}
          </div>
        </div>
      </header>
      <div className="portal-content">
        {children}
      </div>
    </div>
  )
}
