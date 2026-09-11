'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStaff, updateStaff, deleteStaff } from '@/app/actions/staff'
import type { Staff } from '@/lib/store-types'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Eye, UserCheck, X } from 'lucide-react'

function StaffModal({ staff: s, onClose }: { staff?: Staff | null; onClose: () => void }) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    startT(async () => {
      try {
        if (s) { await updateStaff(s.id, data) } else { await createStaff(data) }
        router.refresh(); onClose()
      } catch (ex: any) { setErr(ex.message) }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <b>{s ? 'Edit Staff' : 'Add Staff Member'}</b>
            <p>{s ? 'Update staff profile and permissions.' : 'Add a new member to your CRM team.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Staff Details */}
            <div className="modal-section">
              <div className="modal-section-title">Personal Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input name="name" required defaultValue={s?.name} placeholder="e.g. Priya Shah" />
                </div>
                <div className="form-group">
                  <label>Email <span className="req">*</span></label>
                  <input name="email" type="email" required defaultValue={s?.email} placeholder="priya@finora.in" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone <span className="req">*</span></label>
                  <input name="phone" required defaultValue={s?.phone} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label>Role <span className="req">*</span></label>
                  <select name="role" defaultValue={s?.role ?? 'RM'}>
                    <option value="RM">👨‍💼 RM (Relationship Manager)</option>
                    <option value="Manager">👩‍💼 Manager</option>
                    <option value="Admin">🛡️ Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="modal-section">
              <div className="modal-section-title">Employment Info</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Join Date <span className="req">*</span></label>
                  <input name="joinedAt" type="date" required defaultValue={s?.joinedAt} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={s?.status ?? 'active'}>
                    <option value="active">🟢 Active</option>
                    <option value="inactive">⚪ Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {err && <p className="form-error-msg">⚠ {err}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">
              {s ? '✓ Save Changes' : '＋ Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffClient({ staff, customers, applications }: { staff: Staff[], customers: any[], applications: any[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = staff.filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || s.role === roleFilter) &&
    (!statusFilter || s.status === statusFilter)
  )

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Staff</h1><p className="muted">{staff.length} team members</p></div>
        <button className="primary" onClick={() => setModal('add')}><Plus size={16} />Add Staff</button>
      </div>

      {/* Stats Row */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <article><span>TOTAL STAFF</span><strong>{staff.length}</strong></article>
        <article><span>ACTIVE</span><strong>{staff.filter(s => s.status === 'active').length}</strong></article>
        <article><span>RELATIONSHIP MANAGERS</span><strong>{staff.filter(s => s.role === 'RM').length}</strong></article>
        <article><span>MANAGERS</span><strong>{staff.filter(s => s.role === 'Manager').length}</strong></article>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…" /></div>
          <div className="tbl-filters">
            <select className="tbl-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="RM">RM</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
            </select>
            <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><UserCheck size={40} /><h3>No staff found</h3></div>
        ) : (
          <table>
            <thead><tr><th>NAME</th><th>CONTACT</th><th>ROLE</th><th>CUSTOMERS</th><th>APPLICATIONS</th><th>STATUS</th><th>JOINED</th><th></th></tr></thead>
            <tbody>
              {filtered.map(s => {
                const custCount = customers.filter(c => c.assignedStaffId === s.id).length
                const appCount = applications.filter(a => a.staffId === s.id).length
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e7f8ef', display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>{s.name[0]}</div>
                        <div><div className="td-name">{s.name}</div><div className="td-muted">{s.email}</div></div>
                      </div>
                    </td>
                    <td className="td-muted">{s.phone}</td>
                    <td><span className={`badge ${s.role === 'Admin' ? 'badge-violet' : s.role === 'Manager' ? 'badge-blue' : 'badge-green'}`}>{s.role}</span></td>
                    <td style={{ fontWeight: 600 }}>{custCount}</td>
                    <td style={{ fontWeight: 600 }}>{appCount}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                    <td className="td-muted">{fmtDate(s.joinedAt)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-ghost btn-sm" onClick={() => { setEditStaff(s); setModal('edit') }}><Pencil size={15} /></button>
                        <button className="btn-ghost btn-sm" style={{ color: '#db6268' }} onClick={() => setDeleteId(s.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <StaffModal staff={modal === 'edit' ? editStaff : null} onClose={() => { setModal(null); setEditStaff(null) }} />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2>Delete Staff Member?</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>This cannot be undone. Customers assigned to this staff member will need to be reassigned.</p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => startT(async () => { await deleteStaff(deleteId); setDeleteId(null); showToast('Staff deleted'); router.refresh() })}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
