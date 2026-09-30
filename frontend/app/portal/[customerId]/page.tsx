import { getCustomerById } from '@backend/modules/customers/presentation/actions'
import { getApplications } from '@backend/modules/applications/presentation/actions'
import { getDocumentsByApplication } from '@backend/modules/documents/presentation/actions'
import { notFound } from 'next/navigation'
import PortalLayout from '@/components/portal/portal-layout'
import PortalHome from '@/components/portal/portal-home'

export default async function PortalPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const customer = await getCustomerById(customerId)
  if (!customer) return notFound()
  return (
    <PortalLayout customer={customer} activeSection="home">
      <PortalHome customerId={customerId} />
    </PortalLayout>
  )
}
