"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, Share2, Lock, QrCode, Download } from "lucide-react"
import { deleteCatalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"
import { CatalogPreview } from "./catalog-preview"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

interface Catalog {
  id: string
  name: string
  description: string | null
  layout: string
  is_published: boolean
  share_slug: string | null
  product_ids: string[]
  created_at: string
  updated_at: string
}

interface CatalogsPageClientProps {
  initialCatalogs: Catalog[]
  userProducts: any[]
  userPlan?: "free" | "plus" | "pro"
}

// Plan limitleri
const CATALOG_LIMITS = {
  free: 1,
  plus: 10,
  pro: Infinity,
}

import { useSearchParams } from "next/navigation"

export function CatalogsPageClient({ initialCatalogs, userProducts, userPlan = "free" }: CatalogsPageClientProps) {
  const searchParams = useSearchParams()
  const [catalogs, setCatalogs] = useState(initialCatalogs)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(searchParams.get("limit_reached") === "true")
  const [qrCatalog, setQrCatalog] = useState<{ name: string; slug: string } | null>(null)

  const maxCatalogs = CATALOG_LIMITS[userPlan]
  const isAtLimit = catalogs.length >= maxCatalogs
  const isFreeUser = userPlan === "free"

  const filteredCatalogs = catalogs.filter(
    (catalog) =>
      catalog.name.toLowerCase().includes(search.toLowerCase()) ||
      catalog.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteCatalog(deleteId)
    if (result.success) {
      setCatalogs(catalogs.filter((c) => c.id !== deleteId))
      toast.success("Katalog silindi")
    } else {
      toast.error((result as any).error || "Silinemedi")
    }
    setDeleteId(null)
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/catalog/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Link kopyalandı!")
  }

  const handleNewCatalog = () => {
    if (isAtLimit) {
      setShowLimitModal(true)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Kataloglarım</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Oluşturduğunuz tüm katalogları yönetin
            {isFreeUser && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {catalogs.length}/{maxCatalogs} katalog
              </Badge>
            )}
          </p>
        </div>
        {isAtLimit ? (
          <Button onClick={handleNewCatalog} className="w-full sm:w-auto gap-2">
            <Lock className="w-4 h-4" />
            Yeni Katalog
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/builder">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Katalog
            </Link>
          </Button>
        )}
      </div>

      {/* Limit Warning for Free Users */}
      {isFreeUser && isAtLimit && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium">Katalog limitine ulaştınız</p>
                <p className="text-sm text-muted-foreground">Free planda 1 katalog oluşturabilirsiniz</p>
              </div>
            </div>
            <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/pricing">Planı Yükselt</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Katalog ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Catalogs Grid */}
      {filteredCatalogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1 text-sm sm:text-base">Henüz katalog yok</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center">İlk katalogumu oluşturmak için başla</p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/builder">Katalog Oluştur</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredCatalogs.map((catalog) => {
            const catalogProducts = Array.isArray(userProducts) ? userProducts.filter((p) => catalog.product_ids?.includes(p.id)) : []

            return (
              <Card key={catalog.id} className="group overflow-hidden bg-white hover:shadow-md transition-shadow border-0 shadow-sm ring-1 ring-gray-200">
                <CardContent className="p-0 relative bg-gray-50/50">
                  {/* Preview Container using ResponsiveContainer */}
                  <div className="relative group-hover:opacity-95 transition-opacity border-b">
                    <ResponsiveContainer>
                      <CatalogPreview
                        layout={catalog.layout}
                        name={catalog.name}
                        products={catalogProducts}
                      />
                    </ResponsiveContainer>

                    {/* Overlay for Edit */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 duration-300">
                      <Button variant="secondary" size="default" className="rounded-full px-4 sm:px-8 font-semibold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300" asChild>
                        <Link href={`/dashboard/builder?id=${catalog.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Düzenle
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="p-3 sm:p-4 border-t bg-white relative z-20">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/builder?id=${catalog.id}`} className="hover:underline">
                          <h3 className="font-semibold truncate text-sm sm:text-base text-gray-900">{catalog.name}</h3>
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{catalog.description || "Açıklama yok"}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 text-gray-500 hover:text-gray-900 h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/builder?id=${catalog.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Düzenle
                            </Link>
                          </DropdownMenuItem>
                          {catalog.is_published && catalog.share_slug && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/catalog/${catalog.share_slug}`} target="_blank">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyShareLink(catalog.share_slug!)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Linki Kopyala
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setQrCatalog({ name: catalog.name, slug: catalog.share_slug! })}>
                                <QrCode className="w-4 h-4 mr-2" />
                                QR Kod
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(catalog.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
                      <Badge variant={catalog.is_published ? "default" : "secondary"} className="rounded-sm font-normal text-xs">
                        {catalog.is_published ? "Yayında" : "Taslak"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{catalog.product_ids?.length || 0} ürün</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Katalogu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Bu işlem geri alınamaz. Katalog kalıcı olarak silinecektir.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              Katalog Limitine Ulaştınız
            </DialogTitle>
            <DialogDescription>
              Free planda sadece 1 katalog oluşturabilirsiniz. Daha fazla katalog için planınızı yükseltin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Free</span>
              <span className="text-muted-foreground">1 katalog</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
              <span className="font-medium text-violet-700">Plus</span>
              <span className="text-violet-600">10 katalog</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <span className="font-medium text-amber-700">Pro</span>
              <span className="text-amber-600">Sınırsız</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitModal(false)}>
              Daha Sonra
            </Button>
            <Button asChild className="bg-violet-600 hover:bg-violet-700">
              <Link href="/pricing">Planları İncele</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={!!qrCatalog} onOpenChange={() => setQrCatalog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR Kod: {qrCatalog?.name}
            </DialogTitle>
            <DialogDescription>
              Müşterileriniz bu kodu okutarak kataloğa erişebilir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-dashed">
            {qrCatalog && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/catalog/${qrCatalog.slug}`)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            )}
            {qrCatalog && (
              <p className="mt-4 text-xs text-muted-foreground text-center max-w-[200px]">
                {`${window.location.origin}/catalog/${qrCatalog.slug}`}
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => {
              const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/catalog/${qrCatalog?.slug}`)}`;
              window.open(url, '_blank');
            }}>
              <Download className="w-4 h-4 mr-2" />
              Yüksek Çözünürlük İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


