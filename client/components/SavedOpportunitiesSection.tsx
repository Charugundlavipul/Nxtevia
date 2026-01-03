import * as React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowRight, Building2, MapPin, Clock } from "lucide-react";
import { fetchBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { type Opportunity } from "@/lib/opportunities";
import { toast } from "@/components/ui/use-toast";

export function SavedOpportunitiesSection() {
    const [bookmarks, setBookmarks] = React.useState<Opportunity[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchBookmarks()
            .then(setBookmarks)
            .catch((err) => console.error("Failed to load bookmarks", err))
            .finally(() => setLoading(false));
    }, []);

    const remove = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await toggleBookmark(id);
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
            toast({ title: "Removed", description: "Opportunity removed from saved items." });
        } catch (err) {
            toast({ title: "Error", description: "Could not remove bookmark", variant: "destructive" });
        }
    };

    if (loading) return null; // Or a skeleton
    if (bookmarks.length === 0) return null;

    return (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Saved Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {bookmarks.map((opp) => (
                        <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                        >
                            <Link to={`/seekers/opportunities/${opp.id}`} className="block h-full">
                                <Card className="h-full bg-white/70 dark:bg-slate-900/70 border-white/50 dark:border-slate-800 backdrop-blur-md hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800">
                                                    {opp.modality}
                                                </Badge>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 -mr-2 -mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                                    onClick={(e) => remove(opp.id, e)}
                                                >
                                                    <Bookmark className="h-4 w-4 fill-current" />
                                                </Button>
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {opp.title}
                                            </h3>
                                            {/* Company Name would be nice here if available in join */}
                                        </div>

                                        <div className="space-y-2 mb-6 flex-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                {opp.duration} • {opp.hours} hrs/wk
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                {/* Stipend info */}
                                                <span className="capitalize">{opp.stipend}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                                            View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
