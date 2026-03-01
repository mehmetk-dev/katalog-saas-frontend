import { Skeleton } from "@/components/ui/skeleton"

export default function BuilderLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      {/* Toolbar skeleton */}
      <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="w-1/2 border-r p-6 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>

          {/* Search + filter */}
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-18 rounded-md" />
          </div>

          {/* Product cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-1/2 bg-slate-100 dark:bg-[#03040a] flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="aspect-[210/297] w-full rounded-lg" />
            <div className="flex justify-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
