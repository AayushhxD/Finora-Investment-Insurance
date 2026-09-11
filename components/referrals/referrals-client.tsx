'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Share2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-gray', CONTACTED: 'badge-blue', CONVERTED: 'badge-violet', SUCCESSFUL: 'badge-green', LOST: 'badge-red'
}

export default function ReferralsClient({ referrals }: { referrals: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = referrals.filter(r =>
    (!search || r.referrerName.toLowerCase().includes(search.toLowerCase()) || r.referredName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || r.status === statusFilter)
  )

  const stats = {
    total: referrals.length,
    successful: referrals.filter(r => r.status === 'SUCCESSFUL').length,
    converted: referrals.filter(r => ['CONVERTED', 'SUCCESSFUL'].includes(r.status)).length,
    conversionRate: referrals.length ? Math.round((referrals.filter(r => r.status === 'SUCCESSFUL').length / referrals.length) * 100) : 0
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Referrals</h1><p className="muted">Referral program tracking</p></div>
      </div>

      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <article><span>TOTAL REFERRALS</span><strong>{stats.total}</strong></article>
        <article><span>SUCCESSFUL</span><strong className="positive">{stats.successful}</strong></article>
        <article><span>CONVERTED</span><strong>{stats.converted}</strong></article>
        <article><span>CONVERSION RATE</span><strong>{stats.conversionRate}%</strong></article>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrals…" /></div>
          <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['PENDING','CONTACTED','CONVERTED','SUCCESSFUL','LOST'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><Share2 size={40} /><h3>No referrals found</h3></div>
        ) : (
          <table>
            <thead><tr><th>REFERRER</th><th>REFERRED</th><th>STATUS</th><th>REWARD</th><th>DATE</th></tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id}>
                  <td className="td-name">{r.referrerName}</td>
                  <td>{r.referredName}</td>
                  <td><span className={`badge ${STATUS_COLORS[r.status] ?? 'badge-gray'}`}>{r.status}</span></td>
                  <td>{r.rewardAmount ? <span className="positive" style={{ fontWeight: 700 }}>₹{r.rewardAmount}</span> : <span className="td-muted">—</span>}</td>
                  <td className="td-muted">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
