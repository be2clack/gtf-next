import { redirect } from 'next/navigation'
import { SuperAdminLayout } from '@/components/superadmin/superadmin-layout'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export default async function SuperAdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, superAdmin] = await Promise.all([
    getCurrentUser(),
    isSuperAdmin(),
  ])

  // Redirect if not authenticated or not super admin
  if (!user || !superAdmin) {
    redirect('/login?redirect=/superadmin')
  }

  return (
    <SuperAdminLayout
      user={user ? { name: user.name, type: user.type } : null}
    >
      {children}
    </SuperAdminLayout>
  )
}
