import Link from "next/link"
import { Package, FileText, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/actions/auth"
import { getCatalogs } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
  const [user, catalogs, products] = await Promise.all([getCurrentUser(), getCatalogs(), getProducts()])

  const recentCatalogs = catalogs.slice(0, 3)

  const stats = [
    {
      label: "Total Products",
      value: products.length.toString(),
      icon: Package,
      change: `${user?.maxProducts === 999999 ? "Unlimited" : `${products.length}/${user?.maxProducts} used`}`,
    },
    {
      label: "Catalogs Created",
      value: catalogs.length.toString(),
      icon: FileText,
      change: `${catalogs.filter((c) => !c.is_published).length} draft`,
    },
    {
      label: "Published",
      value: catalogs.filter((c) => c.is_published).length.toString(),
      icon: TrendingUp,
      change: "Live catalogs",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your catalogs today.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/builder">
            <Plus className="w-4 h-4" />
            New Catalog
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Catalogs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Catalogs</CardTitle>
            <CardDescription>Your latest product catalogs</CardDescription>
          </div>
          {catalogs.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link href="/dashboard/catalogs">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentCatalogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No catalogs yet. Create your first one!</p>
              <Button asChild>
                <Link href="/dashboard/builder">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Catalog
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCatalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{catalog.name}</p>
                      <p className="text-sm text-muted-foreground">{catalog.product_ids?.length || 0} products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={catalog.is_published ? "default" : "secondary"}>
                      {catalog.is_published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(catalog.updated_at), { addSuffix: true })}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/builder?id=${catalog.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary rounded-lg">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Add Products</h3>
              <p className="text-sm text-muted-foreground">Import from CSV or add manually</p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/products">Go to Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-secondary">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-foreground/10 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Browse Templates</h3>
              <p className="text-sm text-muted-foreground">Start with a professional design</p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/templates">View Templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
