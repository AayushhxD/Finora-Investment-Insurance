'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/app/actions/messages'
import Link from 'next/link'
import type { Application, Document, Message, Renewal, Referral, Reward, ActivityLog, Staff } from '@/lib/store-types'

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-green', inactive: 'badge-gray', prospect: 'badge-yellow',
  COMPLETED: 'badge-green', PROCESSING: 'badge-blue', DOCUMENTS_REQUESTED: 'badge-yellow',
  DOCUMENTS_RECEIVED: 'badge-orange', SUBMITTED: 'badge-blue', APPROVED: 'badge-green',
  VERIFIED: 'badge-green', REJECTED: 'badge-red', UPLOADED: 'badge-blue',
  REQUESTED: 'badge-gray', UPCOMING: 'badge-yellow', REMINDER_SENT: 'badge-orange',
  SUCCESSFUL: 'badge-green', CONVERTED: 'badge-blue', PENDING: 'badge-gray',
  ELIGIBLE: 'badge-green', PAID: 'badge-blue', PENDING_PAYMENT: 'badge-yellow',
  RENEWAL_SCHEDULED: 'badge-green',
}

function Badge({ value }: { value: string }) {
  const cls = STATUS_COLORS[value] ?? 'badge-gray'
  return <span className={`badge ${cls}`}>{value.replace(/_/g, ' ')}</span>
}

