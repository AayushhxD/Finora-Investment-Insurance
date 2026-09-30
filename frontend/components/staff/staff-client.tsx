'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStaff, listStaff, updateStaff, updateStaffStatus } from '@backend/modules/staff/presentation/actions'
import { grantEmployeeRole } from '@backend/modules/customers/presentation/actions'
import type { Staff, StaffRole } from '@shared/types/store-types'
import { Plus, Search, Pencil, UserCheck, X, Power } from 'lucide-react'

type StaffAccount = { id: string; name: string; email: string }
type StaffStats = { total: number; active: number; inactive: number; relationshipManagers: number; managers: number; admins: number }

function StaffModal({ staff, accounts, onClose }: { staff?: Staff | null; accounts: StaffAccount[]; onClose: () => void }) {
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    startSaving(async () => {
      try {
        if (staff) await updateStaff(staff.id, data)
        else await createStaff(data)
        router.refresh()
        onClose()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not save staff profile')
      }
    })
  }

  return (
    <div className="modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <b>{staff ? 'Edit Staff Profile' : 'Add Staff Profile'}</b>
            <p>{staff ? 'Update employment details. Login identity and role are managed separately.' : 'Link an existing login account to an employee profile.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="modal-section">
              <div className="modal-section-title">Account</div>
              {staff ? <p>{staff.name} · {staff.email}</p> : (
                <div className="form-group">
                  <label htmlFor="staff-user">Existing User Account <span className="req">*</span></label>
                  <select id="staff-user" name="userId" required defaultValue="">
                    <option value="">Select an account</option>
                    {accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {account.email}</option>)}
                  </select>
                  {accounts.length === 0 && <small>Create the employee login first, then link it here.</small>}
                </div>
              )}
            </div>
            <div className="modal-section">
              <div className="modal-section-title">Employment Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee-code">Employee Code <span className="req">*</span></label>
                  <input id="employee-code" name="employeeCode" required defaultValue={staff?.employeeCode} placeholder="FIN-0042" />
                </div>
                <div className="form-group">
                  <label htmlFor="designation">Designation <span className="req">*</span></label>
                  <input id="designation" name="designation" required defaultValue={staff?.designation} placeholder="Relationship Manager" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input id="department" name="department" defaultValue={staff?.department ?? ''} placeholder="Advisory" />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Work Phone</label>
                  <input id="phone" name="phone" defaultValue={staff?.phone ?? ''} placeholder="9876543210" />
                </div>
              </div>
            </div>
            {error && <p className="form-error-msg">{error}</p>}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={saving || (!staff && accounts.length === 0)}>
              {saving ? 'Saving…' : staff ? 'Save Changes' : 'Add Staff Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffClient({
  staff: initialStaff,
  stats: initialStats,
  total: initialTotal,
  accounts,
  canManage,
  canGrantRoles,
  customers,
  applications,
}: {
  staff: Staff[]
  stats: StaffStats
  total: number
  accounts: StaffAccount[]
  canManage: boolean
  canGrantRoles: boolean
  customers: any[]
  applications: any[]
}) {
  const [staff, setStaff] = useState(initialStaff)
  const [stats, setStats] = useState(initialStats)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [statusTarget, setStatusTarget] = useState<Staff | null>(null)
  const [toast, setToast] = useState('')
  const [loading, startLoading] = useTransition()
  const [, startSaving] = useTransition()
  const router = useRouter()

  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => startLoading(async () => {
      const result = await listStaff({ page, limit: 20, search, role: roleFilter || undefined, status: statusFilter || undefined })
      if (!active) return
      setStaff(result.items)
      setTotal(result.total)
      setStats(result.stats)
    }), 200)
    return () => { active = false; clearTimeout(timer) }
  }, [page, roleFilter, search, statusFilter])

  function changeStatus() {
    if (!statusTarget) return
    const nextStatus = statusTarget.status === 'active' ? 'inactive' : 'active'
    startSaving(async () => {
      try {
        await updateStaffStatus(statusTarget.id, nextStatus)
        setStatusTarget(null)
        showToast(nextStatus === 'active' ? 'Staff member activated' : 'Staff member deactivated')
        router.refresh()
      } catch (cause) {
        showToast(cause instanceof Error ? cause.message : 'Could not update staff status')
      }
    })
  }

  function changeRole(member: Staff, role: StaffRole) {
    startSaving(async () => {
      try {
        await grantEmployeeRole(member.id, role)
        showToast('Employee role updated')
        router.refresh()
      } catch (cause) {
        showToast(cause instanceof Error ? cause.message : 'Could not update employee role')
      }
    })
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Staff</h1><p className="muted">{total} team members</p></div>
        {canManage && <button className="primary" onClick={() => setModal('add')}><Plus size={16} />Add Staff</button>}
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <article><span>TOTAL STAFF</span><strong>{stats.total}</strong></article>
        <article><span>ACTIVE</span><strong>{stats.active}</strong></article>
        <article><span>RELATIONSHIP MANAGERS</span><strong>{stats.relationshipManagers}</strong></article>
        <article><span>MANAGERS</span><strong>{stats.managers}</strong></article>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Search code, name, or email…" /></div>
          <div className="tbl-filters">
            <select className="tbl-filter-select" value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setPage(1) }}>
              <option value="">All Roles</option><option value="RM">RM</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
            </select>
            <select className="tbl-filter-select" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }}>
              <option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="empty-state"><UserCheck size={40} /><h3>No staff found</h3></div>
        ) : (
          <table>
            <thead><tr><th>EMPLOYEE</th><th>DESIGNATION</th><th>CONTACT</th><th>ROLE</th><th>CUSTOMERS</th><th>APPLICATIONS</th><th>STATUS</th><th>JOINED</th><th></th></tr></thead>
            <tbody>{staff.map(member => {
              const assignedCustomerIds = new Set(customers.filter(customer => customer.assignedStaffId === member.id).map(customer => customer.id))
              const customerCount = assignedCustomerIds.size
              const applicationCount = applications.filter(application => assignedCustomerIds.has(application.customerId)).length
              return (
                <tr key={member.id}>
                  <td><div className="td-name">{member.name}</div><div className="td-muted">{member.employeeCode} · {member.email}</div></td>
                  <td><div>{member.designation}</div><div className="td-muted">{member.department || '—'}</div></td>
                  <td className="td-muted">{member.phone || '—'}</td>
                  <td>{canGrantRoles ? (
                    <select aria-label={`Role for ${member.name}`} value={member.role} onChange={event => changeRole(member, event.target.value as StaffRole)}>
                      <option value="RM">RM</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
                    </select>
                  ) : <span className={`badge ${member.role === 'Admin' ? 'badge-violet' : member.role === 'Manager' ? 'badge-blue' : 'badge-green'}`}>{member.role}</span>}</td>
                  <td style={{ fontWeight: 600 }}>{customerCount}</td>
                  <td style={{ fontWeight: 600 }}>{applicationCount}</td>
                  <td><span className={`badge ${member.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{member.status}</span></td>
                  <td className="td-muted">{fmtDate(member.joinedAt)}</td>
                  <td><div className="td-actions">
                    {canManage && <button className="btn-ghost btn-sm" title="Edit staff profile" onClick={() => { setEditStaff(member); setModal('edit') }}><Pencil size={15} /></button>}
                    {canManage && <button className="btn-ghost btn-sm" title={member.status === 'active' ? 'Deactivate staff' : 'Activate staff'} onClick={() => setStatusTarget(member)}><Power size={15} /></button>}
                  </div></td>
                </tr>
              )
            })}</tbody>
          </table>
        )}

        {totalPages > 1 && <div className="tbl-pagination">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="tbl-pages">
            <button disabled={page === 1 || loading} onClick={() => setPage(current => current - 1)}>‹</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages || loading} onClick={() => setPage(current => current + 1)}>›</button>
          </div>
        </div>}
      </div>

      {(modal === 'add' || modal === 'edit') && <StaffModal staff={modal === 'edit' ? editStaff : null} accounts={accounts} onClose={() => { setModal(null); setEditStaff(null) }} />}

      {statusTarget && <div className="modal-overlay" onClick={event => event.target === event.currentTarget && setStatusTarget(null)}>
        <div className="modal" style={{ maxWidth: 400 }}>
          <h2>{statusTarget.status === 'active' ? 'Deactivate Staff Member?' : 'Reactivate Staff Member?'}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{statusTarget.status === 'active' ? 'The employee and assigned customer history will be preserved. They will no longer be eligible for new assignments.' : 'This employee can receive new assignments again.'}</p>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setStatusTarget(null)}>Cancel</button>
            <button className={statusTarget.status === 'active' ? 'btn-danger' : 'primary'} onClick={changeStatus}>{statusTarget.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
          </div>
        </div>
      </div>}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
