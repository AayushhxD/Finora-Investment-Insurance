import { getReports } from '@backend/modules/activity/presentation/actions'
import ReportsClient from '@/components/reports/reports-client'

export default async function ReportsPage() {
  const reports = await getReports()
  return <ReportsClient reports={reports} />
}
