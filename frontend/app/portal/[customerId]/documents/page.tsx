import { getCustomerById } from '@backend/actions/customers'
import { getDocuments } from '@backend/actions/documents'
import PortalLayout from '@/components/portal/portal-layout'
import PortalDocuments from '@/components/portal/portal-documents' // Fixed missing import

import { notFound } from 'next/navigation'

export default async function PortalDocumentsPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  const customer = await getCustomerById(customerId)
  if (!customer) return notFound()
  const allDocs = await getDocuments()
  const docs = allDocs.filter(d => d.customerId === customerId)
  return (
    <PortalLayout customer={customer}>
      <PortalDocuments docs={docs} customerId={customerId} />
    </PortalLayout>
  )
}
