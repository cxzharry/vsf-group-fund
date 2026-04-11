"use client";

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-lg border p-3 space-y-2">
      <div className="h-4 w-2/3 rounded bg-muted" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 w-1/2 rounded bg-muted" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