export function CustomerDetailClient({ profile }: { profile: any }) {
  const { customer, staff, applications, documents, messages, renewals, referrals, rewards, activity } = profile
  const [tab, setTab] = useState('overview')
  const [msgText, setMsgText] = useState('')
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id ?? '')
  const [sending, startSend] = useTransition()
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  function handleSendMsg(e: React.FormEvent) {
    e.preventDefault()
    if (!msgText.trim() || !selectedAppId) return
    startSend(async () => {
      await sendMessage(selectedAppId, 'staff', 'staff', 'Staff', msgText)
      setMsgText('')
      showToast('Message sent')
      router.refresh()
    })
  }

  const appMessages = messages.filter((m: Message) => m.applicationId === selectedAppId)

  return (
    <div className="content">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{customer.name[0]}</div>
        <div className="profile-info">
          <h2>{customer.name}</h2>
          <p>{customer.email} · {customer.phone}</p>
          <div className="profile-tags">
            <Badge value={customer.status} />
            {staff && <span className="badge badge-blue">RM: {staff.name}</span>}
            <span className="badge badge-gray">Code: {customer.referralCode}</span>
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/portal/${customer.id}`} target="_blank">
            <button className="outline-btn btn-sm">Open Portal ↗</button>
          </Link>
          <Link href={`/applications?customerId=${customer.id}`}>
            <button className="primary btn-sm">+ New Application</button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'applications', 'documents', 'messages', 'renewals', 'referrals', 'rewards', 'activity'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'applications' && applications.length > 0 && <> ({applications.length})</>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Personal Information</h2>
          <div className="info-grid">
            <div className="info-row"><span className="info-label">Full Name</span><span className="info-value">{customer.name}</span></div>
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{customer.email}</span></div>
            <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{customer.phone}</span></div>
            <div className="info-row"><span className="info-label">Date of Birth</span><span className="info-value">{customer.dob || '—'}</span></div>
            <div className="info-row"><span className="info-label">Address</span><span className="info-value">{customer.address}, {customer.city}</span></div>
            <div className="info-row"><span className="info-label">PAN</span><span className="info-value">{customer.panNumber || '—'}</span></div>
            <div className="info-row"><span className="info-label">Assigned RM</span><span className="info-value">{staff?.name ?? '—'} ({staff?.role})</span></div>
            <div className="info-row"><span className="info-label">Status</span><span className="info-value"><Badge value={customer.status} /></span></div>
            <div className="info-row"><span className="info-label">Referral Code</span><span className="info-value">{customer.referralCode}</span></div>
            <div className="info-row"><span className="info-label">Member Since</span><span className="info-value">{fmtDate(customer.createdAt)}</span></div>
          </div>
        </div>
      )}

      {/* Applications */}
      {tab === 'applications' && (
        <div>
          {applications.length === 0 ? (
            <div className="empty-state"><h3>No applications</h3><p>No applications created for this customer yet.</p></div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {applications.map((a: Application & { productName?: string; staffName?: string }) => (
                <Link key={a.id} href={`/applications/${a.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>APP-{a.id}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Created {fmtDate(a.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge value={a.status} />
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Pending: {a.pendingWith}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="doc-grid">
          {documents.length === 0 ? (
            <div className="empty-state"><h3>No documents</h3><p>No documents uploaded for this customer yet.</p></div>
          ) : documents.map((d: Document) => (
            <div key={d.id} className="doc-row">
              <div className="doc-row-icon">📄</div>
              <div className="doc-row-body">
                <h4>{d.name}</h4>
                <p>{d.docType} · {d.fileName ?? 'Not uploaded'} · {d.requestedAt ? fmtDate(d.requestedAt) : ''}</p>
              </div>
              <Badge value={d.status} />
              {d.rejectionReason && <span style={{ fontSize: 12, color: '#db6268', maxWidth: 160 }}>{d.rejectionReason}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {tab === 'messages' && (
        <div className="card">
          {applications.length > 0 && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Application</label>
              <select value={selectedAppId} onChange={e => setSelectedAppId(e.target.value)}>
                {applications.map((a: Application) => <option key={a.id} value={a.id}>APP-{a.id}</option>)}
              </select>
            </div>
          )}
          <div className="msg-thread">
            {appMessages.length === 0 ? <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>No messages yet</p> : null}
            {appMessages.map((m: Message) => (
              <div key={m.id} className={`msg-bubble ${m.fromRole}`}>
                <div className="msg-text">{m.content}</div>
                <div className="msg-meta">{m.fromName} · {new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message to the customer…"
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 9, padding: '10px 14px', fontSize: 14 }} />
            <button type="submit" className="primary" disabled={sending || !msgText.trim()}>Send</button>
          </form>
        </div>
      )}

      {/* Renewals */}
      {tab === 'renewals' && (
        <div>
          {renewals.length === 0 ? <div className="empty-state"><h3>No renewals</h3></div> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>PRODUCT</th><th>RENEWAL DATE</th><th>STATUS</th></tr></thead>
                <tbody>
                  {renewals.map((r: Renewal) => (
                    <tr key={r.id}>
                      <td>{r.productId}</td>
                      <td>{fmtDate(r.renewalDate)}</td>
                      <td><Badge value={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Referrals */}
      {tab === 'referrals' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="eyebrow">REFERRAL LINK</p>
            <div className="ref-link-box" style={{ marginTop: 8 }}>
              <code>http://localhost:3000/?ref={customer.referralCode}</code>
              <button className="outline-btn btn-sm" onClick={() => { navigator.clipboard.writeText(`http://localhost:3000/?ref=${customer.referralCode}`); showToast('Copied!') }}>Copy</button>
            </div>
          </div>
          {referrals.length === 0 ? <div className="empty-state"><h3>No referrals yet</h3></div> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>REFERRED</th><th>STATUS</th><th>REWARD</th></tr></thead>
                <tbody>
                  {referrals.map((r: Referral & { rewardAmount?: number }) => (
                    <tr key={r.id}>
                      <td>{r.referredName}</td>
                      <td><Badge value={r.status} /></td>
                      <td>{r.rewardId ? `₹${r.rewardId}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rewards */}
      {tab === 'rewards' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {rewards.length === 0 ? <div className="empty-state"><h3>No rewards yet</h3></div> : rewards.map((r: Reward) => (
            <div key={r.id} className="reward-card">
              <div className="reward-card-icon">🎁</div>
              <div className="reward-card-body">
                <h3>₹{r.amount} — {r.type.replace(/_/g, ' ')}</h3>
                <p>{r.description}</p>
              </div>
              <Badge value={r.status} />
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div className="card">
          <div className="timeline">
            {activity.length === 0 ? <p style={{ color: 'var(--muted)' }}>No activity yet</p> : activity.map((a: ActivityLog, i: number) => (
              <div key={a.id} className="timeline-item">
                <div className="timeline-dot">
                  <div className="timeline-circle done">✓</div>
                  {i < activity.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-body">
                  <h4>{a.action}</h4>
                  <p>{a.entityLabel}</p>
                  <small>{a.performedBy} · {new Date(a.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
