'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus, updateApplicationNotes, requestDocuments } from '@backend/modules/applications/presentation/actions'
import { verifyDocument, rejectDocument } from '@backend/modules/documents/presentation/actions'
import { sendMessage } from '@backend/modules/messages/presentation/actions'
import type { ApplicationStatus } from '@shared/types/store-types'
import Link from 'next/link'
import { APPLICATION_STATUS_FLOW } from '@backend/infrastructure/mock-store/store'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'badge-green', PROCESSING: 'badge-blue', DOCUMENTS_REQUESTED: 'badge-yellow',
  DOCUMENTS_RECEIVED: 'badge-orange', SUBMITTED: 'badge-blue', APPROVED: 'badge-green',
  LEAD_CREATED: 'badge-gray', STAFF_ASSIGNED: 'badge-violet', PRODUCT_SELECTED: 'badge-violet',
  CUSTOMER_INTERESTED: 'badge-yellow', REJECTED: 'badge-red', RENEWAL_SCHEDULED: 'badge-green',
  VERIFIED: 'badge-green', UPLOADED: 'badge-blue', REQUESTED: 'badge-gray', UNDER_REVIEW: 'badge-yellow',
}

function Badge({ v }: { v: string }) {
  return <span className={`badge ${STATUS_COLORS[v] ?? 'badge-gray'}`}>{v.replace(/_/g, ' ')}</span>
}

const ALL_DOC_TYPES = ['PAN', 'Aadhaar', 'Passport', 'Driving License', 'Bank Statement', 'Cancelled Cheque', 'Photo', 'Medical Report', 'Income Proof', 'Address Proof', 'Marriage Certificate']

