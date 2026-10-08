import { Skeleton } from "@/components/ui/skeleton"

export function BuilderSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-6 w-40 sm:w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="hidden h-9 w-40 rounded-md md:block" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="w-full space-y-4 border-r p-4 md:w-1/2 md:p-6">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="hidden flex-1 items-center justify-center bg-muted p-6 md:flex">
          <Skeleton className="aspect-[210/297] w-full max-w-sm rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default BuilderSkeleton
