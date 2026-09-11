import { getReferrals } from '@/app/actions/referrals'
import { getRewards, getRewardStats, getRewardRules } from '@/app/actions/rewards'
import ReferralsClient from '@/components/referrals/referrals-client'

export default async function ReferralsPage() {
  const referrals = await getReferrals()
  return <ReferralsClient referrals={referrals} />
}
