import { getCustomers } from '@/app/actions/customers'
import { getStaff } from '@/app/actions/staff'
import { CustomersClient } from '@/components/customers/customer-list'

export default async function CustomersPage() {
  const [customers, staff] = await Promise.all([getCustomers(), getStaff()])
  return <CustomersClient customers={customers} staff={staff} />
}
