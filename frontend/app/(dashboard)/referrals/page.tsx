import { getReferrals } from '@backend/actions/referrals'
import { getRewards, getRewardStats, getRewardRules } from '@backend/actions/rewards'
import ReferralsClient from '@/components/referrals/referrals-client'

export default async function ReferralsPage() {
  const referrals = await getReferrals()
  return <ReferralsClient referrals={referrals} />
}
