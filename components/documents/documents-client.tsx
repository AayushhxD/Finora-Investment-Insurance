'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { verifyDocument, rejectDocument } from '@/app/actions/documents'
import Link from 'next/link'
import { Search, FileText } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: 'badge-green', REJECTED: 'badge-red', UPLOADED: 'badge-blue', REQUESTED: 'badge-gray', UNDER_REVIEW: 'badge-yellow'
}

export default function DocumentsClient({ documents }: { documents: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectDocId, setRejectDocId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = documents.filter(d =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.customerName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  )

  function handleVerify(docId: string) {
    startT(async () => { await verifyDocument(docId, 'Staff'); showToast('Verified'); router.refresh() })
  }

  function handleReject() {
    if (!rejectDocId || !rejectReason.trim()) return
    startT(async () => {
      await rejectDocument(rejectDocId, rejectReason, 'Staff')
      setRejectDocId(null); setRejectReason(''); showToast('Rejected'); router.refresh()
    })
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Documents</h1><p className="muted">{documents.length} total documents</p></div>
      </div>

      {/* Stats */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 20 }}>
        {['REQUESTED','UPLOADED','UNDER_REVIEW','VERIFIED','REJECTED'].map(s => (
          <article key={s}><span>{s}</span><strong>{documents.filter(d => d.status === s).length}</strong></article>
        ))}
      </div>

      <div className="tbl-wrap">
        <div className="tbl-top">
          <div className="tbl-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" /></div>
          <div className="tbl-filters">
            <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['REQUESTED','UPLOADED','UNDER_REVIEW','VERIFIED','REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><FileText size={40} /><h3>No documents found</h3></div>
        ) : (
          <table>
            <thead><tr><th>DOCUMENT</th><th>CUSTOMER</th><th>APPLICATION</th><th>STATUS</th><th>UPLOADED</th><th></th></tr></thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d.id}>
                  <td><div className="td-name">{d.name}</div><div className="td-muted">{d.docType}</div></td>
                  <td>{d.customerName}</td>
                  <td><Link href={`/applications/${d.applicationId}`} style={{ color: 'var(--green)', fontWeight: 600 }}>APP-{d.applicationId}</Link></td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[d.status] ?? 'badge-gray'}`}>{d.status}</span>
                    {d.rejectionReason && <div style={{ fontSize: 11, color: '#db6268', marginTop: 3 }}>{d.rejectionReason}</div>}
                  </td>
                  <td className="td-muted">{d.uploadedAt ? fmtDate(d.uploadedAt) : '—'}</td>
                  <td>
                    <div className="td-actions">
                      {(d.status === 'UPLOADED' || d.status === 'UNDER_REVIEW') && (
                        <>
                          <button className="outline-btn btn-sm" onClick={() => handleVerify(d.id)}>✓ Verify</button>
                          <button className="outline-btn btn-sm danger" onClick={() => setRejectDocId(d.id)}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectDocId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectDocId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2>Reject Document</h2>
            <div className="form-group"><label>Rejection Reason *</label><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setRejectDocId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
