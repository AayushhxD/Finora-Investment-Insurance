'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { distributeLead, distributeAllUnassigned } from '@backend/actions/lead-distribution'
import type { Staff } from '@shared/types/store-types'
import { Target, ArrowLeftRight, Settings, Users, Plus } from 'lucide-react'

type UnassignedLead = {
  id: string
  name: string
  productInterest: string
  source: string
  receivedAgo: string
  priority: string
}

type WorkloadItem = {
  id: string
  name: string
  load: number
  cap: number
  pct: number
  specialty: string
  availability: string
}

type HistoryItem = {
  id: string
  leadName: string
  productInterest: string
  assignedToName: string
  method: string
  assignedAt: string
  status: string
}

const PRIORITY_CLASS: Record<string, string> = {
  HIGH: 'b-red', URGENT: 'b-red', MEDIUM: 'b-orange', NORMAL: 'b-blue',
}

function DistributeModal({
  leads, staff, preselectedLeadId, onClose, onSuccess,
}: {
  leads: UnassignedLead[]
  staff: Staff[]
  preselectedLeadId?: string
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [, startT] = useTransition()
  const [leadId, setLeadId] = useState(preselectedLeadId ?? leads[0]?.id ?? '')
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO')
  const [staffId, setStaffId] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startT(async () => {
      try {
        const result = await distributeLead({
          leadId,
          mode,
          staffId: mode === 'MANUAL' ? staffId : undefined,
          priority: priority as 'HIGH' | 'MEDIUM' | 'NORMAL' | 'URGENT',
          note,
        })
        onSuccess(`Lead assigned to ${result.staffName}`)
        onClose()
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Distribution failed')
      }
    })
  }

  return (
    <div className="modal-back show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><b>Distribute Lead</b><button className="icon-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>Lead</label>
                <select value={leadId} onChange={e => setLeadId(e.target.value)} required>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} — {l.productInterest}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Assignment Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value as 'AUTO' | 'MANUAL')}>
                  <option value="AUTO">Auto — Best Match</option>
                  <option value="MANUAL">Manual Assignment</option>
                </select>
              </div>
              {mode === 'MANUAL' && (
                <div className="field">
                  <label>Relationship Manager</label>
                  <select value={staffId} onChange={e => setStaffId(e.target.value)} required>
                    <option value="">Select staff…</option>
                    {staff.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="NORMAL">Normal</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="field full">
                <label>Distribution Note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional reason or instruction for the assigned staff..." />
              </div>
            </div>
            {err && <p className="form-error-msg" style={{ marginTop: 12 }}>{err}</p>}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save & Continue</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadDistributionClient({
  data, staff,
}: {
  data: {
    unassignedCount: number
    distributedToday: number
    autoDistributionRate: number
    availableStaff: number
    totalStaff: number
    unassignedLeads: UnassignedLead[]
    workload: WorkloadItem[]
    history: HistoryItem[]
  }
  staff: Staff[]
}) {
  const [modal, setModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<string | undefined>()
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const openAssign = (leadId?: string) => {
    setSelectedLead(leadId)
    setModal(true)
  }

  const distributeAll = () => {
    startT(async () => {
      try {
        const result = await distributeAllUnassigned()
        showToast(`${result.count} leads distributed automatically`)
        router.refresh()
      } catch {
        showToast('No unassigned leads to distribute')
      }
    })
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Lead Distribution</h1>
          <p className="muted">Distribute new enquiries to relationship managers based on workload, product and availability.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-light" onClick={() => showToast('Distribution rules opened')}>Distribution Rules</button>
          <button className="btn-primary" onClick={() => openAssign()}>
            <ArrowLeftRight size={15} /> Distribute Leads
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-top"><span className="label">Unassigned Leads</span><span className="stat-icon"><Target size={16} /></span></div>
          <div className="num">{data.unassignedCount}</div>
          <div className="delta warn">Needs distribution</div>
        </div>
        <div className="stat">
          <div className="stat-top"><span className="label">Distributed Today</span><span className="stat-icon"><ArrowLeftRight size={16} /></span></div>
          <div className="num">{data.distributedToday}</div>
          <div className="delta up">↑ vs yesterday</div>
        </div>
        <div className="stat">
          <div className="stat-top"><span className="label">Auto Distribution</span><span className="stat-icon"><Settings size={16} /></span></div>
          <div className="num">{data.autoDistributionRate}%</div>
          <div className="delta up">Rule based</div>
        </div>
        <div className="stat">
          <div className="stat-top"><span className="label">Available Staff</span><span className="stat-icon"><Users size={16} /></span></div>
          <div className="num">{data.availableStaff} / {data.totalStaff}</div>
          <div className="delta">{data.totalStaff - data.availableStaff} unavailable</div>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="card-head">
            <h3>Unassigned Leads Queue</h3>
            <span className="badge b-orange">{data.unassignedCount} waiting</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Lead</th><th>Interest</th><th>Source</th><th>Received</th><th>Priority</th><th></th></tr>
              </thead>
              <tbody>
                {data.unassignedLeads.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>All leads assigned</td></tr>
                ) : data.unassignedLeads.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="customer">
                        <span className="mini-avatar">{l.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        <b>{l.name}</b>
                      </div>
                    </td>
                    <td>{l.productInterest}</td>
                    <td>{l.source.replace(/_/g, ' ')}</td>
                    <td>{l.receivedAgo}</td>
                    <td><span className={`badge ${PRIORITY_CLASS[l.priority] ?? 'b-blue'}`}>{l.priority}</span></td>
                    <td><button className="btn-light btn-sm" onClick={() => openAssign(l.id)}>Assign</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Staff Workload</h3>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Live capacity</span>
          </div>
          <div className="card-body">
          {data.workload.filter(w => staff.find(s => s.id === w.id)?.role === 'RM').map(w => {
              const pct = Math.min(w.pct, 100)
              const barClass = pct >= 90 ? 'full' : pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low'
              const initials = w.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div className="workload-item" key={w.id}>
                  <div className="workload-header">
                    <div className="workload-name">
                      <span className="wi-avatar">{initials}</span>
                      {w.name}
                    </div>
                    <span className="workload-count">{w.load} / {w.cap} cases</span>
                  </div>
                  <div className="workload-bar">
                    <div className={`workload-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="workload-sub">
                    <span>{w.specialty}</span>
                    <span style={{ color: barClass === 'full' ? 'var(--danger)' : barClass === 'high' ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                      {w.availability}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <div>
            <h3>Distribution Strategy</h3>
            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)' }}>Configure how the platform decides who receives a new lead.</p>
          </div>
          <span className="badge b-green">Auto Distribution ON</span>
        </div>
        <div className="card-body">
          <div className="strategy-grid">
            {[
              { title: '1. Product Match', desc: 'Route investment, insurance and market leads to trained staff.' },
              { title: '2. Workload', desc: 'Prefer staff below their configured active-case capacity.' },
              { title: '3. Availability', desc: 'Skip unavailable or manually paused staff.' },
              { title: '4. Fairness', desc: 'Balance distribution so one staff member is not overloaded.' },
            ].map(s => (
              <div className="strategy-card" key={s.title}>
                <b>{s.title}</b><p>{s.desc}</p>
              </div>
            ))}
          </div>
          {data.unassignedCount > 0 && (
            <div style={{ marginTop: 16 }}>
              <button className="btn-primary btn-sm" onClick={distributeAll}>
                <Plus size={14} /> Auto-distribute all {data.unassignedCount} leads
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3>Recently Distributed</h3>
          <button className="btn-light btn-sm" onClick={() => showToast('Distribution history opened')}>View History</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Lead</th><th>Product</th><th>Assigned To</th><th>Method</th><th>Assigned At</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.history.map(h => (
                <tr key={h.id}>
                  <td>{h.leadName}</td>
                  <td>{h.productInterest}</td>
                  <td>{h.assignedToName}</td>
                  <td><span className={`badge ${h.method === 'AUTO' ? 'b-blue' : 'b-orange'}`}>{h.method === 'AUTO' ? 'Auto' : 'Manual'}</span></td>
                  <td>{formatTime(h.assignedAt)}</td>
                  <td><span className={`badge ${h.status === 'ACCEPTED' ? 'b-green' : 'b-orange'}`}>{h.status === 'ACCEPTED' ? 'Accepted' : 'Contact Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && data.unassignedLeads.length > 0 && (
        <DistributeModal
          leads={data.unassignedLeads}
          staff={staff}
          preselectedLeadId={selectedLead}
          onClose={() => setModal(false)}
          onSuccess={msg => { showToast(msg); router.refresh() }}
        />
      )}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
