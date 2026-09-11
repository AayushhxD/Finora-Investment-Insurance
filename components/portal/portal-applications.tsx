'use client'

import { FileText, ArrowRight } from 'lucide-react'
import { fmtDate } from '@/lib/fmt-date'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'badge-green', PROCESSING: 'badge-blue', DOCUMENTS_REQUESTED: 'badge-yellow',
  DOCUMENTS_RECEIVED: 'badge-orange', SUBMITTED: 'badge-blue', APPROVED: 'badge-green',
  LEAD_CREATED: 'badge-gray', STAFF_ASSIGNED: 'badge-violet', PRODUCT_SELECTED: 'badge-violet',
  CUSTOMER_INTERESTED: 'badge-yellow', REJECTED: 'badge-red', RENEWAL_SCHEDULED: 'badge-green',
}

export default function PortalApplications({ apps, customerId }: { apps: any[], customerId: string }) {
  return (
    <div className="portal-content">
      <div className="portal-header">
        <div>
          <h2>My Applications</h2>
          <p>Track the status of your product applications</p>
        </div>
      </div>

      <div className="portal-grid">
        {apps.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <h3>No applications found</h3>
            <p>You haven't applied for any products yet.</p>
          </div>
        ) : (
          apps.map(app => (
            <div key={app.id} className="portal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{app.productName}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Application ID: {app.id}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[app.status] ?? 'badge-gray'}`}>
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: 10, background: 'var(--soft2)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Last Updated</div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(app.updatedAt)}</div>
                </div>
                <div style={{ flex: 1, padding: 10, background: 'var(--soft2)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Pending With</div>
                  <div style={{ fontWeight: 600 }}>{app.pendingWith}</div>
                </div>
              </div>

              {app.status === 'DOCUMENTS_REQUESTED' && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--warning-bg)', border: '1px solid #fde047', borderRadius: 8, fontSize: 13, color: '#854d0e' }}>
                  <strong>Action Required:</strong> We need some additional documents to process your application.
                  <Link href={`/portal/${customerId}/documents`} style={{ display: 'block', marginTop: 4, fontWeight: 600, textDecoration: 'underline' }}>
                    Upload Documents →
                  </Link>
                </div>
              )}

              <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/portal/${customerId}/messages`}>
                  <button className="btn-ghost btn-sm">Contact Support</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
