import type { ReactNode } from 'react'

import { DashboardAppShell } from '@/components/dashboard/dashboard-app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return <DashboardAppShell>{children}</DashboardAppShell>
}
