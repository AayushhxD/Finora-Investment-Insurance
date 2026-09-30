import { getUnlinkedStaffUsers, listStaff } from '@backend/modules/staff/presentation/actions'
import { getCustomers } from '@backend/modules/customers/presentation/actions'
import { getApplications } from '@backend/modules/applications/presentation/actions'
import { canManageCustomers, requireCustomerActor } from '@backend/modules/customers/application/access-control'
import StaffClient from '@/components/staff/staff-client'

export default async function StaffPage() {
  const actor = await requireCustomerActor()
  const canManage = canManageCustomers(actor)
  const [staff, customers, applications, accounts] = await Promise.all([
    listStaff(),
    getCustomers(),
    getApplications(),
    canManage ? getUnlinkedStaffUsers() : Promise.resolve([]),
  ])
  return <StaffClient staff={staff.items} stats={staff.stats} total={staff.total} accounts={accounts} canManage={canManage} canGrantRoles={actor.role === 'Admin'} customers={customers} applications={applications} />
}
