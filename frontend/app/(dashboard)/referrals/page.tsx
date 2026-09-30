import { getReferrals } from '@backend/modules/referrals/presentation/actions'
import { getRewards, getRewardStats, getRewardRules } from '@backend/modules/rewards/presentation/actions'
import ReferralsClient from '@/components/referrals/referrals-client'

export default async function ReferralsPage() {
  const referrals = await getReferrals()
  return <ReferralsClient referrals={referrals} />
}
