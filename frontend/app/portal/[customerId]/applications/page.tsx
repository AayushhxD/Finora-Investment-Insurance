import { getCustomerById } from '@backend/modules/customers/presentation/actions'
import { getApplications } from '@backend/modules/applications/presentation/actions'
import PortalLayout from '@/components/portal/portal-layout'
import PortalApplications from '@/components/portal/portal-applications'
import { notFound } from 'next/navigation'

export default async function PortalApplicationsPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const customer = await getCustomerById(customerId)
  if (!customer) return notFound()
  const allApps = await getApplications()
  const apps = allApps.filter(a => a.customerId === customerId)
  return (
    <PortalLayout customer={customer}>
      <PortalApplications apps={apps} customerId={customerId} />
    </PortalLayout>
  )
}
