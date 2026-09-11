import { getCustomerById } from '@/app/actions/customers'
import { getDocuments } from '@/app/actions/documents'
import PortalLayout from '@/components/portal/portal-layout'
import PortalDocuments from '@/components/portal/portal-documents' // Fixed missing import

import { notFound } from 'next/navigation'

export default async function PortalDocumentsPage({ params }: { params: { customerId: string } }) {
  const customer = await getCustomerById(params.customerId)
  if (!customer) return notFound()
  const allDocs = await getDocuments()
  const docs = allDocs.filter(d => d.customerId === params.customerId)
  return (
    <PortalLayout customer={customer}>
      <PortalDocuments docs={docs} customerId={params.customerId} />
    </PortalLayout>
  )
}
