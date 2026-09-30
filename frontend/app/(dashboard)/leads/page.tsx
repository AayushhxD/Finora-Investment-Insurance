import { getLeads } from '@backend/modules/leads/presentation/actions'
import { getStaff } from '@backend/modules/staff/presentation/actions'
import { getCustomers } from '@backend/modules/customers/presentation/actions'
import LeadsClient from '@/components/leads/leads-client'

export default async function LeadsPage() {
  const [leads, staff, customers] = await Promise.all([getLeads(), getStaff(), getCustomers()])
  return <LeadsClient leads={leads} staff={staff} customers={customers} />
}
