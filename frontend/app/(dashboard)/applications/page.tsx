import { getApplications } from '@backend/actions/applications'
import { getCustomers } from '@backend/actions/customers'
import { getStaff } from '@backend/actions/staff'
import { getActiveProducts } from '@backend/actions/products'
import { ApplicationsClient } from '@/components/applications/application-list'

export default async function ApplicationsPage() {
  const [applications, customers, staff, products] = await Promise.all([
    getApplications(), getCustomers(), getStaff(), getActiveProducts()
  ])
  return <ApplicationsClient applications={applications} customers={customers} staff={staff} products={products} />
}
