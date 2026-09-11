'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessageToCustomer } from '@/app/actions/messages'
import type { Customer } from '@/lib/store-types'
import { Plus, MessageSquare } from 'lucide-react'

type MessageItem = {
  id: string
  fromName: string
  fromRole: string
  content: string
  createdAt: string
  customerName: string
  customerId?: string
  productName: string
}

function formatAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return fmtDate(iso)
}

function MessageModal({
  customers, fromName, fromId, onClose, onSuccess,
}: {
  customers: Customer[]
  fromName: string
  fromId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [, startT] = useTransition()
  const [err, setErr] = useState('')

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startT(async () => {
      try {
        await sendMessageToCustomer(
          fd.get('customerId') as string,
          fd.get('content') as string,
          fromName,
          fromId,
        )
        onSuccess()
        onClose()
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Failed to send message')
      }
    })
  }

  return (
    <div className="modal-back show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><b>Send Message</b><button className="icon-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>Customer</label>
                <select name="customerId" required>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Channel</label>
                <select name="channel" defaultValue="Portal">
                  <option>Portal</option><option>Email</option><option>WhatsApp</option><option>SMS</option>
                </select>
              </div>
              <div className="field full">
                <label>Message</label>
                <textarea name="content" required placeholder="Type your message..." />
              </div>
            </div>
            {err && <p className="form-error-msg" style={{ marginTop: 12 }}>{err}</p>}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Send Message</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MessagesClient({
  messages, customers, fromName, fromId,
}: {
  messages: MessageItem[]
  customers: Customer[]
  fromName: string
  fromId: string
}) {
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Messages</h1>
          <p className="muted">Customer-to-staff communication and updates.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> New Message
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {messages.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={40} />
              <h3>No messages yet</h3>
              <p>Start a conversation with a customer.</p>
            </div>
          ) : messages.map(m => (
            <div className="activity" key={m.id}>
              <span className="dot" />
              <div>
                <b>{m.fromRole === 'customer' ? m.fromName : `${m.fromName} → ${m.customerName}`}</b>
                <p>&ldquo;{m.content}&rdquo;</p>
                <time>{formatAgo(m.createdAt)} · {m.productName}</time>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <MessageModal
          customers={customers}
          fromName={fromName}
          fromId={fromId}
          onClose={() => setModal(false)}
          onSuccess={() => { showToast('Message sent successfully'); router.refresh() }}
        />
      )}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
