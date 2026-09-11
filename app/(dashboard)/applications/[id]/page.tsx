import { getApplicationById } from '@/app/actions/applications'
import { ApplicationDetailClient } from '@/components/applications/application-detail'
import { notFound } from 'next/navigation'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const appData = await getApplicationById(params.id)
  if (!appData) return notFound()
  return <ApplicationDetailClient appData={appData} />
}
