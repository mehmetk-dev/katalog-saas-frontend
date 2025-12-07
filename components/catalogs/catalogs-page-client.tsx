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
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, Share2 } from "lucide-react"
import { deleteCatalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"

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
}

export function CatalogsPageClient({ initialCatalogs }: CatalogsPageClientProps) {
  const [catalogs, setCatalogs] = useState(initialCatalogs)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
      toast.error(result.error || "Silinemedi")
    }
    setDeleteId(null)
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/catalog/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Link kopyalandı!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kataloglarım</h1>
          <p className="text-muted-foreground">Oluşturduğunuz tüm katalogları yönetin</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/builder">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Katalog
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Katalog ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredCatalogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Henüz katalog yok</h3>
            <p className="text-sm text-muted-foreground mb-4">İlk katalogumu oluşturmak için başla</p>
            <Button asChild>
              <Link href="/dashboard/builder">Katalog Oluştur</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalogs.map((catalog) => (
            <Card key={catalog.id} className="group">
              <CardContent className="p-4">
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground/30">
                    {catalog.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{catalog.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{catalog.description || "Açıklama yok"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
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
                        </>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(catalog.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={catalog.is_published ? "default" : "secondary"}>
                    {catalog.is_published ? "Yayında" : "Taslak"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{catalog.product_ids?.length || 0} ürün</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Katalogu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz. Katalog kalıcı olarak silinecektir.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
