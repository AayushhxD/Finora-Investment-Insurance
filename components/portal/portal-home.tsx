import { fmtDate } from '@/lib/fmt-date'
import { getCustomerFullProfile } from '@/app/actions/customers'
import Link from 'next/link'
import { FileText, FolderOpen, RefreshCw, Share2, Gift, MessageCircle } from 'lucide-react'

export default async function PortalHome({ customerId }: { customerId: string }) {
  const profile = await getCustomerFullProfile(customerId)
  if (!profile) return null

  const { customer, applications, documents, renewals, referrals, rewards } = profile
  const base = `/portal/${customerId}`
  const pendingDocs = documents.filter((d: any) => d.status === 'REQUESTED' || d.status === 'REJECTED').length
  const unreadRenewals = renewals.filter((r: any) => r.status !== 'COMPLETED').length
  const totalRewards = rewards.reduce((s: number, r: any) => s + r.amount, 0)

  return (
    <div>
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, #121d35, #7251e8)', borderRadius: 20, padding: '32px 36px', marginBottom: 24, color: '#fff' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, opacity: 0.7 }}>Welcome back,</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{customer.name}</h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{customer.email} · Member since {fmtDate(customer.createdAt)}</p>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          {[
            { label: 'Applications', value: applications.length },
            { label: 'Documents Pending', value: pendingDocs },
            { label: 'Total Rewards', value: `₹${totalRewards}` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { href: `${base}/applications`, icon: <FileText size={22} />, label: 'My Applications', value: applications.length, color: '#e8f1ff', iconColor: '#3b72e8' },
          { href: `${base}/documents`, icon: <FolderOpen size={22} />, label: 'My Documents', value: `${pendingDocs} pending`, color: pendingDocs > 0 ? '#fff8e6' : '#f0f2f5', iconColor: pendingDocs > 0 ? '#c49320' : '#6b7690' },
          { href: `${base}/renewals`, icon: <RefreshCw size={22} />, label: 'Renewals', value: `${unreadRenewals} active`, color: '#e7f8ef', iconColor: 'var(--green)' },
          { href: `${base}/referrals`, icon: <Share2 size={22} />, label: 'Refer & Earn', value: `${referrals.length} referrals`, color: '#f0ecff', iconColor: '#6641c8' },
          { href: `${base}/rewards`, icon: <Gift size={22} />, label: 'My Rewards', value: `₹${totalRewards}`, color: '#fff8e6', iconColor: '#c49320' },
          { href: `${base}/messages`, icon: <MessageCircle size={22} />, label: 'Messages', value: 'Chat with RM', color: '#e8f1ff', iconColor: '#3b72e8' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'box-shadow .15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px #121d3512')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: item.color, display: 'grid', placeItems: 'center', color: item.iconColor, marginBottom: 12 }}>
                {item.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{item.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active Applications */}
      {applications.filter((a: any) => a.status !== 'COMPLETED' && a.status !== 'REJECTION' && a.status !== 'RENEWAL_SCHEDULED').length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Active Applications</h2>
            <Link href={`${base}/applications`}><button className="text-btn">View all →</button></Link>
          </div>
          {applications.filter((a: any) => a.status !== 'COMPLETED' && a.status !== 'REJECTION').slice(0, 3).map((a: any) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>APP-{a.id}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{a.nextAction}</div>
              </div>
              <span className={`badge ${a.pendingWith === 'Customer' ? 'badge-yellow' : 'badge-green'}`}>
                {a.pendingWith === 'Customer' ? '⚠ Your action needed' : 'In progress'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Documents Action Required */}
      {pendingDocs > 0 && (
        <div style={{ background: '#fff8e6', border: '1px solid #f4b74c', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{pendingDocs} document{pendingDocs > 1 ? 's' : ''} require your attention</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Please upload or re-upload the requested documents.</div>
          </div>
          <Link href={`${base}/documents`}><button className="primary btn-sm">Upload Now</button></Link>
        </div>
      )}
    </div>
  )
}
