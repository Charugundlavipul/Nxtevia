import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoadingState() {
    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 border-b p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>

            {/* Messages Skeleton */}
            <div className="flex-1 space-y-4 p-4">
                {/* Left message (Other) */}
                <div className="flex items-start gap-3 w-3/4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-10 w-full rounded-2xl rounded-tl-none" />
                        <Skeleton className="h-4 w-12 ml-2" />
                    </div>
                </div>

                {/* Right message (Me) */}
                <div className="flex items-start gap-3 w-3/4 ml-auto flex-row-reverse">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-16 w-full rounded-2xl rounded-tr-none" />
                        <Skeleton className="h-4 w-12 mr-2 ml-auto" />
                    </div>
                </div>

                {/* Left message (Other) */}
                <div className="flex items-start gap-3 w-1/2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-20 w-full rounded-2xl rounded-tl-none" />
                        <Skeleton className="h-4 w-12 ml-2" />
                    </div>
                </div>
            </div>

            {/* Input Skeleton */}
            <div className="border-t p-4">
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        </div>
    );
}
