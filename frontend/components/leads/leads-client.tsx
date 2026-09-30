'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createLead, updateLeadStatus, convertLeadToCustomer, updateLead } from '@backend/actions/leads'
import type { Lead, Staff, Customer, LeadStatus } from '@shared/types/store-types'
import { Plus, Search, Briefcase, ArrowRight, X } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = { NEW: 'badge-gray', CONTACTED: 'badge-blue', INTERESTED: 'badge-yellow', FOLLOW_UP: 'badge-orange', CONVERTED: 'badge-green', LOST: 'badge-red' }
const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST']

function LeadModal({ lead, staff, onClose }: { lead?: Lead | null; staff: Staff[]; onClose: () => void }) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    startT(async () => {
      try {
        if (lead) { await updateLead(lead.id, data) } else { await createLead(data) }
        router.refresh(); onClose()
      } catch (ex: any) { setErr(ex.message) }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <b>{lead ? 'Edit Lead' : 'Add New Lead'}</b>
            <p>{lead ? 'Update lead details and notes.' : 'Register a new potential customer.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Contact Details */}
            <div className="modal-section">
              <div className="modal-section-title">Contact Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input name="name" required defaultValue={lead?.name} placeholder="e.g. Suresh Pillai" />
                </div>
                <div className="form-group">
                  <label>Email <span className="req">*</span></label>
                  <input name="email" type="email" required defaultValue={lead?.email} placeholder="suresh@example.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone <span className="req">*</span></label>
                  <input name="phone" required defaultValue={lead?.phone} placeholder="9800001111" />
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <select name="source" defaultValue={lead?.source ?? 'WEBSITE'}>
                    <option value="WEBSITE">🌐 Website</option>
                    <option value="REFERRAL">🤝 Referral</option>
                    <option value="WALK_IN">🚶 Walk-in</option>
                    <option value="PHONE">📞 Phone</option>
                    <option value="SOCIAL_MEDIA">📱 Social Media</option>
                    <option value="OTHER">❓ Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interest & Assignment */}
            <div className="modal-section">
              <div className="modal-section-title">Interest &amp; Assignment</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Interest <span className="req">*</span></label>
                  <input name="productInterest" required defaultValue={lead?.productInterest} placeholder="e.g. Mutual Fund, LIC…" />
                </div>
                <div className="form-group">
                  <label>Assigned Staff <span className="req">*</span></label>
                  <select name="assignedStaffId" required defaultValue={lead?.assignedStaffId ?? ''}>
                    <option value="">Select staff…</option>
                    {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" defaultValue={lead?.notes} placeholder="Any additional notes about this lead…" />
              </div>
            </div>

            {err && <p className="form-error-msg">⚠ {err}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">
              {lead ? '✓ Save Changes' : '＋ Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadsClient({ leads, staff, customers }: { leads: Lead[], staff: Staff[], customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [modal, setModal] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [convertId, setConvertId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = leads.filter(l =>
    (!search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || l.status === statusFilter) &&
    (!staffFilter || l.assignedStaffId === staffFilter)
  )

  function handleStatusChange(leadId: string, status: LeadStatus) {
    startT(async () => { await updateLeadStatus(leadId, status); router.refresh() })
  }

  function handleConvert(leadId: string, assignedStaffId: string) {
    startT(async () => {
      const res = await convertLeadToCustomer(leadId, assignedStaffId)
      setConvertId(null)
      showToast('Lead converted to customer!')
      router.push(`/customers/${res.customerId}`)
    })
  }

  const grouped: Record<LeadStatus, Lead[]> = { NEW: [], CONTACTED: [], INTERESTED: [], FOLLOW_UP: [], CONVERTED: [], LOST: [] }
  filtered.forEach(l => grouped[l.status].push(l))

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Leads</h1><p className="muted">{leads.length} total leads</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={view === 'table' ? 'btn-dark btn-sm' : 'outline-btn btn-sm'} onClick={() => setView('table')}>Table</button>
          <button className={view === 'kanban' ? 'btn-dark btn-sm' : 'outline-btn btn-sm'} onClick={() => setView('kanban')}>Kanban</button>
          <button className="primary" onClick={() => setModal(true)}><Plus size={16} />Add Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="tbl-search" style={{ flex: 1 }}><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" /></div>
        <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="tbl-filter-select" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
          <option value="">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                {status}<span>{grouped[status].length}</span>
              </div>
              {grouped[status].map(l => {
                const assignedStaff = staff.find(s => s.id === l.assignedStaffId)
                return (
                  <div key={l.id} className="kanban-card">
                    <h4>{l.name}</h4>
                    <p>{l.productInterest} · {l.source}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {status !== 'CONVERTED' && status !== 'LOST' && (
                        <select style={{ fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, padding: '3px 6px', background: '#fff' }}
                          value={status} onChange={e => handleStatusChange(l.id, e.target.value as LeadStatus)}>
                          {STATUSES.filter(s => s !== 'CONVERTED').map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                      {(status === 'INTERESTED' || status === 'FOLLOW_UP') && (
                        <button className="primary btn-sm" style={{ fontSize: 10 }} onClick={() => setConvertId(l.id)}>Convert →</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state"><Briefcase size={40} /><h3>No leads found</h3><button className="primary" onClick={() => setModal(true)}><Plus size={16} />Add Lead</button></div>
          ) : (
            <table>
              <thead><tr><th>NAME</th><th>CONTACT</th><th>INTEREST</th><th>SOURCE</th><th>ASSIGNED</th><th>STATUS</th><th>UPDATED</th><th></th></tr></thead>
              <tbody>
                {filtered.map(l => {
                  const assignedStaff = staff.find(s => s.id === l.assignedStaffId)
                  return (
                    <tr key={l.id}>
                      <td><div className="td-name">{l.name}</div><div className="td-muted">{l.notes?.slice(0, 40)}{l.notes?.length > 40 ? '…' : ''}</div></td>
                      <td><div>{l.email}</div><div className="td-muted">{l.phone}</div></td>
                      <td>{l.productInterest}</td>
                      <td><span className="badge badge-gray">{l.source}</span></td>
                      <td className="td-muted">{assignedStaff?.name ?? '—'}</td>
                      <td>
                        <select className="tbl-filter-select" style={{ padding: '4px 8px' }} value={l.status}
                          onChange={e => handleStatusChange(l.id, e.target.value as LeadStatus)}
                          disabled={l.status === 'CONVERTED' || l.status === 'LOST'}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="td-muted">{fmtDate(l.updatedAt)}</td>
                      <td>
                        <div className="td-actions">
                          {(l.status === 'INTERESTED' || l.status === 'FOLLOW_UP') && (
                            <button className="primary btn-sm" onClick={() => setConvertId(l.id)}>Convert</button>
                          )}
                          <button className="btn-ghost btn-sm" onClick={() => { setEditLead(l); setModal(true) }}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <LeadModal lead={editLead} staff={staff} onClose={() => { setModal(false); setEditLead(null) }} />
      )}

      {convertId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConvertId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2>Convert Lead to Customer</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>This will create a new customer record from this lead. Select the assigned RM.</p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Assigned RM</label>
              <select id="convertStaff" defaultValue={leads.find(l => l.id === convertId)?.assignedStaffId ?? ''}>
                {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConvertId(null)}>Cancel</button>
              <button className="primary" onClick={() => {
                const sel = (document.getElementById('convertStaff') as HTMLSelectElement).value
                handleConvert(convertId!, sel)
              }}>Convert to Customer →</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
