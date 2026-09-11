import { getReports } from '@/app/actions/activity'
import ReportsClient from '@/components/reports/reports-client'

export default async function ReportsPage() {
  const reports = await getReports()
  return <ReportsClient reports={reports} />
}
