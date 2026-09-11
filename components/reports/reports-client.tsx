'use client'
import { useState } from 'react'
import { BarChart2 } from 'lucide-react'

export default function ReportsClient({ reports }: { reports: any }) {
  const [tab, setTab] = useState<'staff' | 'products' | 'renewals' | 'referrals'>('staff')
  const { staffReport, productReport, renewalReport, referralReport } = reports

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Reports</h1><p className="muted">Business analytics and performance</p></div>
      </div>

      <div className="tabs">
        {(['staff', 'products', 'renewals', 'referrals'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="report-section">
          <div className="report-table-wrap">
            <table>
              <thead><tr><th>STAFF NAME</th><th>ROLE</th><th>CUSTOMERS</th><th>TOTAL APPS</th><th>ACTIVE</th><th>COMPLETED</th><th>PENDING</th><th>RENEWALS</th></tr></thead>
              <tbody>
                {staffReport.map((s: any) => (
                  <tr key={s.staffId}>
                    <td className="td-name">{s.staffName}</td>
                    <td><span className={`badge ${s.role === 'Manager' ? 'badge-blue' : s.role === 'Admin' ? 'badge-violet' : 'badge-green'}`}>{s.role}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.customers}</td>
                    <td>{s.totalApplications}</td>
                    <td className="positive" style={{ fontWeight: 600 }}>{s.activeApplications}</td>
                    <td style={{ fontWeight: 600 }}>{s.completedApplications}</td>
                    <td style={{ color: s.pendingApplications > 0 ? '#f4a04c' : undefined, fontWeight: 600 }}>{s.pendingApplications}</td>
                    <td>{s.upcomingRenewals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="report-section">
          <div className="report-table-wrap">
            <table>
              <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>ENQUIRIES</th><th>ACTIVE</th><th>COMPLETED</th><th>REJECTED</th></tr></thead>
              <tbody>
                {productReport.map((p: any) => (
                  <tr key={p.productId}>
                    <td className="td-name">{p.name}</td>
                    <td><span className="badge badge-gray">{p.category}</span></td>
                    <td>{p.enquiries}</td>
                    <td className="positive" style={{ fontWeight: 600 }}>{p.active}</td>
                    <td style={{ fontWeight: 600 }}>{p.completed}</td>
                    <td style={{ color: p.rejected > 0 ? '#db6268' : undefined }}>{p.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'renewals' && (
        <div className="report-section">
          <div className="metric-grid">
            <article><span>UPCOMING</span><strong style={{ color: 'var(--yellow)' }}>{renewalReport.upcoming}</strong></article>
            <article><span>CUSTOMER CONTACTED</span><strong>{renewalReport.contacted}</strong></article>
            <article><span>COMPLETED</span><strong className="positive">{renewalReport.completed}</strong></article>
            <article><span>OVERDUE</span><strong className="negative">{renewalReport.overdue}</strong></article>
          </div>
          <div style={{ padding: 20, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, marginTop: 12 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Renewal Summary</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {renewalReport.completed} out of {renewalReport.upcoming + renewalReport.completed + renewalReport.overdue} renewals completed.
              Not renewed: {renewalReport.notRenewed}.
            </p>
          </div>
        </div>
      )}

      {tab === 'referrals' && (
        <div className="report-section">
          <div className="metric-grid">
            <article><span>TOTAL REFERRALS</span><strong>{referralReport.total}</strong></article>
            <article><span>CONTACTED</span><strong>{referralReport.contacted}</strong></article>
            <article><span>CONVERTED</span><strong>{referralReport.converted}</strong></article>
            <article><span>SUCCESSFUL</span><strong className="positive">{referralReport.successful}</strong></article>
          </div>
          <div className="report-table-wrap">
            <table>
              <thead><tr><th>CUSTOMER</th><th>REFERRALS</th><th>SUCCESSFUL</th><th>EARNED</th></tr></thead>
              <tbody>
                {referralReport.byCustomer.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No referral data</td></tr>
                ) : referralReport.byCustomer.map((c: any) => (
                  <tr key={c.customerId}>
                    <td className="td-name">{c.name}</td>
                    <td>{c.referrals}</td>
                    <td className="positive" style={{ fontWeight: 600 }}>{c.successful}</td>
                    <td style={{ fontWeight: 700, color: c.earned > 0 ? 'var(--green)' : undefined }}>₹{c.earned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
