import { Skeleton } from '@/components/ui/misc';

export default function Loading() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading result">
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-4">
                <Skeleton className="size-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-none" />
                ))}
            </div>
            <div className="flex gap-4 border-b border-border pb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                ))}
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}
