'use client'
import { fmtDate } from '@/lib/fmt-date'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationRead, markAllNotificationsRead } from '@/app/actions/activity'
import type { Notification } from '@/lib/store-types'
import Link from 'next/link'
import { Bell, Check, CheckCheck } from 'lucide-react'

const TYPE_ICONS: Record<string, string> = {
  application: '📋', document: '📄', renewal: '🔄', referral: '🔗', reward: '🎁', message: '💬'
}

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const [, startT] = useTransition()
  const [toast, setToast] = useState('')
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000) }
  const unread = notifications.filter(n => !n.read).length

  function handleRead(id: string) {
    startT(async () => { await markNotificationRead(id); router.refresh() })
  }

  function handleReadAll() {
    startT(async () => { await markAllNotificationsRead(); showToast('All marked as read'); router.refresh() })
  }

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notifications</h1>
          <p className="muted">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button className="outline-btn" onClick={handleReadAll}><CheckCheck size={15} /> Mark all read</button>
        )}
      </div>

      <div className="tbl-wrap">
        {notifications.length === 0 ? (
          <div className="empty-state"><Bell size={40} /><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : notifications.map(n => (
          <Link key={n.id} href={n.linkTo} style={{ textDecoration: 'none', display: 'block' }} onClick={() => handleRead(n.id)}>
            <div className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div style={{ fontSize: 20 }}>{TYPE_ICONS[n.type] ?? '🔔'}</div>
              {!n.read && <div className="notif-dot" />}
              <div className="notif-body" style={{ flex: 1 }}>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>
              <div className="notif-time">{fmtDate(n.createdAt)}</div>
            </div>
          </Link>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
