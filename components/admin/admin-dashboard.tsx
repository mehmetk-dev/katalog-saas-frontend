"use client"

import { Activity } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminHeader } from "@/components/admin/admin-dashboard/admin-header"
import { ActivityLogsTab } from "@/components/admin/admin-dashboard/activity-logs-tab"
import { DeletedUsersTab } from "@/components/admin/admin-dashboard/deleted-users-tab"
import { FeedbacksTab } from "@/components/admin/admin-dashboard/feedbacks-tab"
import { OverviewTab } from "@/components/admin/admin-dashboard/overview-tab"
import { UsersTab } from "@/components/admin/admin-dashboard/users-tab"
import { useAdminDashboard } from "@/components/admin/admin-dashboard/use-admin-dashboard"

export function AdminDashboardClient() {
    const {
        t,
        stats,
        users,
        deletedUsers,
        feedbacks,
        selectedFeedbackIds,
        loading,
        searchTerm,
        activityLogs,
        loadingLogs,
        logsPage,
        logsTotalCount,
        totalLogsPages,
        filteredUsers,
        setSearchTerm,
        loadData,
        handlePlanUpdate,
        handleFeedbackStatusUpdate,
        handleFeedbackDelete,
        handleBulkStatusUpdate,
        handleBulkDelete,
        toggleSelectFeedback,
        toggleSelectAllFeedbacks,
        handleLogsPageChange,
        clearSelectedFeedbacks,
    } = useAdminDashboard()

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 animate-spin text-primary" />
                    <p>{t("common.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <AdminHeader onReload={loadData} t={t} />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">{t("admin.overview")}</TabsTrigger>
                    <TabsTrigger value="users">{t("admin.users")} ({users.length})</TabsTrigger>
                    <TabsTrigger value="deleted">{t("admin.deletedUsers")} ({deletedUsers.length})</TabsTrigger>
                    <TabsTrigger value="feedbacks">{t("admin.feedbacks")} ({feedbacks.length})</TabsTrigger>
                    <TabsTrigger value="activity">{t("admin.activityLogs")}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <OverviewTab stats={stats} t={t} />
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                    <UsersTab
                        users={users}
                        filteredUsers={filteredUsers}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onPlanUpdate={handlePlanUpdate}
                        t={t}
                    />
                </TabsContent>

                <TabsContent value="deleted" className="space-y-6">
                    <DeletedUsersTab deletedUsers={deletedUsers} t={t} />
                </TabsContent>

                <TabsContent value="feedbacks" className="space-y-6">
                    <FeedbacksTab
                        feedbacks={feedbacks}
                        selectedFeedbackIds={selectedFeedbackIds}
                        onStatusUpdate={handleFeedbackStatusUpdate}
                        onDelete={handleFeedbackDelete}
                        onBulkStatusUpdate={handleBulkStatusUpdate}
                        onBulkDelete={handleBulkDelete}
                        onClearSelection={clearSelectedFeedbacks}
                        onToggleSelect={toggleSelectFeedback}
                        onToggleSelectAll={toggleSelectAllFeedbacks}
                        t={t}
                    />
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    <ActivityLogsTab
                        activityLogs={activityLogs}
                        loadingLogs={loadingLogs}
                        logsPage={logsPage}
                        totalLogsPages={totalLogsPages}
                        logsTotalCount={logsTotalCount}
                        onPageChange={handleLogsPageChange}
                        t={t}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}