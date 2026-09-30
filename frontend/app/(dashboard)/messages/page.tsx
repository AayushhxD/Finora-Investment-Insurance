import { getAllMessages } from '@backend/modules/messages/presentation/actions'
import { getCustomers } from '@backend/modules/customers/presentation/actions'
import MessagesClient from '@/components/messages/messages-client'
import { auth } from '@backend/infrastructure/auth/server'
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
