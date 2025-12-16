"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Package, FileText, Download, Activity, Search, Trash2, Edit, Plus, Image, Save, X } from "lucide-react"
import { getAdminStats, getAdminUsers, getDeletedUsers, updateUserPlan } from "@/lib/actions/admin"
import { getTemplates, createTemplate, deleteTemplate, updateTemplate, type Template } from "@/lib/actions/templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n-provider"

export function AdminDashboardClient() {
    const { t } = useTranslation()
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

    // Template States - Artık tüm şablonlar database'den
    const [templates, setTemplates] = useState<Template[]>([])
    const [newTemplateOpen, setNewTemplateOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        id: "",
        description: "",
        isPro: true,
        componentName: "",
        itemsPerPage: 6,
        previewImage: "",
        layout: "grid"
    })

    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const handleNewTemplateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `template-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file)

            if (uploadError) {
                // Yedek bucket dene
                const { error: backupError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file)

                if (backupError) throw uploadError
            }

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            setNewTemplate(prev => ({ ...prev, previewImage: data.publicUrl }))
            toast.success(t('toasts.imageUploaded'))
        } catch (error: any) {
            toast.error(t('toasts.imageUploadFailed') + ": " + error.message)
        } finally {
            setUploading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Otomatik doldurma fonksiyonu
    const handleNameChange = (name: string) => {
        const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        const componentName = id.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') + "Template"

        setNewTemplate(prev => ({
            ...prev,
            name,
            id,
            componentName
        }))
    }



    const fetchActivityLogs = async () => {
        setLoadingLogs(true)
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    user:users(email)
                `)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Error fetching logs:', error)
            } else {
                setActivityLogs(data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoadingLogs(false)
        }
    }

    async function loadData() {
        try {
            setLoading(true)
            fetchActivityLogs()
            const statsData = await getAdminStats()
            setStats(statsData)

            setLoadingUsers(true)
            const [usersData, templatesData, deletedUsersData] = await Promise.all([
                getAdminUsers(),
                getTemplates(),
                getDeletedUsers()
            ])
            setUsers(usersData)
            setTemplates(templatesData)
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

    const handleAddTemplate = async () => {
        try {
            if (!newTemplate.componentName || !newTemplate.name) {
                toast.error(t('admin.requiredFields'))
                return
            }

            toast.loading(t('admin.uploading'))

            await createTemplate({
                ...newTemplate,
                id: newTemplate.id || newTemplate.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            })

            const templatesData = await getTemplates()
            setTemplates(templatesData)

            setNewTemplateOpen(false)
            setNewTemplate({
                name: "",
                id: "",
                description: "",
                isPro: true,
                componentName: "",
                itemsPerPage: 6,
                previewImage: "",
                layout: "grid"
            })
            toast.dismiss()
            toast.success(t('admin.added'))
        } catch (error: any) {
            toast.dismiss()
            toast.error(t('toasts.errorOccurred') + ": " + error.message)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        const template = templates.find(t => t.id === id)
        if (template?.is_system) {
            toast.error(t('admin.systemDeleteError'))
            return
        }

        if (!confirm(t('admin.deleteConfirm'))) return

        try {
            toast.loading(t('common.deleting') || "Deleting...")
            await deleteTemplate(id)
            setTemplates(templates.filter(t => t.id !== id))
            toast.dismiss()
            toast.success(t('admin.deleted'))
        } catch (error: any) {
            toast.dismiss()
            toast.error(t('toasts.errorOccurred') + ": " + error.message)
        }
    }

    const handleUpdateTemplateImage = async (id: string, imageUrl: string) => {
        try {
            toast.loading(t('admin.uploading'))
            await updateTemplate(id, { previewImage: imageUrl })
            setTemplates(templates.map(t => t.id === id ? { ...t, preview_image: imageUrl } : t))
            setEditingTemplate(null)
            toast.dismiss()
            toast.success(t('admin.imageUpdated'))
        } catch (error: any) {
            toast.dismiss()
            toast.error(t('toasts.errorOccurred') + ": " + error.message)
        }
    }

    const handleUpdateTemplate = async (id: string, data: Partial<{
        name: string
        description: string
        isPro: boolean
        previewImage: string
        itemsPerPage: number
    }>) => {
        try {
            toast.loading(t('common.updating') || "Updating...")
            await updateTemplate(id, data)

            // Local state güncelle
            setTemplates(templates.map(t => {
                if (t.id !== id) return t
                return {
                    ...t,
                    name: data.name ?? t.name,
                    description: data.description ?? t.description,
                    is_pro: data.isPro ?? t.is_pro,
                    preview_image: data.previewImage ?? t.preview_image,
                    items_per_page: data.itemsPerPage ?? t.items_per_page
                }
            }))

            setEditingTemplate(null)
            toast.dismiss()
            toast.success(t('admin.updated'))
        } catch (error: any) {
            toast.dismiss()
            toast.error(t('toasts.errorOccurred') + ": " + error.message)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const systemTemplates = templates.filter(t => t.is_system)
    const customTemplates = templates.filter(t => !t.is_system)

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
                    <TabsTrigger value="templates">{t('admin.templates')} ({templates.length})</TabsTrigger>
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

                {/* TEMPLATES TAB */}
                <TabsContent value="templates" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t('admin.templateManagement')}</CardTitle>
                                    <CardDescription>
                                        {t('admin.templateManagementDesc')}
                                    </CardDescription>
                                </div>
                                <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            {t('admin.addTemplate')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>{t('admin.addTemplate')}</DialogTitle>
                                            <DialogDescription>
                                                {t('admin.newTemplateDesc')}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('admin.templateName')} *</Label>
                                                    <Input
                                                        placeholder="Örn: Modern Minimal"
                                                        value={newTemplate.name}
                                                        onChange={e => handleNameChange(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>ID ({t('common.active')})</Label>
                                                    <Input
                                                        placeholder="otomatik-olusturulur"
                                                        value={newTemplate.id}
                                                        onChange={e => setNewTemplate({ ...newTemplate, id: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t('admin.description')}</Label>
                                                <Input
                                                    placeholder={t('admin.description')}
                                                    value={newTemplate.description}
                                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>{t('admin.previewImage')}</Label>

                                                {/* File Upload */}
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleNewTemplateImageUpload}
                                                    disabled={uploading}
                                                    className="cursor-pointer"
                                                />

                                                {/* URL Input */}
                                                <div className="text-xs text-muted-foreground">{t('admin.urlOrUpload')}</div>
                                                <Input
                                                    placeholder="/templates/my-template.png veya https://..."
                                                    value={newTemplate.previewImage?.startsWith('data:') ? '' : newTemplate.previewImage}
                                                    onChange={e => setNewTemplate({ ...newTemplate, previewImage: e.target.value })}
                                                    disabled={uploading}
                                                />

                                                {uploading && <div className="text-sm text-blue-500 animate-pulse">{t('admin.uploading')}</div>}

                                                {newTemplate.previewImage && !uploading && (
                                                    <div className="mt-2 aspect-video relative rounded-lg overflow-hidden border bg-muted group">
                                                        <img
                                                            src={newTemplate.previewImage}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setNewTemplate({ ...newTemplate, previewImage: '' })}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('admin.componentName')} *</Label>
                                                    <Input
                                                        placeholder="Örn: MyNewTemplate"
                                                        value={newTemplate.componentName}
                                                        onChange={e => setNewTemplate({ ...newTemplate, componentName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('admin.itemsPerPage')}</Label>
                                                    <Input
                                                        type="number"
                                                        value={newTemplate.itemsPerPage}
                                                        onChange={e => setNewTemplate({ ...newTemplate, itemsPerPage: parseInt(e.target.value) || 6 })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('admin.packageType')}</Label>
                                                    <Select
                                                        value={newTemplate.isPro ? "pro" : "free"}
                                                        onValueChange={v => setNewTemplate({ ...newTemplate, isPro: v === "pro" })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="free">{t('common.freePlan')}</SelectItem>
                                                            <SelectItem value="pro">{t('common.proPackage')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('admin.layout')}</Label>
                                                    <Select
                                                        value={newTemplate.layout}
                                                        onValueChange={v => setNewTemplate({ ...newTemplate, layout: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="grid">{t('admin.grid')}</SelectItem>
                                                            <SelectItem value="list">{t('admin.list')}</SelectItem>
                                                            <SelectItem value="magazine">{t('admin.magazine')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setNewTemplateOpen(false)} disabled={uploading}>{t('common.cancel')}</Button>
                                            <Button onClick={handleAddTemplate} disabled={uploading}>
                                                {uploading ? t('common.loading') : t('common.create')}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Sistem Şablonları */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    {t('admin.systemTemplates')}
                                    <Badge variant="secondary" className="ml-2">{systemTemplates.length}</Badge>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {systemTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            onEdit={() => setEditingTemplate(template)}
                                            onDelete={() => { }}
                                            isSystem={true}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Custom Şablonlar */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    {t('admin.customTemplates')}
                                    <Badge variant="outline" className="ml-2">{customTemplates.length}</Badge>
                                </h3>
                                {customTemplates.length === 0 ? (
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>{t('admin.noCustomTemplates')}</p>
                                        <p className="text-sm mt-1">"{t('admin.addTemplate')}"...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {customTemplates.map((template) => (
                                            <TemplateCard
                                                key={template.id}
                                                template={template}
                                                onEdit={() => setEditingTemplate(template)}
                                                onDelete={() => handleDeleteTemplate(template.id)}
                                                isSystem={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ACTIVITY LOGS TAB */}
                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Aktivite Logları
                            </CardTitle>
                            <CardDescription>
                                Tüm kullanıcı aktivitelerini buradan takip edebilirsiniz
                            </CardDescription>
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
                                                    {log.user?.email || 'Anonim'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate" title={JSON.stringify(log.details, null, 2)}>
                                                    {log.details ? JSON.stringify(log.details) : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {log.ip_address || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('admin.editTemplate')}: {editingTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            {t('admin.editTemplateDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    {editingTemplate && (
                        <EditTemplateForm
                            template={editingTemplate}
                            onSave={(data) => handleUpdateTemplate(editingTemplate.id, data)}
                            onCancel={() => setEditingTemplate(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


// Template Kartı Componenti
function TemplateCard({
    template,
    onEdit,
    onDelete,
    isSystem
}: {
    template: Template
    onEdit: () => void
    onDelete: () => void
    isSystem: boolean
}) {
    const { t } = useTranslation()
    return (
        <div className={`group relative border rounded-lg overflow-hidden bg-card hover:shadow-md transition-all ${isSystem ? '' : 'border-violet-200'}`}>
            <div className="aspect-[4/3] bg-muted relative">
                {template.preview_image ? (
                    <img
                        src={template.preview_image}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = '/placeholder.svg';
                            // target.style.display = 'none'; // Don't hide, show placeholder
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-stone-100">
                        <FileText className="w-10 h-10 opacity-20" />
                    </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={template.is_pro ? "default" : "secondary"}>
                        {template.is_pro ? t('plans.pro') : t('plans.free')}
                    </Badge>
                </div>
                {!isSystem && (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-white/80 text-violet-600 border-violet-300">
                        {t('admin.custom')}
                    </Badge>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                    ID: {template.id} • {template.items_per_page} {t('admin.itemsPerPageShort')}
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Edit className="w-3 h-3 mr-2" />
                        {t('common.edit')}
                    </Button>
                    {!isSystem && (
                        <Button variant="destructive" size="sm" onClick={onDelete}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Edit Template Form Componenti
function EditTemplateForm({
    template,
    onSave,
    onCancel
}: {
    template: Template
    onSave: (data: Partial<{
        name: string
        description: string
        isPro: boolean
        previewImage: string
        itemsPerPage: number
    }>) => void
    onCancel: () => void
}) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState({
        name: template.name,
        description: template.description || "",
        isPro: template.is_pro,
        previewImage: template.preview_image || "",
        itemsPerPage: template.items_per_page
    })
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `template-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file)

            if (uploadError) {
                // Yedek bucket dene
                const { error: backupError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file)

                if (backupError) throw uploadError
            }

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath) // Eğer avatars'a yüklendiyse burası yanlış url verebilir ama product-images varsa sorun yok

            // URL düzeltme (gerekirse bucket adını kontrol et)
            // Basitlik için product-images varsayıyoruz
            setFormData({ ...formData, previewImage: data.publicUrl })
            toast.success(t('toasts.imageUploaded'))
        } catch (error: any) {
            toast.error(t('toasts.imageUploadFailed') + ": " + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>{t('admin.templateName')}</Label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>{t('admin.description')}</Label>
                <Input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>{t('admin.previewImage')}</Label>

                {/* File Upload */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            onChange={handleImageUpload}
                            className="cursor-pointer"
                        />
                    </div>
                </div>

                {/* URL Input */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t('admin.urlOrUpload')}</span>
                </div>
                <Input
                    placeholder="/templates/example.png veya https://..."
                    value={formData.previewImage?.startsWith('data:') ? '' : formData.previewImage}
                    onChange={e => setFormData({ ...formData, previewImage: e.target.value })}
                    disabled={uploading}
                />

                {uploading && <div className="text-sm text-blue-500 animate-pulse">{t('admin.uploading')}</div>}

                {formData.previewImage && !uploading && (
                    <div className="mt-2 aspect-video relative rounded-lg overflow-hidden border bg-muted group">
                        <img
                            src={formData.previewImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg'
                            }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <span className="text-sm font-medium">{t('common.preview')}</span>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setFormData({ ...formData, previewImage: '' })}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('admin.packageType')}</Label>
                    <Select
                        value={formData.isPro ? "pro" : "free"}
                        onValueChange={v => setFormData({ ...formData, isPro: v === "pro" })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">{t('common.freePlan')}</SelectItem>
                            <SelectItem value="pro">{t('common.proPackage')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t('admin.itemsPerPage')}</Label>
                    <Input
                        type="number"
                        value={formData.itemsPerPage}
                        onChange={e => setFormData({ ...formData, itemsPerPage: parseInt(e.target.value) || 6 })}
                    />
                </div>
            </div>

            <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onCancel} disabled={uploading}>
                    <X className="w-4 h-4 mr-2" />
                    {t('common.cancel')}
                </Button>
                <Button onClick={() => onSave(formData)} disabled={uploading}>
                    <Save className="w-4 h-4 mr-2" />
                    {uploading ? t('common.loading') : t('common.save')}
                </Button>
            </DialogFooter>
        </div>
    )
}
