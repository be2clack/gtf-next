import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { getFederationContext } from '@/lib/federation'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, { federation }, admin] = await Promise.all([
    getCurrentUser(),
    getFederationContext(),
    isAdmin(),
  ])

  // Redirect if not authenticated or not admin
  if (!user || !admin) {
    redirect('/login?redirect=/admin')
  }

  return (
    <AdminLayout
      user={user ? { name: user.name, type: user.type } : null}
      federation={federation ? { name: federation.name, code: federation.code } : null}
    >
      {children}
    </AdminLayout>
  )
}