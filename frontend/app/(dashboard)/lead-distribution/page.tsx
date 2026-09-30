import { getLeadDistributionData } from '@backend/actions/lead-distribution'
import { getStaff } from '@backend/actions/staff'
import LeadDistributionClient from '@/components/lead-distribution/lead-distribution-client'

export default async function LeadDistributionPage() {
  const [data, staff] = await Promise.all([getLeadDistributionData(), getStaff()])
  return <LeadDistributionClient data={data} staff={staff} />
}
