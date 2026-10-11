'use client'
// GEÇİCİ: görsel QA için — commit'lenmeyecek
import { CreditCard } from 'lucide-react'

import { AdminHeader } from '@/components/admin/admin-dashboard/admin-header'
import { OverviewTab } from '@/components/admin/admin-dashboard/overview-tab'
import { UsersTab } from '@/components/admin/admin-dashboard/users-tab'
import { DeletedUsersTab } from '@/components/admin/admin-dashboard/deleted-users-tab'
import { FeedbacksTab } from '@/components/admin/admin-dashboard/feedbacks-tab'
import { ActivityLogsTab } from '@/components/admin/admin-dashboard/activity-logs-tab'
import { ThemeProvider } from '@/components/theme-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/lib/contexts/i18n-provider'

const now = '2026-10-08T09:00:00Z'
const users = [
    { id: 'u1', full_name: 'Ayşe Yılmaz', email: 'ayse@ornek.com', created_at: '2026-09-01T10:00:00Z', plan: 'plus' as const, subscription_status: 'active', subscription_end: '2027-09-01T00:00:00Z' },
    { id: 'u2', full_name: 'Mehmet Demir', email: 'mehmet@ornek.com', created_at: '2026-09-12T10:00:00Z', plan: 'free' as const },
    { id: 'u3', full_name: 'Zeynep Kaya', email: 'zeynep@ornek.com', created_at: '2026-10-02T10:00:00Z', plan: 'pro' as const, subscription_status: 'active', subscription_end: '2026-11-02T00:00:00Z' },
]
const deleted = [{ ...users[1], id: 'd1', deleted_at: now, deleted_by: 'user', original_created_at: '2026-05-01T00:00:00Z' }]
const feedbacks = [
    { id: 'f1', user_id: 'u1', user_name: 'Ayşe Yılmaz', user_email: 'ayse@ornek.com', subject: 'PDF indirme yavaş', message: 'Büyük kataloglarda PDF indirme 1 dakikadan uzun sürüyor.', page_url: '/dashboard/builder', status: 'pending' as const, created_at: now },
    { id: 'f2', user_id: 'u3', user_name: 'Zeynep Kaya', user_email: 'zeynep@ornek.com', subject: 'Yeni şablon önerisi', message: 'Kozmetik ürünleri için daha sade bir şablon olabilir mi?', status: 'resolved' as const, created_at: '2026-10-01T09:00:00Z' },
]
const logs = [
    { id: 'l1', user_id: 'u1', user_email: 'ayse@ornek.com', user_name: 'Ayşe Yılmaz', activity_type: 'user_login' as const, description: 'Giriş yaptı', created_at: now },
    { id: 'l2', user_id: 'u3', user_email: 'zeynep@ornek.com', user_name: 'Zeynep Kaya', activity_type: 'plan_upgrade' as const, description: 'Pro plana geçti', created_at: '2026-10-07T12:00:00Z' },
]

function Admin() {
    const { t: baseT } = useTranslation()
    const t = (k: string, p?: Record<string, unknown>) => baseT(k, p) as string
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:p-8">
                <AdminHeader onReload={() => {}} t={t} />
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
                            <TabsTrigger value="users">{t('admin.users')} ({users.length})</TabsTrigger>
                            <TabsTrigger value="deleted">{t('admin.deletedUsers')} ({deleted.length})</TabsTrigger>
                            <TabsTrigger value="feedbacks">{t('admin.feedbacks')} ({feedbacks.length})</TabsTrigger>
                            <TabsTrigger value="activity">{t('admin.activityLogs')}</TabsTrigger>
                            <TabsTrigger value="payments"><CreditCard className="size-4" />{t('admin.payments')}</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="overview"><OverviewTab stats={{ usersCount: 128, productsCount: 4210, catalogsCount: 312, totalExports: 980, deletedUsersCount: 4 }} t={t} /></TabsContent>
                    <TabsContent value="users"><UsersTab users={users} filteredUsers={users} searchTerm="" onSearchChange={() => {}} onPlanUpdate={async () => {}} t={t} /></TabsContent>
                    <TabsContent value="deleted"><DeletedUsersTab deletedUsers={deleted} t={t} /></TabsContent>
                    <TabsContent value="feedbacks"><FeedbacksTab feedbacks={feedbacks} selectedFeedbackIds={[]} onStatusUpdate={async () => {}} onDelete={async () => {}} onBulkStatusUpdate={async () => {}} onBulkDelete={async () => {}} onClearSelection={() => {}} onToggleSelect={() => {}} onToggleSelectAll={() => {}} t={t} /></TabsContent>
                    <TabsContent value="activity"><ActivityLogsTab activityLogs={logs} loadingLogs={false} logsPage={1} totalLogsPages={1} logsTotalCount={2} onPageChange={() => {}} t={t} /></TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function Page() {
    return <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange><Admin /></ThemeProvider>
}
