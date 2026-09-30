import { getStaff } from '@backend/actions/staff'
import { getCustomers } from '@backend/actions/customers'
import { getApplications } from '@backend/actions/applications'
import StaffClient from '@/components/staff/staff-client'

export default async function StaffPage() {
  const [staff, customers, applications] = await Promise.all([getStaff(), getCustomers(), getApplications()])
  return <StaffClient staff={staff} customers={customers} applications={applications} />
}
