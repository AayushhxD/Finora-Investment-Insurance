import { getCustomerFullProfile } from '@backend/actions/customers'
import { CustomerDetailClient } from '@/components/customers/customer-detail'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCustomerFullProfile(id)
  if (!profile) return notFound()
  return (
    <>
      <div style={{ padding: '0 0 0 36px', paddingTop: 16, display: 'flex', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/customers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Customers</Link>
        <span>›</span>
        <span style={{ color: 'var(--ink)' }}>{profile.customer.name}</span>
      </div>
      <CustomerDetailClient profile={profile} />
    </>
  )
}
