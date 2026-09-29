import { auth } from '@backend/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { getNotifications } from '@backend/actions/activity'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (err) {
    console.error('auth.api.getSession failed:', err)
    redirect('/sign-in')
  }

  if (!session?.user) redirect('/sign-in')

  const notifications = await getNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppLayout name={session.user.name} unreadCount={unreadCount}>
      {children}
    </AppLayout>
  )
}
