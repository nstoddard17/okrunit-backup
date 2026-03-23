import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function PlaygroundLoading() {
  return (
    <PageContainer wide>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-8">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Request builder */}
        <div className="space-y-6">
          <div className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-9 w-[180px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[120px]" />
                <Skeleton className="h-9 flex-1" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-7 w-[60px]" />
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-[200px] w-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]">
            <div className="space-y-4">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-9 w-[280px]" />
              <Skeleton className="h-[160px] w-full" />
            </div>
          </div>
        </div>

        {/* Right column: Response viewer */}
        <div className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-[80px]" />
            <Skeleton className="h-4 w-[260px]" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
