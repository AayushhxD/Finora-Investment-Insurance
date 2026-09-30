import { getRenewals, getRenewalStats } from '@backend/modules/renewals/presentation/actions'
import RenewalsClient from '@/components/renewals/renewals-client'

export default async function RenewalsPage() {
  const [renewals, stats] = await Promise.all([getRenewals(), getRenewalStats()])
  return <RenewalsClient renewals={renewals} stats={stats} />
}
