import { getRenewals, getRenewalStats } from '@/app/actions/renewals'
import RenewalsClient from '@/components/renewals/renewals-client'

export default async function RenewalsPage() {
  const [renewals, stats] = await Promise.all([getRenewals(), getRenewalStats()])
  return <RenewalsClient renewals={renewals} stats={stats} />
}
