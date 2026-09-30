'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer, updateCustomer, deleteCustomer } from '@backend/modules/customers/presentation/actions'
import type { Customer, Staff } from '@shared/types/store-types'
import Link from 'next/link'
import { Plus, Search, Users, Pencil, Trash2, Eye, Filter, ChevronUp, ChevronDown, ExternalLink, X } from 'lucide-react'

const PAGE_SIZE = 10

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { active: 'badge-green', inactive: 'badge-gray', prospect: 'badge-yellow' }
  return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>
}

function CustomerModal({ customer, staff, onClose }: {
  customer?: Customer | null
  staff: Staff[]
  onClose: () => void
}) {
  const [loading, startT] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    startT(async () => {
      try {
        if (customer) {
          await updateCustomer(customer.id, data)
        } else {
          await createCustomer(data)
        }
        router.refresh()
        onClose()
      } catch (e: any) {
        setErr(e.message ?? 'Validation error')
      }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <b>{customer ? 'Edit Customer' : 'Add New Customer'}</b>
            <p>{customer ? 'Update customer details and status.' : 'Register a new customer profile.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            
            {/* Personal Details */}
            <div className="modal-section">
              <div className="modal-section-title">Personal Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input name="name" required defaultValue={customer?.name} placeholder="Raj Patil" />
                </div>
                <div className="form-group">
                  <label>Email <span className="req">*</span></label>
                  <input name="email" type="email" required defaultValue={customer?.email} placeholder="raj@example.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone <span className="req">*</span></label>
                  <input name="phone" required defaultValue={customer?.phone} placeholder="9800001111" minLength={10} />
                </div>
                <div className="form-group">
                  <label>Date of Birth <span className="req">*</span></label>
                  <input name="dob" type="date" required defaultValue={customer?.dob} />
                </div>
              </div>
            </div>

            {/* Contact & KYC */}
            <div className="modal-section">
              <div className="modal-section-title">Contact &amp; KYC</div>
              <div className="form-group">
                <label>Address <span className="req">*</span></label>
                <input name="address" required defaultValue={customer?.address} placeholder="12, MG Road" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City <span className="req">*</span></label>
                  <input name="city" required defaultValue={customer?.city} placeholder="Pune" />
                </div>
                <div className="form-group">
                  <label>PAN Number <span className="req">*</span></label>
                  <input name="panNumber" required defaultValue={customer?.panNumber} placeholder="ABCDE1234F" maxLength={10} minLength={10} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="modal-section">
              <div className="modal-section-title">Account Settings</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assigned Staff <span className="req">*</span></label>
                  <select name="assignedStaffId" required defaultValue={customer?.assignedStaffId ?? staff[0]?.id ?? ''}>
                    <option value="">Select staff member</option>
                    {staff.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={customer?.status ?? 'active'}>
                    <option value="active">🟢 Active</option>
                    <option value="prospect">🟡 Prospect</option>
                    <option value="inactive">⚪ Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {err && <p className="form-error-msg">⚠ {err}</p>}
          </div>
          
          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving…' : customer ? '✓ Save Changes' : '＋ Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CustomersClient({ customers, staff }: { customers: Customer[], staff: Staff[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = customers
    .filter(c =>
      (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) &&
      (!statusFilter || c.status === statusFilter) &&
      (!staffFilter || c.assignedStaffId === staffFilter)
    )
    .sort((a, b) => {
      const va = sortBy === 'name' ? a.name : a.createdAt
      const vb = sortBy === 'name' ? b.name : b.createdAt
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(col: 'name' | 'createdAt') {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: string }) => sortBy === col
    ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
    : null

  async function handleDelete(id: string) {
    startT(async () => {
      await deleteCustomer(id)
      setDeleteId(null)
      showToast('Customer deleted')
      router.refresh()
    })
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customers</h1>
          <p className="muted">{customers.length} total customers</p>
        </div>
        <button className="primary" onClick={() => setModal('add')}>
          <Plus size={16} />Add Customer
        </button>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search">
            <Search size={15} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, email, phone…" />
          </div>
          <div className="tbl-filters">
            <select className="tbl-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="inactive">Inactive</option>
            </select>
            <select className="tbl-filter-select" value={staffFilter} onChange={e => { setStaffFilter(e.target.value); setPage(1) }}>
              <option value="">All Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No customers found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="primary" onClick={() => setModal('add')}><Plus size={16} />Add Customer</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>NAME <SortIcon col="name" /></th>
                <th>CONTACT</th>
                <th>ASSIGNED STAFF</th>
                <th>STATUS</th>
                <th onClick={() => toggleSort('createdAt')} style={{ cursor: 'pointer' }}>JOINED <SortIcon col="createdAt" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => {
                const assignedStaff = staff.find(s => s.id === c.assignedStaffId)
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="td-name">{c.name}</div>
                      <div className="td-muted">{c.city}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 14 }}>{c.email}</div>
                      <div className="td-muted">{c.phone}</div>
                    </td>
                    <td>
                      {assignedStaff ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e7f8ef', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>
                            {assignedStaff.name[0]}
                          </div>
                          <span style={{ fontSize: 14 }}>{assignedStaff.name}</span>
                        </div>
                      ) : <span className="td-muted">Unassigned</span>}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="td-muted">{fmtDate(c.createdAt)}</td>
                    <td>
                      <div className="td-actions">
                        <Link href={`/customers/${c.id}`}>
                          <button className="btn-ghost btn-sm" title="View"><Eye size={15} /></button>
                        </Link>
                        <button className="btn-ghost btn-sm" title="Edit" onClick={() => { setEditCustomer(c); setModal('edit') }}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn-ghost btn-sm" title="Delete" style={{ color: '#db6268' }} onClick={() => setDeleteId(c.id)}>
                          <Trash2 size={15} />
                        </button>
                        <a href={`/portal/${c.id}`} target="_blank" rel="noreferrer">
                          <button className="btn-ghost btn-sm" title="Customer Portal"><ExternalLink size={15} /></button>
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="tbl-pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="tbl-pages">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <CustomerModal
          customer={modal === 'edit' ? editCustomer : null}
          staff={staff}
          onClose={() => { setModal(null); setEditCustomer(null) }}
        />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2>Delete Customer?</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>This will permanently delete this customer and cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
