import { getCustomerById } from '@/app/actions/customers'
import { getApplications } from '@/app/actions/applications'
import PortalLayout from '@/components/portal/portal-layout'
import PortalApplications from '@/components/portal/portal-applications'
import { notFound } from 'next/navigation'

export default async function PortalApplicationsPage({ params }: { params: { customerId: string } }) {
  const customer = await getCustomerById(params.customerId)
  if (!customer) return notFound()
  const allApps = await getApplications()
  const apps = allApps.filter(a => a.customerId === params.customerId)
  return (
    <PortalLayout customer={customer}>
      <PortalApplications apps={apps} customerId={params.customerId} />
    </PortalLayout>
  )
}