export function ApplicationDetailClient({ appData }: { appData: any }) {
  const { customer, staff, product, documents, messages, statusConfig, nextStatuses } = appData
  const [tab, setTab] = useState('overview')
  const [statusModal, setStatusModal] = useState(false)
  const [selectedNextStatus, setSelectedNextStatus] = useState<ApplicationStatus | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [notes, setNotes] = useState(appData.notes)
  const [editingNotes, setEditingNotes] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [rejectDocId, setRejectDocId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [requestDocModal, setRequestDocModal] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [, startT] = useTransition()
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const currentIdx = APPLICATION_STATUS_FLOW.indexOf(appData.status)

  function handleStatusUpdate() {
    if (!selectedNextStatus) return
    startT(async () => {
      await updateApplicationStatus(appData.id, selectedNextStatus, staff?.name ?? 'Staff', statusNote)
      setStatusModal(false); setStatusNote(''); setSelectedNextStatus(null)
      showToast('Status updated successfully')
      router.refresh()
    })
  }

  function handleSaveNotes() {
    startT(async () => {
      await updateApplicationNotes(appData.id, notes)
      setEditingNotes(false); showToast('Notes saved')
      router.refresh()
    })
  }

  function handleSendMsg(e: React.FormEvent) {
    e.preventDefault()
    if (!msgText.trim()) return
    startT(async () => {
      await sendMessage(appData.id, 'staff', staff?.id ?? 's1', staff?.name ?? 'Staff', msgText)
      setMsgText(''); showToast('Message sent'); router.refresh()
    })
  }

  function handleVerify(docId: string) {
    startT(async () => {
      await verifyDocument(docId, staff?.name ?? 'Staff')
      showToast('Document verified'); router.refresh()
    })
  }

  function handleReject() {
    if (!rejectDocId || !rejectReason.trim()) return
    startT(async () => {
      await rejectDocument(rejectDocId, rejectReason, staff?.name ?? 'Staff')
      setRejectDocId(null); setRejectReason(''); showToast('Document rejected'); router.refresh()
    })
  }

  function handleRequestDocs() {
    if (selectedDocs.length === 0) return
    startT(async () => {
      await requestDocuments(appData.id, selectedDocs)
      setRequestDocModal(false); setSelectedDocs([]); showToast('Documents requested'); router.refresh()
    })
  }

  const pendingWith = appData.pendingWith
  const pendingColor = pendingWith === 'Customer' ? '#f4b74c' : pendingWith === 'Provider' ? '#7251e8' : 'var(--green)'

  return (
    <div className="content">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        <Link href="/applications" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Applications</Link>
        <span>›</span><span style={{ color: 'var(--ink)' }}>APP-{appData.id}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-1px' }}>APP-{appData.id}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge v={appData.status} />
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Customer: <strong style={{ color: 'var(--ink)' }}>{customer?.name}</strong></span>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>RM: <strong style={{ color: 'var(--ink)' }}>{staff?.name}</strong></span>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Product: <strong style={{ color: 'var(--ink)' }}>{product?.name}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {nextStatuses.length > 0 && (
            <button className="primary" onClick={() => setStatusModal(true)}>Update Status</button>
          )}
        </div>
      </div>

      {/* Status Timeline Bar */}
      <div className="status-bar">
        {APPLICATION_STATUS_FLOW.filter(s => s !== 'REJECTED').map((s, i) => {
          const isDone = APPLICATION_STATUS_FLOW.indexOf(s) < currentIdx
          const isCurrent = s === appData.status
          return (
            <div key={s} className={`status-bar-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              {statusConfig[s]?.label ?? s}
            </div>
          )
        })}
      </div>

      {/* Pending With Box */}
      <div className="pending-box">
        <div className="pending-box-icon" style={{ background: pendingColor }}>
          {pendingWith === 'Customer' ? '👤' : pendingWith === 'Provider' ? '🏦' : '✅'}
        </div>
        <div className="pending-box-body">
          <p>Pending With</p>
          <strong>{pendingWith}</strong>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Next Action</p>
          <strong style={{ fontSize: 14 }}>{appData.nextAction}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'documents', 'messages', 'timeline'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'documents' && ` (${documents.length})`}
            {t === 'messages' && ` (${messages.length})`}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Application Details</h3>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="info-row"><span className="info-label">Customer</span><Link href={`/customers/${customer?.id}`} style={{ color: 'var(--green)', fontWeight: 600 }}>{customer?.name}</Link></div>
              <div className="info-row"><span className="info-label">Staff (RM)</span><span className="info-value">{staff?.name} ({staff?.role})</span></div>
              <div className="info-row"><span className="info-label">Product</span><span className="info-value">{product?.name}</span></div>
              <div className="info-row"><span className="info-label">Category</span><span className="info-value">{product?.category}</span></div>
              <div className="info-row"><span className="info-label">Created</span><span className="info-value">{fmtDate(appData.createdAt)}</span></div>
              <div className="info-row"><span className="info-label">Updated</span><span className="info-value">{fmtDate(appData.updatedAt)}</span></div>
              {appData.renewalDate && <div className="info-row"><span className="info-label">Renewal Date</span><span className="info-value">{fmtDate(appData.renewalDate)}</span></div>}
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Notes</h3>
              {!editingNotes && <button className="btn-ghost btn-sm" onClick={() => setEditingNotes(true)}>Edit</button>}
            </div>
            {editingNotes ? (
              <>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', minHeight: 120, border: '1px solid var(--line)', borderRadius: 9, padding: 12, fontSize: 14, resize: 'vertical', outline: 0 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="primary btn-sm" onClick={handleSaveNotes}>Save</button>
                  <button className="btn-ghost btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <p style={{ color: notes ? 'var(--ink)' : 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{notes || 'No notes added.'}</p>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="primary btn-sm" onClick={() => setRequestDocModal(true)}>+ Request Documents</button>
          </div>
          <div className="doc-grid">
            {documents.length === 0 ? (
              <div className="empty-state"><h3>No documents</h3><p>Request documents from the customer to begin.</p></div>
            ) : documents.map((d: any) => (
              <div key={d.id} className="doc-row">
                <div className="doc-row-icon">{d.status === 'VERIFIED' ? '✅' : d.status === 'REJECTED' ? '❌' : d.status === 'UPLOADED' ? '📄' : '📋'}</div>
                <div className="doc-row-body">
                  <h4>{d.name}</h4>
                  <p>
                    {d.fileName && <>{d.fileName} · </>}
                    {d.status === 'REJECTED' && d.rejectionReason && <span style={{ color: '#db6268' }}>{d.rejectionReason} · </span>}
                    {d.requestedAt ? fmtDate(d.requestedAt) : ''}
                  </p>
                </div>
                <Badge v={d.status} />
                {(d.status === 'UPLOADED' || d.status === 'UNDER_REVIEW') && (
                  <div className="doc-actions">
                    <button className="outline-btn btn-sm" onClick={() => handleVerify(d.id)}>✓ Verify</button>
                    <button className="outline-btn btn-sm danger" onClick={() => setRejectDocId(d.id)}>✗ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div className="card">
          <div className="msg-thread">
            {messages.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>No messages yet. Start the conversation.</p>}
            {messages.map((m: any) => (
              <div key={m.id} className={`msg-bubble ${m.fromRole}`}>
                <div className="msg-text">{m.content}</div>
                <div className="msg-meta">{m.fromName} · {new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message to the customer…"
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 9, padding: '10px 14px', fontSize: 14 }} />
            <button type="submit" className="primary" disabled={!msgText.trim()}>Send</button>
          </form>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="card">
          <div className="timeline">
            {appData.statusHistory.map((h: any, i: number) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot">
                  <div className="timeline-circle done">✓</div>
                  {i < appData.statusHistory.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-body">
                  <h4>{h.status.replace(/_/g, ' ')}</h4>
                  <p>{h.note}</p>
                  <small>{h.performedBy} · {new Date(h.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setStatusModal(false)}>
          <div className="modal">
            <h2>Update Application Status</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Select next status</label>
                <select value={selectedNextStatus ?? ''} onChange={e => setSelectedNextStatus(e.target.value as ApplicationStatus)}>
                  <option value="">Choose status…</option>
                  {nextStatuses.map((s: ApplicationStatus) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Add a note about this status change…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setStatusModal(false)}>Cancel</button>
              <button className="primary" onClick={handleStatusUpdate} disabled={!selectedNextStatus}>Update Status</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectDocId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectDocId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2>Reject Document</h2>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why the document is rejected…" />
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setRejectDocId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Documents Modal */}
      {requestDocModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRequestDocModal(false)}>
          <div className="modal">
            <h2>Request Documents</h2>
            <p className="muted" style={{ marginBottom: 16 }}>Select documents to request from the customer.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ALL_DOC_TYPES.map(dt => (
                <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes(dt)} onChange={e => {
                    setSelectedDocs(e.target.checked ? [...selectedDocs, dt] : selectedDocs.filter(d => d !== dt))
                  }} />
                  {dt}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setRequestDocModal(false)}>Cancel</button>
              <button className="primary" onClick={handleRequestDocs} disabled={selectedDocs.length === 0}>Request {selectedDocs.length > 0 ? `(${selectedDocs.length})` : ''}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
