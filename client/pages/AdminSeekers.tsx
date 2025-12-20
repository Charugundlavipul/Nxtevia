import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { Eye, Search, Users, User, Mail, Calendar, MapPin, ChevronRight, GraduationCap } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type AdminSeekerPreview = {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  joinedAt: string;
};

export default function AdminSeekers() {
  const [list, setList] = React.useState<AdminSeekerPreview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, country, created_at")
          .eq("role", "seeker")
          .order("created_at", { ascending: false });
        if (profileError) throw profileError;
        const ids = (profiles ?? []).map((p) => p.user_id).filter(Boolean);
        let seekerExtras: Record<string, { contact_email?: string | null; career_stage?: string | null; country?: string | null }> = {};
        if (ids.length > 0) {
          const { data: extras, error: extrasError } = await supabase
            .from("seeker_profiles")
            .select("user_id, contact_email, career_stage, country")
            .in("user_id", ids);
          if (extrasError) throw extrasError;
          for (const row of extras ?? []) {
            if (row?.user_id) {
              seekerExtras[row.user_id] = row;
            }
          }
        }
        const hydrated = (profiles ?? []).map((profile) => {
          const extra = seekerExtras[profile.user_id] ?? {};
          return {
            id: profile.user_id,
            name: profile.display_name || "Seeker",
            email: extra.contact_email || "",
            role: extra.career_stage || "Seeker",
            country: extra.country || profile.country || "—",
            joinedAt: profile.created_at || new Date().toISOString(),
          };
        });
        if (active) setList(hydrated);
      } catch (err) {
        console.error("Failed to load seekers", err);
        if (active) setError("Unable to load seekers right now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = list.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Seo title="Admin – Seekers" description="Manage seekers" canonical={typeof window !== "undefined" ? window.location.href : ""} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Seekers
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and view all seeker profiles registered on the platform.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Seekers</CardTitle>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{list.length}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered candidates</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Seeker Directory</CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 m-4 rounded-xl border border-red-100 dark:border-red-900/20">
                  <div className="flex justify-center mb-2"><User className="h-6 w-6" /></div>
                  {error}
                </div>
              ) : loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">No seekers found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="pl-6 font-medium text-slate-500 dark:text-slate-400">Seeker</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Role</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Country</TableHead>
                        <TableHead className="font-medium text-slate-500 dark:text-slate-400">Joined</TableHead>
                        <TableHead className="text-right pr-6 font-medium text-slate-500 dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="pl-6 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                <AvatarFallback className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                                  {s.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Mail className="h-3 w-3" />
                                  {s.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {s.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              {s.country}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              {new Date(s.joinedAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="sm" asChild className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Link to={`/admin/view_seekers/${s.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
