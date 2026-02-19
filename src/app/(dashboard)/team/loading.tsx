import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-4 w-[320px]" />
      </div>

      {/* Invite form skeleton */}
      <div className="rounded-xl border p-6">
        <Skeleton className="mb-4 h-5 w-[200px]" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>

      {/* Members table skeleton */}
      <div className="rounded-xl border">
        <div className="border-b p-4">
          <Skeleton className="h-5 w-[120px]" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[160px]" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
