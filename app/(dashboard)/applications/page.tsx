import { getApplications } from '@/app/actions/applications'
import { getCustomers } from '@/app/actions/customers'
import { getStaff } from '@/app/actions/staff'
import { getActiveProducts } from '@/app/actions/products'
import { ApplicationsClient } from '@/components/applications/application-list'

export default async function ApplicationsPage() {
  const [applications, customers, staff, products] = await Promise.all([
    getApplications(), getCustomers(), getStaff(), getActiveProducts()
  ])
  return <ApplicationsClient applications={applications} customers={customers} staff={staff} products={products} />
}
