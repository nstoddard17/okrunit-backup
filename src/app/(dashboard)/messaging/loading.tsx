import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function MessagingLoading() {
  return (
    <PageContainer>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="h-4 w-[460px]" />
        </div>
      </div>

      <div className="space-y-8">
        {/* Platform cards grid — 4 columns */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border-0 border-t-[3px] border-t-zinc-200 shadow-[var(--shadow-card)]"
            >
              <div className="p-6 pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-[80px]" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-[80%]" />
              </div>
              <div className="p-6 pt-3">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Connected channels section */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-[140px]" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-[50px]" />
                      <Skeleton className="h-3 w-[80px]" />
                      <Skeleton className="h-3 w-[70px]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-[160px]" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
