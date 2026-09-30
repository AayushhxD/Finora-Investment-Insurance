import { getRewards, getRewardStats, getRewardRules } from '@backend/modules/rewards/presentation/actions'
import RewardsClient from '@/components/rewards/rewards-client'

export default async function RewardsPage() {
  const [rewards, stats, rules] = await Promise.all([getRewards(), getRewardStats(), getRewardRules()])
  return <RewardsClient rewards={rewards} stats={stats} rules={rules} />
}
