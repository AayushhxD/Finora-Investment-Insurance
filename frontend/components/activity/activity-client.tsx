'use client'
import { useState } from 'react'
import { Activity } from 'lucide-react'
import type { ActivityLog } from '@shared/types/store-types'

const ENTITY_COLORS: Record<string, string> = {
  customer: 'badge-blue', lead: 'badge-yellow', staff: 'badge-violet',
  product: 'badge-gray', application: 'badge-green', document: 'badge-orange',
  renewal: 'badge-orange', referral: 'badge-violet', reward: 'badge-green', message: 'badge-blue'
}

export default function ActivityClient({ logs }: { logs: ActivityLog[] }) {
  const [entityFilter, setEntityFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = logs.filter(l =>
    (!entityFilter || l.entity === entityFilter) &&
    (!search || l.action.toLowerCase().includes(search.toLowerCase()) || l.entityLabel.toLowerCase().includes(search.toLowerCase()) || l.performedBy.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Activity Logs</h1><p className="muted">{logs.length} total actions</p></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="tbl-search" style={{ flex: 1 }}>
          <Activity size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, entities, users…" />
        </div>
        <select className="tbl-filter-select" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
          <option value="">All Entities</option>
          {['customer','lead','staff','product','application','document','renewal','referral','reward','message'].map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="tbl-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state"><Activity size={40} /><h3>No activity found</h3></div>
        ) : (
          <table>
            <thead><tr><th>ACTION</th><th>ENTITY</th><th>PERFORMED BY</th><th>DATE & TIME</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td><div className="td-name">{l.action}</div></td>
                  <td>
                    <span className={`badge ${ENTITY_COLORS[l.entity] ?? 'badge-gray'}`}>{l.entity}</span>
                    <div className="td-muted" style={{ marginTop: 2 }}>{l.entityLabel}</div>
                  </td>
                  <td className="td-muted">{l.performedBy}</td>
                  <td className="td-muted">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
