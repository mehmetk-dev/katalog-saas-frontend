"use client"

import { useEffect, useState } from "react"
import { Users, Package, FileText, Download, Activity, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAdminStats, getAdminUsers, getDeletedUsers, updateUserPlan } from "@/lib/actions/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n-provider"

export function AdminDashboardClient() {
    const { t } = useTranslation()
    const supabase = createClient()

    const [stats, setStats] = useState({
        usersCount: 0,
        productsCount: 0,
        catalogsCount: 0,
        totalExports: 0,
        deletedUsersCount: 0
    })
    const [users, setUsers] = useState<any[]>([])
    const [deletedUsers, setDeletedUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [activityLogs, setActivityLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [logsPage, setLogsPage] = useState(0)
    const [logsTotalCount, setLogsTotalCount] = useState(0)
    const LOGS_PER_PAGE = 20

    useEffect(() => {
        loadData()
    }, [])

    const fetchActivityLogs = async (page: number = 0) => {
        setLoadingLogs(true)
        try {
            // Get total count
            const { count } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })

            setLogsTotalCount(count || 0)

            // Get paginated data
            const from = page * LOGS_PER_PAGE
            const to = from + LOGS_PER_PAGE - 1

            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) {
                console.error('Error fetching logs:', error.message)
            } else {
                setActivityLogs(data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoadingLogs(false)
        }
    }

    const handleLogsPageChange = (newPage: number) => {
        setLogsPage(newPage)
        fetchActivityLogs(newPage)
    }

    const totalLogsPages = Math.ceil(logsTotalCount / LOGS_PER_PAGE)

    async function loadData() {
        try {
            setLoading(true)
            fetchActivityLogs()
            const statsData = await getAdminStats()
            setStats(statsData)

            setLoadingUsers(true)
            const [usersData, deletedUsersData] = await Promise.all([
                getAdminUsers(),
                getDeletedUsers()
            ])
            setUsers(usersData)
            setDeletedUsers(deletedUsersData)
            setLoadingUsers(false)
        } catch (error) {
            console.error("Failed to load admin data")
            toast.error(t('toasts.errorOccurred'))
        } finally {
            setLoading(false)
        }
    }

    const handlePlanUpdate = async (userId: string, newPlan: 'free' | 'plus' | 'pro') => {
        try {
            await updateUserPlan(userId, newPlan)
            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
            toast.success(`${t('toasts.profileUpdated')} (${newPlan.toUpperCase()})`)
        } catch (error) {
            toast.error(t('toasts.profileUpdateFailed'))
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
                                                    onValueChange={(val) => handlePlanUpdate(user.id, val as any)}
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
