import { getNotifications, markAllNotificationsRead } from '@backend/actions/activity'
import NotificationsClient from '@/components/notifications/notifications-client'

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  return <NotificationsClient notifications={notifications} />
}
