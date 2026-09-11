'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication } from '@/app/actions/applications'
import type { Customer, Staff, Product } from '@/lib/store-types'
import Link from 'next/link'
import { Plus, Search, Filter, FileText, ChevronDown, ChevronUp, X } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'badge-green', PROCESSING: 'badge-blue', DOCUMENTS_REQUESTED: 'badge-yellow',
  DOCUMENTS_RECEIVED: 'badge-orange', SUBMITTED: 'badge-blue', APPROVED: 'badge-green',
  LEAD_CREATED: 'badge-gray', STAFF_ASSIGNED: 'badge-violet', PRODUCT_SELECTED: 'badge-violet',
  CUSTOMER_INTERESTED: 'badge-yellow', REJECTED: 'badge-red', RENEWAL_SCHEDULED: 'badge-green',
}

const PAGE_SIZE = 10

function NewAppModal({ customers, staff, products, onClose }: any) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    startT(async () => {
      try {
        const res = await createApplication(data)
        router.push(`/applications/${res.id}`)
        onClose()
      } catch (ex: any) { setErr(ex.message) }
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <b>Create New Application</b>
            <p>Start a new application process for a customer.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="modal-section">
              <div className="modal-section-title">Application Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer <span className="req">*</span></label>
                  <select name="customerId" required>
                    <option value="">Select customer…</option>
                    {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned RM <span className="req">*</span></label>
                  <select name="staffId" required>
                    <option value="">Select staff…</option>
                    {staff.filter((s: Staff) => s.status === 'active').map((s: Staff) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Product <span className="req">*</span></label>
                <select name="productId" required>
                  <option value="">Select product…</option>
                  {products.filter((p: Product) => p.status === 'active').map((p: Product) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Initial Notes</label>
                <textarea name="notes" placeholder="Add any initial context about this application…" />
              </div>
            </div>

            {err && <p className="form-error-msg">⚠ {err}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Create Application →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ApplicationsClient({ applications, customers, staff, products }: {
  applications: any[]
  customers: Customer[]
  staff: Staff[]
  products: Product[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingFilter, setPendingFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = applications.filter(a =>
    (!search || a.customerName.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search) || a.productName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || a.status === statusFilter) &&
    (!pendingFilter || a.pendingWith === pendingFilter) &&
    (!staffFilter || a.staffId === staffFilter)
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Applications</h1>
          <p className="muted">{applications.length} total applications</p>
        </div>
        <button className="primary" onClick={() => setShowNewModal(true)}><Plus size={16} />New Application</button>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search">
            <Search size={15} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by customer, ID, product…" />
          </div>
          <div className="tbl-filters">
            <select className="tbl-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              {['LEAD_CREATED','STAFF_ASSIGNED','PRODUCT_SELECTED','CUSTOMER_INTERESTED','DOCUMENTS_REQUESTED','DOCUMENTS_RECEIVED','SUBMITTED','PROCESSING','APPROVED','COMPLETED','RENEWAL_SCHEDULED','REJECTED'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select className="tbl-filter-select" value={pendingFilter} onChange={e => { setPendingFilter(e.target.value); setPage(1) }}>
              <option value="">All Pending</option>
              <option value="Customer">Pending Customer</option>
              <option value="Staff">Pending Staff</option>
              <option value="Provider">Pending Provider</option>
            </select>
            <select className="tbl-filter-select" value={staffFilter} onChange={e => { setStaffFilter(e.target.value); setPage(1) }}>
              <option value="">All Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <h3>No applications found</h3>
            <p>Create a new application to get started.</p>
            <button className="primary" onClick={() => setShowNewModal(true)}><Plus size={16} />New Application</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>APP ID</th>
                <th>CUSTOMER</th>
                <th>PRODUCT</th>
                <th>STAFF (RM)</th>
                <th>STATUS</th>
                <th>PENDING WITH</th>
                <th>UPDATED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700 }}>APP-{a.id}</td>
                  <td>
                    <Link href={`/customers/${a.customerId}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}>{a.customerName}</Link>
                  </td>
                  <td>
                    <div style={{ fontSize: 14 }}>{a.productName}</div>
                    <div className="td-muted">{a.productCategory}</div>
                  </td>
                  <td className="td-muted">{a.staffName}</td>
                  <td><span className={`badge ${STATUS_COLORS[a.status] ?? 'badge-gray'}`}>{a.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                      background: a.pendingWith === 'Customer' ? '#fff8e6' : a.pendingWith === 'Provider' ? '#f0ecff' : '#e7f8ef',
                      color: a.pendingWith === 'Customer' ? '#c49320' : a.pendingWith === 'Provider' ? '#6641c8' : '#1d9b5e'
                    }}>{a.pendingWith}</span>
                  </td>
                  <td className="td-muted">{fmtDate(a.updatedAt)}</td>
                  <td>
                    <Link href={`/applications/${a.id}`}><button className="btn-ghost btn-sm">View →</button></Link>
                  </td>
                </tr>
              ))}
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

      {showNewModal && (
        <NewAppModal customers={customers} staff={staff} products={products} onClose={() => setShowNewModal(false)} />
      )}
    </div>
  )
}
