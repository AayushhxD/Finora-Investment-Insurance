'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument } from '@backend/modules/documents/presentation/actions'
import { FileText, Upload, Plus, X } from 'lucide-react'
import { fmtDate } from '@/lib/fmt-date'

export default function PortalDocuments({ docs, customerId }: { docs: any[], customerId: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, startT] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    startT(async () => {
      try {
        await createDocument(customerId, data as any)
        setModalOpen(false)
        router.refresh()
      } catch (ex: any) {
        setErr(ex.message)
      }
    })
  }

  return (
    <div className="portal-content">
      <div className="portal-header">
        <div>
          <h2>My Documents</h2>
          <p>Upload and manage your required documents</p>
        </div>
        <button className="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Upload Document
        </button>
      </div>

      <div className="portal-grid">
        {docs.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <h3>No documents uploaded</h3>
            <p>Upload your KYC or required application documents here.</p>
          </div>
        ) : (
          docs.map(doc => (
            <div key={doc.id} className="portal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{doc.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{doc.docType}</p>
                </div>
                <span className={`badge badge-${doc.status === 'VERIFIED' ? 'green' : doc.status === 'REJECTED' ? 'red' : 'yellow'}`}>
                  {doc.status}
                </span>
              </div>
              
              {doc.rejectionReason && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                  <strong>Rejected:</strong> {doc.rejectionReason}
                </div>
              )}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                <span>Uploaded: {doc.uploadedAt ? fmtDate(doc.uploadedAt) : '—'}</span>
                {doc.fileName && <span>{doc.fileName}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <b>Upload Document</b>
                <p>Upload a new document to your profile</p>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Document Name <span className="req">*</span></label>
                  <input name="name" required placeholder="e.g. PAN Card Front" />
                </div>
                <div className="form-group">
                  <label>Document Type <span className="req">*</span></label>
                  <select name="docType" required>
                    <option value="">Select type...</option>
                    <option value="PAN">PAN Card</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="INCOME_PROOF">Income Proof</option>
                    <option value="PHOTOGRAPH">Photograph</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Application ID (Optional)</label>
                  <input name="applicationId" placeholder="Link to a specific application" />
                </div>
                
                {/* Fake file input for UI demo purposes */}
                <div className="form-group">
                  <label>File Upload <span className="req">*</span></label>
                  <div style={{ border: '2px dashed var(--line)', padding: 30, textAlign: 'center', borderRadius: 10, background: 'var(--soft2)', cursor: 'pointer' }}>
                    <Upload size={24} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Click to browse or drag and drop</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>PDF, JPG, PNG (Max 5MB)</div>
                  </div>
                  <input name="fileName" type="hidden" value="uploaded_document.pdf" />
                </div>

                {err && <p className="form-error-msg">⚠ {err}</p>}
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-light" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary" disabled={loading}>
                  {loading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
