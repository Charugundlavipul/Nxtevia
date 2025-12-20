import { useIsUserOnline } from "@/lib/presence";
import { cn } from "@/lib/utils";

export function OnlineIndicator({ userId, className }: { userId: string | undefined; className?: string }) {
    const isOnline = useIsUserOnline(userId);
    if (!isOnline) return null;
    return (
        <div className={cn("absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-white", className)} />
    );
}
