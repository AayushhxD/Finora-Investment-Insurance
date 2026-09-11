import { getActivityLogs } from '@/app/actions/activity'
import ActivityClient from '@/components/activity/activity-client'

export default async function ActivityPage() {
  const logs = await getActivityLogs(undefined, 100)
  return <ActivityClient logs={logs} />
}
