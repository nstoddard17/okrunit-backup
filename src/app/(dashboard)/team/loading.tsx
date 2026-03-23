import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function TeamLoading() {
  return (
    <PageContainer>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-4 w-[320px]" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-1 border-b">
        <Skeleton className="h-9 w-[80px]" />
        <Skeleton className="h-9 w-[90px]" />
        <Skeleton className="h-9 w-[70px]" />
      </div>

      {/* Invite form skeleton */}
      <div className="mb-6 rounded-xl border-0 p-6 shadow-[var(--shadow-card)]">
        <Skeleton className="mb-4 h-5 w-[200px]" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>

      {/* Members table skeleton */}
      <div className="rounded-xl border-0 shadow-[var(--shadow-card)]">
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
    </PageContainer>
  );
}
