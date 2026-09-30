import { getLeadDistributionData } from '@backend/modules/lead-distribution/presentation/actions'
import { getStaff } from '@backend/modules/staff/presentation/actions'
import LeadDistributionClient from '@/components/lead-distribution/lead-distribution-client'

export default async function LeadDistributionPage() {
  const [data, staff] = await Promise.all([getLeadDistributionData(), getStaff()])
  return <LeadDistributionClient data={data} staff={staff} />
}
