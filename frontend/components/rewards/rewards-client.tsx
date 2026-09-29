'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRewardStatus, updateRewardRule } from '@backend/actions/rewards'
import type { RewardStatus, RewardRule } from '@shared/types/store-types'
import { Gift, Settings } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = { ELIGIBLE: 'badge-green', PENDING_PAYMENT: 'badge-yellow', PAID: 'badge-blue' }

export default function RewardsClient({ rewards, stats, rules }: { rewards: any[], stats: any, rules: RewardRule[] }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [ruleEdits, setRuleEdits] = useState<Record<string, number>>({})
  const [toast, setToast] = useState('')
  const [, startT] = useTransition()
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = rewards.filter(r => !statusFilter || r.status === statusFilter)

  function handleStatusUpdate(id: string, status: RewardStatus) {
    startT(async () => { await updateRewardStatus(id, status, 'Admin'); showToast(`Reward marked ${status}`); router.refresh() })
  }

  function handleRuleUpdate(id: string, amount: number) {
    startT(async () => { await updateRewardRule(id, { amountPerReferral: amount }); showToast('Rule updated'); router.refresh() })
  }

  function handleRuleToggle(id: string, enabled: boolean) {
    startT(async () => { await updateRewardRule(id, { enabled }); showToast(`Rule ${enabled ? 'enabled' : 'disabled'}`); router.refresh() })
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left"><h1>Rewards</h1><p className="muted">Manage referral and loyalty rewards</p></div>
        <button className="outline-btn" onClick={() => setShowRules(true)}><Settings size={15} /> Reward Rules</button>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <article><span>ELIGIBLE</span><strong className="positive">₹{stats.totalEligible}</strong></article>
        <article><span>PENDING PAYMENT</span><strong style={{ color: '#f4a04c' }}>₹{stats.totalPending}</strong></article>
        <article><span>PAID</span><strong>₹{stats.totalPaid}</strong></article>
        <article><span>TOTAL REWARDS</span><strong>{stats.count}</strong></article>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select className="tbl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ELIGIBLE">Eligible</option><option value="PENDING_PAYMENT">Pending Payment</option><option value="PAID">Paid</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><Gift size={40} /><h3>No rewards found</h3></div>
        ) : filtered.map((r: any) => (
          <div key={r.id} className="reward-card">
            <div className="reward-card-icon">🎁</div>
            <div className="reward-card-body">
              <h3>₹{r.amount} — {r.type.replace(/_/g,' ')}</h3>
              <p>{r.description} · Customer: <strong>{r.customerName}</strong></p>
            </div>
            <span className={`badge ${STATUS_COLORS[r.status] ?? 'badge-gray'}`}>{r.status.replace(/_/g,' ')}</span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {r.status === 'ELIGIBLE' && (
                <button className="outline-btn btn-sm" onClick={() => handleStatusUpdate(r.id, 'PENDING_PAYMENT')}>Mark Pending</button>
              )}
              {r.status === 'PENDING_PAYMENT' && (
                <button className="primary btn-sm" onClick={() => handleStatusUpdate(r.id, 'PAID')}>Mark Paid</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showRules && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRules(false)}>
          <div className="modal">
            <h2>Reward Rules</h2>
            <p className="muted" style={{ marginBottom: 20 }}>Configure reward amounts for each reward type.</p>
            <div className="form-grid">
              {rules.map(rule => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--soft)', borderRadius: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{rule.type.replace(/_/g,' ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{rule.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13 }}>₹</span>
                    <input type="number" defaultValue={rule.amountPerReferral} style={{ width: 80, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
                      onChange={e => setRuleEdits(prev => ({ ...prev, [rule.id]: Number(e.target.value) }))} />
                    <button className="primary btn-sm" onClick={() => handleRuleUpdate(rule.id, ruleEdits[rule.id] ?? rule.amountPerReferral)}>Save</button>
                    <button className={`outline-btn btn-sm ${rule.enabled ? 'danger' : ''}`}
                      onClick={() => handleRuleToggle(rule.id, !rule.enabled)}>
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowRules(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
