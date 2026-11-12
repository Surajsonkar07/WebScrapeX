import { Skeleton } from '@/components/ui/misc';

export default function Loading() {
    return (
        <div className="space-y-8" aria-busy="true" aria-label="Loading">
            <div className="max-w-xl space-y-3 border-b border-border pb-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        </div>
    );
}
