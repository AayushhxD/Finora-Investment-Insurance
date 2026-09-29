import { getAllMessages } from '@backend/actions/messages'
import { getCustomers } from '@backend/actions/customers'
import MessagesClient from '@/components/messages/messages-client'
import { auth } from '@backend/lib/auth'
import { headers } from 'next/headers'

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const [messages, customers] = await Promise.all([getAllMessages(), getCustomers()])
  return (
    <MessagesClient
      messages={messages}
      customers={customers}
      fromName={session?.user?.name ?? 'Staff'}
      fromId={session?.user?.id ?? 'staff'}
    />
  )
}
