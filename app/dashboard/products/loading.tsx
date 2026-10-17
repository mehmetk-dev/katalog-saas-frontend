import { Skeleton } from "@/components/ui/skeleton"

/** ProductsPageClient ile aynı ölçüler: yüklenince sayfa yerinden oynamasın */
export default function Loading() {
  return (
    <div className="space-y-5">
      {/* PageHeader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stok özeti şeridi */}
      <div className="flex divide-x overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-w-[8.5rem] flex-1 flex-col gap-2 px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>

      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-full rounded-md sm:max-w-md sm:flex-1" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="ml-auto h-9 w-[4.5rem] rounded-md" />
      </div>

      {/* Tablo */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden border-b bg-muted/40 px-4 py-2.5 md:block">
          <Skeleton className="h-3 w-full max-w-sm" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2.5">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="size-10 rounded-md" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="ml-auto hidden h-4 w-20 md:block" />
              <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
