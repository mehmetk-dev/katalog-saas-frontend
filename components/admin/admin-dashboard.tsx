"use client"

import { useEffect, useState, useCallback } from "react"
import NextImage from "next/image"
import { Users, Package, FileText, Download, Activity, Search, Trash2, ChevronLeft, ChevronRight, Film, CheckSquare, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAdminStats, getAdminUsers, getDeletedUsers, updateUserPlan } from "@/lib/actions/admin"
import { getFeedbacks, updateFeedbackStatus, deleteFeedback, bulkUpdateFeedbackStatus, bulkDeleteFeedbacks, type Feedback } from "@/lib/actions/feedback"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n-provider"

interface AdminUser {
    id: string
    name?: string
    full_name?: string
    email: string
    created_at: string
    subscription_end?: string
    subscription_status?: string
    plan?: 'free' | 'plus' | 'pro'
}

interface DeletedUser extends AdminUser {
    deleted_at: string
    deleted_by: string
    original_created_at: string
}

interface ActivityLog {
    id: string
    created_at: string
    user_email?: string
    user_name?: string
    activity_type: string
    description: string
    ip_address?: string
}

export function AdminDashboardClient() {
    const { t } = useTranslation()

    const [stats, setStats] = useState({
        usersCount: 0,
        productsCount: 0,
        catalogsCount: 0,
        totalExports: 0,
        deletedUsersCount: 0
    })
    const [users, setUsers] = useState<AdminUser[]>([])
    const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [logsPage, setLogsPage] = useState(0)
    const [logsTotalCount, setLogsTotalCount] = useState(0)
    const LOGS_PER_PAGE = 20

    const totalLogsPages = Math.ceil(logsTotalCount / LOGS_PER_PAGE)

    const handleLogsPageChange = (newPage: number) => {
        setLogsPage(newPage)
        fetchActivityLogs(newPage)
    }

    const fetchActivityLogs = useCallback(async (page: number = 0) => {
        setLoadingLogs(true)
        try {
            const client = createClient()
            
            // Get total count
            const { count, error: countError } = await client
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })

            if (countError) {
                console.error('Error fetching logs count:', countError)
                toast.error(`Log sayısı alınamadı: ${countError.message}`)
                setLogsTotalCount(0)
            } else {
                setLogsTotalCount(count || 0)
            }

            // Get paginated data
            const from = page * LOGS_PER_PAGE
            const to = from + LOGS_PER_PAGE - 1

            const { data, error } = await client
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) {
                console.error('Error fetching logs:', error)
                toast.error(`Loglar yüklenemedi: ${error.message}`)
                setActivityLogs([])
            } else {
                setActivityLogs(data || [])
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error)
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
            toast.error(`Beklenmeyen hata: ${errorMessage}`)
            setActivityLogs([])
            setLogsTotalCount(0)
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            // Load activity logs separately to avoid blocking other data
            fetchActivityLogs(0).catch(err => console.error('Failed to load activity logs:', err))
            
            const statsData = await getAdminStats()
            setStats(statsData)

            const [usersData, deletedUsersData, feedbacksData] = await Promise.all([
                getAdminUsers(),
                getDeletedUsers(),
                getFeedbacks()
            ])
            setUsers(usersData as AdminUser[])
            setDeletedUsers(deletedUsersData as DeletedUser[])
            setFeedbacks(feedbacksData)
        } catch (error: unknown) {
            console.error("Failed to load admin data:", error)
            toast.error(t('toasts.errorOccurred'))
        } finally {
            setLoading(false)
        }
    }, [fetchActivityLogs, t])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handlePlanUpdate = async (userId: string, newPlan: 'free' | 'plus' | 'pro') => {
        try {
            await updateUserPlan(userId, newPlan)
            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
            toast.success(`${t('toasts.profileUpdated')} (${newPlan.toUpperCase()})`)
        } catch {
            toast.error(t('toasts.profileUpdateFailed'))
        }
    }

    const handleFeedbackStatusUpdate = async (id: string, status: Feedback['status']) => {
        try {
            await updateFeedbackStatus(id, status)
            setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status } : f))
            toast.success("Geri bildirim durumu güncellendi")
        } catch {
            toast.error("İşlem başarısız oldu")
        }
    }

    const handleFeedbackDelete = async (id: string) => {
        try {
            await deleteFeedback(id)
            setFeedbacks(feedbacks.filter(f => f.id !== id))
            setSelectedFeedbackIds(selectedFeedbackIds.filter(fid => fid !== id))
            toast.success("Geri bildirim ve ekli dosyalar silindi")
        } catch (error) {
            console.error("Error deleting feedback:", error)
            toast.error("Geri bildirim silinirken bir hata oluştu")
        }
    }

    // Toplu işlemler
    const handleBulkStatusUpdate = async (status: Feedback['status']) => {
        if (selectedFeedbackIds.length === 0) {
            toast.error("Lütfen en az bir geri bildirim seçin")
            return
        }

        try {
            await bulkUpdateFeedbackStatus(selectedFeedbackIds, status)
            setFeedbacks(feedbacks.map(f => 
                selectedFeedbackIds.includes(f.id) ? { ...f, status } : f
            ))
            setSelectedFeedbackIds([])
            toast.success(`${selectedFeedbackIds.length} geri bildirim ${status === 'pending' ? 'beklemeye' : status === 'resolved' ? 'çözüldüye' : 'kapatıldı'} alındı`)
        } catch (error) {
            console.error("Error updating feedbacks:", error)
            toast.error("Toplu güncelleme başarısız oldu")
        }
    }

    const handleBulkDelete = async () => {
        if (selectedFeedbackIds.length === 0) {
            toast.error("Lütfen en az bir geri bildirim seçin")
            return
        }

        try {
            const result = await bulkDeleteFeedbacks(selectedFeedbackIds)
            setFeedbacks(feedbacks.filter(f => !selectedFeedbackIds.includes(f.id)))
            setSelectedFeedbackIds([])
            toast.success(`${result.deletedCount} geri bildirim ve ekli dosyalar silindi${result.errorCount > 0 ? ` (${result.errorCount} hata)` : ''}`)
        } catch (error) {
            console.error("Error deleting feedbacks:", error)
            toast.error("Toplu silme başarısız oldu")
        }
    }

    const toggleSelectFeedback = (id: string) => {
        if (selectedFeedbackIds.includes(id)) {
            setSelectedFeedbackIds(selectedFeedbackIds.filter(fid => fid !== id))
        } else {
            setSelectedFeedbackIds([...selectedFeedbackIds, id])
        }
    }

    const toggleSelectAllFeedbacks = () => {
        if (selectedFeedbackIds.length === feedbacks.length) {
            setSelectedFeedbackIds([])
        } else {
            setSelectedFeedbackIds(feedbacks.map(f => f.id))
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <div className="p-8 flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <Activity className="w-8 h-8 animate-spin text-primary" />
                <p>{t('common.loading')}</p>
            </div>
        </div>
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
                    <p className="text-muted-foreground">{t('admin.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <Activity className="w-4 h-4 mr-2" />
                        {t('common.reload')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
                    <TabsTrigger value="users">{t('admin.users')} ({users.length})</TabsTrigger>
                    <TabsTrigger value="deleted">{t('admin.deletedUsers')} ({deletedUsers.length})</TabsTrigger>
                    <TabsTrigger value="feedbacks">Geri Bildirimler ({feedbacks.length})</TabsTrigger>
                    <TabsTrigger value="activity">Aktivite Logları</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.usersCount}</div>
                                <p className="text-xs text-muted-foreground">{t('admin.totalUsersDesc')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.totalProducts')}</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.productsCount}</div>
                                <p className="text-xs text-muted-foreground">{t('admin.totalProductsDesc')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.totalCatalogs')}</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.catalogsCount}</div>
                                <p className="text-xs text-muted-foreground">{t('admin.totalCatalogsDesc')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.downloads')}</CardTitle>
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalExports}</div>
                                <p className="text-xs text-muted-foreground">{t('admin.downloadsDesc')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* USERS TAB */}
                <TabsContent value="users" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t('admin.userList')}</CardTitle>
                                    <CardDescription>{t('admin.userListDesc')}</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('admin.searchPlaceholder')}
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('admin.user')}</TableHead>
                                        <TableHead>{t('admin.email')}</TableHead>
                                        <TableHead>{t('admin.registerDate')}</TableHead>
                                        <TableHead>{t('admin.renewalDate')}</TableHead>
                                        <TableHead>{t('admin.status')}</TableHead>
                                        <TableHead>{t('admin.currentPlan')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name || "Isimsiz"}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                                            <TableCell>
                                                {user.subscription_end
                                                    ? new Date(user.subscription_end).toLocaleDateString("tr-TR")
                                                    : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.subscription_status === 'active' ? 'outline' : 'destructive'} className={user.subscription_status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}>
                                                    {user.subscription_status === 'active' ? t('common.active') : t('common.passive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.plan === 'pro' ? 'default' : user.plan === 'plus' ? 'secondary' : 'outline'}
                                                    className={user.plan === 'pro' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-0' : ''}
                                                >
                                                    {(user.plan || 'Free').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Select
                                                    defaultValue={user.plan || 'free'}
                                                    onValueChange={(val) => handlePlanUpdate(user.id, val as 'free' | 'plus' | 'pro')}
                                                >
                                                    <SelectTrigger className="w-[100px] ml-auto h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="plus">Plus</SelectItem>
                                                        <SelectItem value="pro">Pro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {t('admin.noUsersFound')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DELETED USERS TAB */}
                <TabsContent value="deleted" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-destructive" />
                                    {t('admin.deletedUsers')}
                                </CardTitle>
                                <CardDescription>
                                    {t('admin.deletedUsersDesc')}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {deletedUsers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>{t('admin.noDeletedUsers')}</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('admin.user')}</TableHead>
                                            <TableHead>{t('admin.email')}</TableHead>
                                            <TableHead>{t('admin.layout')}</TableHead>
                                            <TableHead>{t('admin.registerDate')}</TableHead>
                                            <TableHead>{t('admin.deletionDate')}</TableHead>
                                            <TableHead>{t('admin.deletedBy')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deletedUsers.map((user) => (
                                            <TableRow key={user.id} className="opacity-70">
                                                <TableCell className="font-medium">{user.full_name || "Isimsiz"}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{(user.plan || 'Free').toUpperCase()}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.original_created_at
                                                        ? new Date(user.original_created_at).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.deleted_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.deleted_by === 'admin' ? 'destructive' : 'secondary'}>
                                                        {user.deleted_by === 'admin' ? t('admin.admin') : t('admin.user')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FEEDBACKS TAB */}
                <TabsContent value="feedbacks" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-violet-600" />
                                        Geri Bildirimler & Sorun Bildirimleri
                                    </CardTitle>
                                    <CardDescription>
                                        Kullanıcılardan gelen tüm geri bildirimleri buradan takip edebilirsiniz
                                    </CardDescription>
                                </div>
                                {selectedFeedbackIds.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {selectedFeedbackIds.length} seçili
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedFeedbackIds([])}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Temizle
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {feedbacks.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Henüz geri bildirim bulunmuyor.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Toplu İşlemler Toolbar */}
                                    {selectedFeedbackIds.length > 0 && (
                                        <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 rounded-lg flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2 text-sm font-medium text-violet-900 dark:text-violet-100">
                                                <CheckSquare className="w-4 h-4" />
                                                {selectedFeedbackIds.length} geri bildirim seçili
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBulkStatusUpdate('pending')}
                                                    className="text-xs"
                                                >
                                                    Beklemeye Al
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBulkStatusUpdate('resolved')}
                                                    className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                                >
                                                    Çözüldü Yap
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBulkStatusUpdate('closed')}
                                                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                                >
                                                    Kapat
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" />
                                                            Toplu Sil
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Toplu Silme</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {selectedFeedbackIds.length} geri bildirimi ve tüm ekli dosyaları kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={handleBulkDelete}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                {selectedFeedbackIds.length} Geri Bildirimi Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    )}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={selectedFeedbackIds.length === feedbacks.length && feedbacks.length > 0}
                                                        onCheckedChange={toggleSelectAllFeedbacks}
                                                    />
                                                </TableHead>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>Kullanıcı</TableHead>
                                                <TableHead>Konu</TableHead>
                                                <TableHead>Mesaj</TableHead>
                                                <TableHead>Ekler</TableHead>
                                                <TableHead>Sayfa</TableHead>
                                                <TableHead>Durum</TableHead>
                                                <TableHead className="text-right">İşlem</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feedbacks.map((f) => (
                                                <TableRow key={f.id} className={selectedFeedbackIds.includes(f.id) ? "bg-violet-50 dark:bg-violet-950/20" : ""}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedFeedbackIds.includes(f.id)}
                                                            onCheckedChange={() => toggleSelectFeedback(f.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(f.created_at).toLocaleString('tr-TR')}
                                                    </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">{f.user_name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{f.user_email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    {f.subject}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] break-words">
                                                    {f.message}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                        {f.attachments?.map((url, idx) => {
                                                            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video');
                                                            return (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="relative w-8 h-8 rounded border overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                >
                                                                    {isVideo ? (
                                                                        <Film className="w-4 h-4 text-slate-500" />
                                                                    ) : (
                                                                        <NextImage src={url} alt="" fill className="object-cover" unoptimized />
                                                                    )}
                                                                </a>
                                                            )
                                                        })}
                                                        {(!f.attachments || f.attachments.length === 0) && (
                                                            <span className="text-[10px] text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[10px] text-violet-600 font-mono">
                                                    {f.page_url || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={f.status === 'pending' ? 'outline' : f.status === 'resolved' ? 'default' : 'secondary'}
                                                        className={cn(
                                                            "text-[10px] whitespace-nowrap",
                                                            f.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
                                                            f.status === 'resolved' && "bg-green-50 text-green-700 border-green-200"
                                                        )}
                                                    >
                                                        {f.status === 'pending' ? 'Beklemede' : f.status === 'resolved' ? 'Çözüldü' : 'Kapatıldı'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Select
                                                            defaultValue={f.status}
                                                            onValueChange={(val) => handleFeedbackStatusUpdate(f.id, val as Feedback['status'])}
                                                        >
                                                            <SelectTrigger className="w-[110px] h-7 text-[10px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Beklemede</SelectItem>
                                                                <SelectItem value="resolved">Çözüldü</SelectItem>
                                                                <SelectItem value="closed">Kapatıldı</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Geri Bildirimi Sil</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Bu geri bildirimi ve tüm ekli dosyaları kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleFeedbackDelete(f.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Sil
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ACTIVITY LOGS TAB */}
                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Aktivite Logları
                                    </CardTitle>
                                    <CardDescription>
                                        Tüm kullanıcı aktivitelerini buradan takip edebilirsiniz
                                    </CardDescription>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Toplam: <span className="font-semibold text-foreground">{logsTotalCount}</span> kayıt
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingLogs ? (
                                <div className="text-center py-8">Yükleniyor...</div>
                            ) : activityLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Henüz aktivite kaydı bulunmuyor.</p>
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>Kullanıcı</TableHead>
                                                <TableHead>İşlem</TableHead>
                                                <TableHead>Detay</TableHead>
                                                <TableHead>IP</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activityLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                        {new Date(log.created_at).toLocaleString('tr-TR')}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs">
                                                        {log.user_email || log.user_name || 'Anonim'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {log.activity_type || '-'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate" title={log.description}>
                                                        {log.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {log.ip_address || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {totalLogsPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <div className="text-sm text-muted-foreground">
                                                Sayfa {logsPage + 1} / {totalLogsPages}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleLogsPageChange(logsPage - 1)}
                                                    disabled={logsPage === 0 || loadingLogs}
                                                >
                                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                                    Önceki
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleLogsPageChange(logsPage + 1)}
                                                    disabled={logsPage >= totalLogsPages - 1 || loadingLogs}
                                                >
                                                    Sonraki
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
