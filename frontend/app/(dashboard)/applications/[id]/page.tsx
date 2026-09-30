import { getApplicationById } from '@backend/modules/applications/presentation/actions'
import { ApplicationDetailClient } from '@/components/applications/application-detail'
import { notFound } from 'next/navigation'

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appData = await getApplicationById(id)
  if (!appData) return notFound()
  return <ApplicationDetailClient appData={appData} />
}
