'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRenewalStatus, sendRenewalReminder } from '@backend/modules/renewals/presentation/actions'
import type { RenewalStatus } from '@shared/types/store-types'
import Link from 'next/link'
import { Search, RefreshCw, Bell } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'badge-yellow', REMINDER_SENT: 'badge-orange', CUSTOMER_CONTACTED: 'badge-blue',
  IN_PROGRESS: 'badge-violet', COMPLETED: 'badge-green', EXPIRED: 'badge-red', NOT_RENEWED: 'badge-red'
}

export default function RenewalsClient({ renewals, stats }: { renewals: any[], stats: any }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = renewals.filter(r =>
    (!search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.productName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || r.status === statusFilter)
  ).sort((a, b) => a.daysUntil - b.daysUntil)

  function handleStatusUpdate(id: string, status: RenewalStatus) {
    startT(async () => { await updateRenewalStatus(id, status, 'Staff'); showToast(`Status updated to ${status}`); router.refresh() })
  }

  function handleReminder(id: string) {
    startT(async () => { await sendRenewalReminder(id, 'Staff'); showToast('Reminder sent!'); router.refresh() })
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Renewals</h1><p className="muted">Track and manage policy renewals</p></div>
      </div>

      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <article><span>DUE TODAY</span><strong style={{ color: stats.today > 0 ? '#db6268' : undefined }}>{stats.today}</strong></article>
        <article><span>THIS WEEK</span><strong style={{ color: stats.thisWeek > 0 ? '#f4a04c' : undefined }}>{stats.thisWeek}</strong></article>
        <article><span>THIS MONTH</span><strong>{stats.thisMonth}</strong></article>
        <article><span>OVERDUE</span><strong style={{ color: stats.overdue > 0 ? '#db6268' : undefined }}>{stats.overdue}</strong></article>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search renewals…" /></div>
          <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['UPCOMING','REMINDER_SENT','CUSTOMER_CONTACTED','IN_PROGRESS','COMPLETED','NOT_RENEWED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><RefreshCw size={40} /><h3>No renewals found</h3></div>
        ) : (
          <table>
            <thead><tr><th>CUSTOMER</th><th>PRODUCT</th><th>ASSIGNED RM</th><th>RENEWAL DATE</th><th>DAYS</th><th>STATUS</th><th></th></tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id}>
                  <td className="td-name">{r.customerName}</td>
                  <td>{r.productName}</td>
                  <td className="td-muted">{r.staffName}</td>
                  <td>{fmtDate(r.renewalDate)}</td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: r.daysUntil < 0 ? '#db6268' : r.daysUntil <= 7 ? '#f4a04c' : r.daysUntil <= 30 ? '#c49320' : 'var(--green)'
                    }}>
                      {r.daysUntil < 0 ? `${Math.abs(r.daysUntil)}d overdue` : r.daysUntil === 0 ? 'Today!' : `${r.daysUntil}d`}
                    </span>
                  </td>
                  <td><span className={`badge ${STATUS_COLORS[r.status] ?? 'badge-gray'}`}>{r.status.replace(/_/g,' ')}</span></td>
                  <td>
                    <div className="td-actions">
                      {r.status === 'UPCOMING' && (
                        <button className="outline-btn btn-sm" onClick={() => handleReminder(r.id)}><Bell size={13} /> Remind</button>
                      )}
                      {r.status === 'REMINDER_SENT' && (
                        <button className="outline-btn btn-sm" onClick={() => handleStatusUpdate(r.id, 'CUSTOMER_CONTACTED')}>Contacted</button>
                      )}
                      {r.status === 'CUSTOMER_CONTACTED' && (
                        <button className="primary btn-sm" onClick={() => handleStatusUpdate(r.id, 'COMPLETED')}>Mark Completed</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
