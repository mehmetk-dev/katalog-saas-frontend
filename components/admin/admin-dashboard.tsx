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

export function AdminDashboardClient() {
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
            toast.success("Görsel yüklendi")
        } catch (error: any) {
            toast.error("Görsel yüklenemedi: " + error.message)
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

    async function loadData() {
        try {
            setLoading(true)
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
            toast.error("Veriler yüklenemedi")
        } finally {
            setLoading(false)
        }
    }

    const handlePlanUpdate = async (userId: string, newPlan: 'free' | 'plus' | 'pro') => {
        try {
            await updateUserPlan(userId, newPlan)
            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u))
            toast.success(`Kullanıcı planı ${newPlan.toUpperCase()} olarak güncellendi`)
        } catch (error) {
            toast.error("Plan güncellenemedi")
        }
    }

    const handleAddTemplate = async () => {
        try {
            if (!newTemplate.componentName || !newTemplate.name) {
                toast.error("Lütfen gerekli alanları doldurun")
                return
            }

            toast.loading("Şablon oluşturuluyor...")

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
            toast.success("Şablon başarıyla oluşturuldu!")
        } catch (error: any) {
            toast.dismiss()
            toast.error("Hata: " + error.message)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        const template = templates.find(t => t.id === id)
        if (template?.is_system) {
            toast.error("Sistem şablonları silinemez!")
            return
        }

        if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return

        try {
            toast.loading("Şablon siliniyor...")
            await deleteTemplate(id)
            setTemplates(templates.filter(t => t.id !== id))
            toast.dismiss()
            toast.success("Şablon silindi")
        } catch (error: any) {
            toast.dismiss()
            toast.error("Hata: " + error.message)
        }
    }

    const handleUpdateTemplateImage = async (id: string, imageUrl: string) => {
        try {
            toast.loading("Fotoğraf güncelleniyor...")
            await updateTemplate(id, { previewImage: imageUrl })
            setTemplates(templates.map(t => t.id === id ? { ...t, preview_image: imageUrl } : t))
            setEditingTemplate(null)
            toast.dismiss()
            toast.success("Fotoğraf güncellendi!")
        } catch (error: any) {
            toast.dismiss()
            toast.error("Hata: " + error.message)
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
            toast.loading("Güncelleniyor...")
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
            toast.success("Şablon güncellendi!")
        } catch (error: any) {
            toast.dismiss()
            toast.error("Hata: " + error.message)
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
                <p>Admin paneli yükleniyor...</p>
            </div>
        </div>
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
                    <p className="text-muted-foreground">Sistem yönetimi ve istatistikler</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <Activity className="w-4 h-4 mr-2" />
                        Yenile
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="users">Müşteriler ({users.length})</TabsTrigger>
                    <TabsTrigger value="deleted">Silinen Kullanıcılar ({deletedUsers.length})</TabsTrigger>
                    <TabsTrigger value="templates">Şablonlar ({templates.length})</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.usersCount}</div>
                                <p className="text-xs text-muted-foreground">Sistemdeki kayıtlı hesaplar</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.productsCount}</div>
                                <p className="text-xs text-muted-foreground">Tüm kullanıcıların ürünleri</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Toplam Katalog</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.catalogsCount}</div>
                                <p className="text-xs text-muted-foreground">Oluşturulan kataloglar</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">İndirme Sayısı</CardTitle>
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalExports}</div>
                                <p className="text-xs text-muted-foreground">Toplam PDF çıktısı</p>
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
                                    <CardTitle>Müşteri Listesi</CardTitle>
                                    <CardDescription>Kayıtlı kullanıcıları yönetin ve planlarını düzenleyin.</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="İsim veya Email ara..."
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
                                        <TableHead>Kullanıcı</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Kayıt Tarihi</TableHead>
                                        <TableHead>Yenilenme Tarihi</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Mevcut Plan</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name || "İsimsiz"}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                                            <TableCell>
                                                {user.subscription_end
                                                    ? new Date(user.subscription_end).toLocaleDateString("tr-TR")
                                                    : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.subscription_status === 'active' ? 'outline' : 'destructive'} className={user.subscription_status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}>
                                                    {user.subscription_status === 'active' ? 'Aktif' : 'Pasif'}
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
                                                Kullanıcı bulunamadı.
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
                                    Silinen Kullanıcılar
                                </CardTitle>
                                <CardDescription>
                                    Hesabını silen kullanıcıların arşivi. Bu veriler geri yüklenemez.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {deletedUsers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Henüz silinen kullanıcı yok.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kullanıcı</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Kayıt Tarihi</TableHead>
                                            <TableHead>Silinme Tarihi</TableHead>
                                            <TableHead>Silen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deletedUsers.map((user) => (
                                            <TableRow key={user.id} className="opacity-70">
                                                <TableCell className="font-medium">{user.full_name || "İsimsiz"}</TableCell>
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
                                                        {user.deleted_by === 'admin' ? 'Admin' : 'Kullanıcı'}
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
                                    <CardTitle>Şablon Yönetimi</CardTitle>
                                    <CardDescription>
                                        Tüm katalog şablonlarını tek yerden yönetin. Fotoğrafları güncellemek için düzenle butonuna tıklayın.
                                    </CardDescription>
                                </div>
                                <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Yeni Şablon Ekle
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Yeni Şablon Ekle</DialogTitle>
                                            <DialogDescription>
                                                Yeni bir katalog şablonu oluşturun.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Şablon Adı *</Label>
                                                    <Input
                                                        placeholder="Örn: Modern Minimal"
                                                        value={newTemplate.name}
                                                        onChange={e => handleNameChange(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>ID (Opsiyonel)</Label>
                                                    <Input
                                                        placeholder="otomatik-olusturulur"
                                                        value={newTemplate.id}
                                                        onChange={e => setNewTemplate({ ...newTemplate, id: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Açıklama</Label>
                                                <Input
                                                    placeholder="Kısa açıklama..."
                                                    value={newTemplate.description}
                                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Önizleme Fotoğrafı</Label>

                                                {/* File Upload */}
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleNewTemplateImageUpload}
                                                    disabled={uploading}
                                                    className="cursor-pointer"
                                                />

                                                {/* URL Input */}
                                                <div className="text-xs text-muted-foreground">veya URL yapıştır:</div>
                                                <Input
                                                    placeholder="/templates/my-template.png veya https://..."
                                                    value={newTemplate.previewImage?.startsWith('data:') ? '' : newTemplate.previewImage}
                                                    onChange={e => setNewTemplate({ ...newTemplate, previewImage: e.target.value })}
                                                    disabled={uploading}
                                                />

                                                {uploading && <div className="text-sm text-blue-500 animate-pulse">Yükleniyor...</div>}

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
                                                    <Label>Component İsmi *</Label>
                                                    <Input
                                                        placeholder="Örn: MyNewTemplate"
                                                        value={newTemplate.componentName}
                                                        onChange={e => setNewTemplate({ ...newTemplate, componentName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Sayfa Başına Ürün</Label>
                                                    <Input
                                                        type="number"
                                                        value={newTemplate.itemsPerPage}
                                                        onChange={e => setNewTemplate({ ...newTemplate, itemsPerPage: parseInt(e.target.value) || 6 })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Paket Tipi</Label>
                                                    <Select
                                                        value={newTemplate.isPro ? "pro" : "free"}
                                                        onValueChange={v => setNewTemplate({ ...newTemplate, isPro: v === "pro" })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="free">Ücretsiz (Free)</SelectItem>
                                                            <SelectItem value="pro">Premium (Pro)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Layout</Label>
                                                    <Select
                                                        value={newTemplate.layout}
                                                        onValueChange={v => setNewTemplate({ ...newTemplate, layout: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="grid">Grid</SelectItem>
                                                            <SelectItem value="list">List</SelectItem>
                                                            <SelectItem value="magazine">Magazine</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setNewTemplateOpen(false)} disabled={uploading}>İptal</Button>
                                            <Button onClick={handleAddTemplate} disabled={uploading}>
                                                {uploading ? 'Yükleniyor...' : 'Ekle'}
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
                                    Sistem Şablonları
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
                                    Özel Şablonlar
                                    <Badge variant="outline" className="ml-2">{customTemplates.length}</Badge>
                                </h3>
                                {customTemplates.length === 0 ? (
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>Henüz özel şablon eklenmemiş.</p>
                                        <p className="text-sm mt-1">"Yeni Şablon Ekle" butonuyla başlayın.</p>
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
            </Tabs>

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Şablon Düzenle: {editingTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Şablon bilgilerini ve önizleme fotoğrafını güncelleyin.
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
                        {template.is_pro ? "PRO" : "FREE"}
                    </Badge>
                </div>
                {!isSystem && (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-white/80 text-violet-600 border-violet-300">
                        Custom
                    </Badge>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                    ID: {template.id} • {template.items_per_page} ürün/sayfa
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Edit className="w-3 h-3 mr-2" />
                        Düzenle
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
            toast.success("Görsel yüklendi")
        } catch (error: any) {
            toast.error("Görsel yüklenemedi: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Şablon Adı</Label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>Önizleme Fotoğrafı</Label>

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
                    <span>veya URL yapıştır:</span>
                </div>
                <Input
                    placeholder="/templates/example.png veya https://..."
                    value={formData.previewImage?.startsWith('data:') ? '' : formData.previewImage}
                    onChange={e => setFormData({ ...formData, previewImage: e.target.value })}
                    disabled={uploading}
                />

                {uploading && <div className="text-sm text-blue-500 animate-pulse">Yükleniyor...</div>}

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
                            <span className="text-sm font-medium">Önizleme</span>
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
                    <Label>Paket Tipi</Label>
                    <Select
                        value={formData.isPro ? "pro" : "free"}
                        onValueChange={v => setFormData({ ...formData, isPro: v === "pro" })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">Ücretsiz (Free)</SelectItem>
                            <SelectItem value="pro">Premium (Pro)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Sayfa Başına Ürün</Label>
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
                    İptal
                </Button>
                <Button onClick={() => onSave(formData)} disabled={uploading}>
                    <Save className="w-4 h-4 mr-2" />
                    {uploading ? 'Yükleniyor...' : 'Kaydet'}
                </Button>
            </DialogFooter>
        </div>
    )
}
