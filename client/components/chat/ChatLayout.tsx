import * as React from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/site/Header";

interface ChatLayoutProps {
    children: React.ReactNode;
    className?: string;
    sidebar?: React.ReactNode;
}

export function ChatLayout({ children, className, sidebar }: ChatLayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Header />
            <div className={cn("flex flex-1 overflow-hidden relative", className)}>
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 pointer-events-none" />

                {sidebar && (
                    <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hidden md:flex flex-col z-20 shadow-sm">
                        {sidebar}
                    </aside>
                )}
                <main className="flex-1 flex flex-col relative min-w-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-3xl">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function ChatHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-6 justify-between shadow-sm", className)}>
            {children}
        </div>
    );
}

export function ChatInputArea({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 mt-auto", className)}>
            <div className="max-w-4xl mx-auto">
                {children}
            </div>
        </div>
    );
}
