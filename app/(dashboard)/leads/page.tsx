import { getLeads } from '@/app/actions/leads'
import { getStaff } from '@/app/actions/staff'
import { getCustomers } from '@/app/actions/customers'
import LeadsClient from '@/components/leads/leads-client'

export default async function LeadsPage() {
  const [leads, staff, customers] = await Promise.all([getLeads(), getStaff(), getCustomers()])
  return <LeadsClient leads={leads} staff={staff} customers={customers} />
}
