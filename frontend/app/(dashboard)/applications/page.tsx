import { getApplications } from '@backend/modules/applications/presentation/actions'
import { getCustomers } from '@backend/modules/customers/presentation/actions'
import { getStaff } from '@backend/modules/staff/presentation/actions'
import { getActiveProducts } from '@backend/modules/products/presentation/actions'
import { ApplicationsClient } from '@/components/applications/application-list'

export default async function ApplicationsPage() {
  const [applications, customers, staff, products] = await Promise.all([
    getApplications(), getCustomers(), getStaff(), getActiveProducts()
  ])
  return <ApplicationsClient applications={applications} customers={customers} staff={staff} products={products} />
}
