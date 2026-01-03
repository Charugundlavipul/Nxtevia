import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { fetchApplicationsForApplicant, withdrawApplication, type Application } from "@/lib/applications";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import * as React from "react";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, LayoutDashboard, Briefcase, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SavedOpportunitiesSection } from "@/components/SavedOpportunitiesSection";

type OppMap = Record<string, { title: string; summary?: string }>;

export default function SeekerDashboard() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [oppMap, setOppMap] = React.useState<OppMap>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await fetchApplicationsForApplicant();
        setApps(list);

        const ids = Array.from(new Set(list.map((a) => a.opportunity_id)));
        if (ids.length) {
          const { data, error } = await supabase
            .from("opportunities")
            .select("id,title,problem,scope")
            .in("id", ids);
          if (error) throw error;
          const map: OppMap = {};
          (data || []).forEach((o: any) => {
            map[o.id] = { title: o.title, summary: o.problem || o.scope };
          });
          setOppMap(map);
        }
      } catch (err) {
        toast({
          title: "Could not load applications",
          description: err instanceof Error ? err.message : "Please try again.",
          duration: 2500,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withdraw = async (id: string) => {
    try {
      await withdrawApplication(id);
      setApps((list) => list.filter((a) => a.id !== id));
      toast({ title: "Withdrawn", description: "Application removed.", duration: 2000 });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Could not withdraw", duration: 2000 });
    }
  };

  const confirmWithdraw = (id: string) => {
    toast({
      title: "Withdraw application?",
      description: "This will remove your submission. You can apply again anytime.",
      action: (
        <ToastAction altText="Confirm withdraw" onClick={() => withdraw(id)}>
          Withdraw
        </ToastAction>
      ),
    });
  };

  const stats = React.useMemo(() => {
    return {
      total: apps.length,
      pending: apps.filter(a => a.status === 'pending').length,
      accepted: apps.filter(a => a.status === 'accepted').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
    };
  }, [apps]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return "bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200/50 dark:border-green-800";
      case 'rejected': return "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800";
      case 'submitted':
      case 'pending': return "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800";
      default: return "bg-slate-100/50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5" />;
      case 'submitted':
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      default: return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const containerAnimations = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnimations = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <Seo title="Your applications - NxteVia" canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 transition-colors duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-2000"
          />
        </div>

        {/* Header Section */}
        <div className="relative z-10 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl pb-8 pt-8">
          <div className="container max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                  Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                  Track your applications and manage your career journey.
                </p>
              </div>
              <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:scale-105 transition-all rounded-full px-6">
                <Link to="/seekers/opportunities">
                  Browse Opportunities <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              variants={containerAnimations}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
            >
              {[
                { icon: FileText, label: "Total Applications", value: stats.total, color: "blue" },
                { icon: Clock, label: "Pending", value: stats.pending, color: "yellow" },
                { icon: CheckCircle, label: "Accepted", value: stats.accepted, color: "green" },
                { icon: XCircle, label: "Rejected", value: stats.rejected, color: "red" },
              ].map((stat, i) => (
                <motion.div key={i} variants={itemAnimations}>
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        stat.color === 'blue' && "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                        stat.color === 'yellow' && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
                        stat.color === 'green' && "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
                        stat.color === 'red' && "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      )}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="relative z-10 container max-w-5xl py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mb-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Applications</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60">
                <Search className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </motion.div>

          <SavedOpportunitiesSection />

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse backdrop-blur-sm" />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-dashed border-slate-300 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <Briefcase className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No applications yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
                    You haven't applied to any opportunities yet. Start exploring to find your next project.
                  </p>
                  <Button asChild className="rounded-full shadow-lg shadow-primary/20">
                    <Link to="/seekers/opportunities">Explore Opportunities</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              variants={containerAnimations}
              initial="hidden"
              animate="show"
              className="grid gap-4"
            >
              <AnimatePresence mode="popLayout">
                {apps.map((a) => {
                  const meta = oppMap[a.opportunity_id];
                  return (
                    <motion.div
                      key={a.id}
                      variants={itemAnimations}
                      layout
                    >
                      <Card className="group bg-white/70 dark:bg-slate-900/70 border-white/50 dark:border-slate-800 backdrop-blur-md hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-start justify-between md:justify-start md:gap-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-white dark:hover:text-white transition-colors line-clamp-1">
                                  {meta?.title || "Opportunity"}
                                </h3>
                                <Badge variant="outline" className={cn("capitalize flex items-center gap-1.5 px-2.5 py-0.5 backdrop-blur-sm", getStatusColor(a.status))}>
                                  {getStatusIcon(a.status)}
                                  {a.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  Applied {new Date(a.created_at).toLocaleDateString()}
                                </span>
                                {meta?.summary && (
                                  <span className="hidden md:inline-block max-w-md truncate border-l pl-4 border-slate-200 dark:border-slate-700">
                                    {meta.summary}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800">
                              <Button size="sm" variant="outline" className="flex-1 md:flex-none border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm" asChild>
                                <Link to={`/seekers/applications/${a.id}`}>View Details</Link>
                              </Button>
                              {(a.status === 'pending' || a.status === 'submitted') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => confirmWithdraw(a.id)}
                                >
                                  Withdraw
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
