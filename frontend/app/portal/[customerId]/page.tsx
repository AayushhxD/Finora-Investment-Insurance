import { getCustomerById } from '@backend/actions/customers'
import { getApplications } from '@backend/actions/applications'
import { getDocumentsByApplication } from '@backend/actions/documents'
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
