import { getCustomerStaff, getCustomers } from '@backend/actions/customers'
import { CustomersClient } from '@/components/customers/customer-list'

export default async function CustomersPage() {
  const [customers, staff] = await Promise.all([getCustomers(), getCustomerStaff()])
  return <CustomersClient customers={customers} staff={staff} />
}
