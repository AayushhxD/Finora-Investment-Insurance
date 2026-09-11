'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createLead } from '@/app/actions/leads'
import { Users, FileText, AlertCircle, RefreshCw, Plus, TrendingUp, X } from 'lucide-react'
import type { Staff } from '@/lib/store-types'

type PipelineStage = { label: string; count: number; cases: { name: string; detail: string; appId?: string }[] }
type FollowUp = { customer: string; initials: string; product: string; pendingWith: string; staff: string; due: string; status: string; statusClass: string }
type Activity = { action: string; detail: string; time: string }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function LeadModal({ staff, onClose, onSuccess }: { staff: Staff[]; onClose: () => void; onSuccess: () => void }) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startT(async () => {
      try {
        await createLead(Object.fromEntries(fd.entries()))
        onSuccess()
        onClose()
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Failed to create lead')
      }
    })
  }

  return (
    <div className="modal-back show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <b>New Lead</b>
          <button
            style={{ width: 32, height: 32, border: '1.5px solid var(--line)', borderRadius: 8, background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field"><label>Customer / Lead Name</label><input name="name" required placeholder="e.g. Neha Shah" /></div>
              <div className="field"><label>Mobile</label><input name="phone" required placeholder="+91" /></div>
              <div className="field"><label>Email</label><input name="email" type="email" required placeholder="email@example.com" /></div>
              <div className="field">
                <label>Product Interest</label>
                <select name="productInterest" required defaultValue="Mutual Fund">
                  <option>Mutual Fund</option><option>Health Insurance</option><option>LIC</option><option>Demat Account</option>
                </select>
              </div>
              <div className="field">
                <label>Lead Source</label>
                <select name="source" defaultValue="WEBSITE">
                  <option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option>
                  <option value="WALK_IN">Walk-in</option><option value="PHONE">Phone</option>
                </select>
              </div>
              <div className="field">
                <label>Assign Staff (optional)</label>
                <select name="assignedStaffId" defaultValue="">
                  <option value="">Unassigned — distribute later</option>
                  {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="field full"><label>Discussion / Notes</label><textarea name="notes" placeholder="Add enquiry details..." /></div>
            </div>
            {err && <p className="form-error-msg" style={{ marginTop: 12 }}>{err}</p>}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save &amp; Continue</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STAGE_COLORS: Record<string, { bg: string; dot: string }> = {
  Enquiry:   { bg: 'rgba(79,110,247,0.07)', dot: '#4f6ef7' },
  Documents: { bg: 'rgba(245,158,11,0.07)', dot: '#f59e0b' },
  Submitted: { bg: 'rgba(6,182,212,0.07)',  dot: '#06b6d4' },
  Processing:{ bg: 'rgba(124,58,237,0.07)', dot: '#7c3aed' },
  Completed: { bg: 'rgba(16,185,129,0.07)', dot: '#10b981' },
}

export default function FinoraDashboard({
  name,
  stats,
  pipeline,
  activities,
  followUps,
  staff,
}: {
  name: string
  stats: { totalCustomers: number; activeApplications: number; pendingCases: number; upcomingRenewals: number; customerGrowth: string; newApps: string; needsAction: number }
  pipeline: PipelineStage[]
  activities: Activity[]
  followUps: FollowUp[]
  staff: Staff[]
}) {
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      delta: stats.customerGrowth,
      deltaType: 'up',
      icon: <Users size={18} />,
      iconColor: '#4f6ef7',
      iconBg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    },
    {
      label: 'Active Applications',
      value: stats.activeApplications,
      delta: stats.newApps,
      deltaType: 'up',
      icon: <FileText size={18} />,
      iconColor: '#10b981',
      iconBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    },
    {
      label: 'Pending Cases',
      value: stats.pendingCases,
      delta: `${stats.needsAction} need customer action`,
      deltaType: 'warn',
      icon: <AlertCircle size={18} />,
      iconColor: '#f59e0b',
      iconBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    },
    {
      label: 'Upcoming Renewals',
      value: stats.upcomingRenewals,
      delta: 'Next 30 days',
      deltaType: 'warn',
      icon: <RefreshCw size={18} />,
      iconColor: '#7c3aed',
      iconBg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    },
  ]

  return (
    <div className="content">
      {/* Header */}
      <div className="welcome-row">
        <div>
          <h1>{getGreeting()}, {name.split(' ')[0]} 👋</h1>
          <p className="muted">Here&apos;s what&apos;s happening across your customer operations today.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats">
        {statCards.map(card => (
          <div className="stat" key={card.label}>
            <div className="stat-top">
              <span className="label">{card.label}</span>
              <div className="stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
            <div className="num">{card.value}</div>
            <div className={`delta ${card.deltaType}`}>
              <TrendingUp size={11} /> {card.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline & Activity */}
      <div className="two">
        <div className="card">
          <div className="card-head">
            <h3>Application Pipeline</h3>
            <Link href="/applications"><button className="btn-light btn-sm">View all</button></Link>
          </div>
          <div className="card-body">
            <div className="pipeline">
              {pipeline.map(stage => {
                const colors = STAGE_COLORS[stage.label] ?? { bg: 'var(--soft2)', dot: 'var(--primary)' }
                return (
                  <div className="stage" key={stage.label} style={{ background: colors.bg }}>
                    <div className="stage-head">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, display: 'inline-block', boxShadow: `0 0 6px ${colors.dot}` }} />
                        {stage.label}
                      </span>
                      <span className="stage-count">{stage.count}</span>
                    </div>
                    {stage.cases.slice(0, 2).map(c => (
                      <div
                        className="case"
                        key={c.name + c.detail}
                        onClick={() => c.appId && router.push(`/applications/${c.appId}`)}
                      >
                        <b>{c.name}</b><small>{c.detail}</small>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent Activity</h3>
            <Link href="/activity"><button className="btn-light btn-sm">All</button></Link>
          </div>
          <div className="card-body">
            {activities.map((a, i) => (
              <div className="activity" key={i}>
                <span className="dot" />
                <div>
                  <b>{a.action}</b>
                  <p>{a.detail}</p>
                  <time>{a.time}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Follow-ups */}
      <div className="card" style={{ marginTop: 0 }}>
        <div className="card-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h3>Priority Follow-ups</h3>
          </div>
          <span className="badge b-orange">{followUps.filter(f => f.due === 'Today').length} due today</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Pending With</th>
                <th>Staff</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((f, i) => (
                <tr key={`${i}-${f.customer}-${f.product}`}>
                  <td>
                    <div className="customer">
                      <span className="mini-avatar">{f.initials}</span>
                      <span style={{ fontWeight: 600 }}>{f.customer}</span>
                    </div>
                  </td>
                  <td>{f.product}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.pendingWith === 'Customer' ? 'var(--warning)' : 'var(--primary)', display: 'inline-block' }} />
                      {f.pendingWith}
                    </span>
                  </td>
                  <td>{f.staff}</td>
                  <td>
                    <span style={{ fontWeight: f.due === 'Today' ? 700 : 400, color: f.due === 'Today' ? 'var(--danger)' : 'var(--ink)' }}>
                      {f.due}
                    </span>
                  </td>
                  <td><span className={`badge ${f.statusClass}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <LeadModal
          staff={staff}
          onClose={() => setModal(false)}
          onSuccess={() => { showToast('Lead saved — added to queue'); router.refresh() }}
        />
      )}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
