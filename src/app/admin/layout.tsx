import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { getCurrentUser, isAdmin, isSuperAdmin } from '@/lib/auth'
import { getFederationContext } from '@/lib/federation'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, { federation }, admin, superAdmin] = await Promise.all([
    getCurrentUser(),
    getFederationContext(),
    isAdmin(),
    isSuperAdmin(),
  ])

  // Redirect if not authenticated or not admin
  if (!user || !admin) {
    redirect('/login?redirect=/admin')
  }

  // Federation admin requires a federation context (subdomain or path prefix)
  // Only superadmins can access /admin without federation
  if (!federation && !superAdmin) {
    redirect('/')
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