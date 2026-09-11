'use client'
import { useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Target, ArrowLeftRight, FileText, Package,
  FolderOpen, RefreshCw, Share2, MessageSquare, UserCog, BarChart3,
  Bell, Menu, Search, LogOut, X, ChevronRight
} from 'lucide-react'

export function AppLayout({ children, name, unreadCount = 0 }: {
  children: React.ReactNode
  name: string
  unreadCount?: number
}) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    if (q.trim().length > 1) {
      router.push(`/customers?search=${encodeURIComponent(q.trim())}`)
    }
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const navLink = (href: string, icon: React.ReactNode, label: string, badge?: number) => {
    const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} className={active ? 'active' : ''} onClick={() => setOpen(false)}>
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        {badge ? <i>{badge}</i> : null}
        {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
      </Link>
    )
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="logo">F</div>
          <div>
            <b>Finora</b>
            <small>Investment &amp; Insurance CRM</small>
          </div>
        </div>

        <button className="close-nav" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>

        <nav>
          <p className="nav-label">MAIN</p>
          {navLink('/', <LayoutDashboard size={16} />, 'Dashboard')}
          {navLink('/customers', <Users size={16} />, 'Customers')}
          {navLink('/leads', <Target size={16} />, 'Leads & Opportunities')}
          {navLink('/lead-distribution', <ArrowLeftRight size={16} />, 'Lead Distribution')}
          {navLink('/applications', <FileText size={16} />, 'Applications')}
          {navLink('/products', <Package size={16} />, 'Products')}

          <p className="nav-label second">OPERATIONS</p>
          {navLink('/documents', <FolderOpen size={16} />, 'Documents')}
          {navLink('/renewals', <RefreshCw size={16} />, 'Renewals')}
          {navLink('/referrals', <Share2 size={16} />, 'Referrals & Rewards')}
          {navLink('/messages', <MessageSquare size={16} />, 'Messages')}

          <p className="nav-label third">MANAGEMENT</p>
          {navLink('/staff', <UserCog size={16} />, 'Staff Management')}
          {navLink('/reports', <BarChart3 size={16} />, 'Reports & Analytics')}
        </nav>

        <div className="side-bottom">
          <div className="side-bottom-label">Signed in as</div>
          <div className="side-bottom-name"><b>{name}</b></div>
          <button className="signout" onClick={handleSignOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"
              style={{ width: 38, height: 38, border: '1.5px solid var(--line)', borderRadius: 10, background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              <Menu size={18} />
            </button>
            <div className="search">
              <Search size={15} />
              <input
                placeholder="Search customers, applications..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
            <Link href="/notifications" style={{ textDecoration: 'none' }}>
              <button aria-label="Notifications" onClick={() => showToast(`${unreadCount || 3} notifications`)}>
                <Bell size={17} />
                {unreadCount > 0 && <b>{unreadCount}</b>}
              </button>
            </Link>
            <div className="avatar">{initials}</div>
            <div className="header-user">
              <b>{name.split(' ')[0]}</b>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {children}
      </main>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
