import { getCustomerById } from '@/app/actions/customers'
import { getApplications } from '@/app/actions/applications'
import { getDocumentsByApplication } from '@/app/actions/documents'
import { notFound } from 'next/navigation'
import PortalLayout from '@/components/portal/portal-layout'
import PortalHome from '@/components/portal/portal-home'

export default async function PortalPage({ params }: { params: { customerId: string } }) {
  const customer = await getCustomerById(params.customerId)
  if (!customer) return notFound()
  return (
    <PortalLayout customer={customer} activeSection="home">
      <PortalHome customerId={params.customerId} />
    </PortalLayout>
  )
}
