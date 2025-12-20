import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { fetchTickets, reopenTicket, updateTicketStatus, TICKET_CATEGORIES, type Ticket } from "@/lib/tickets";
import Layout from "@/components/Layout";
import * as React from "react";
import {
  ChevronRight,
  X,
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  RefreshCw,
  Ticket as TicketIcon,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { cn } from "@/lib/utils";

export default function AdminTickets() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [filter, setFilter] = React.useState<"all" | "pending" | "resolved">("pending");
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const { session } = useAdminSession();
  const adminName = (session?.user?.user_metadata as any)?.name || session?.user?.email || "Admin";

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets();
      setTickets(data);
      if (selectedTicketId && !data.some((t) => t.id === selectedTicketId)) {
        setSelectedTicketId(null);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
      setError("Unable to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedTicketId]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) ?? null : null;

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket.id, "resolved", {
        resolvedById: session?.user?.id,
        resolvedByName: adminName,
        notes: resolutionNotes || undefined,
      });
      toast({
        title: "Ticket closed",
        description: "The support ticket has been marked as resolved.",
      });
      setResolutionNotes("");
      await loadTickets();
    } catch (err) {
      console.error("Failed to close ticket", err);
      toast({
        title: "Unable to close ticket",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      await reopenTicket(ticketId);
      toast({
        title: "Ticket reopened",
        description: "The support ticket has been reopened.",
      });
      setSelectedTicketId(null);
      await loadTickets();
    } catch (err) {
      console.error("Failed to reopen ticket", err);
      toast({
        title: "Unable to reopen ticket",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.createdBy.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categoryLabel = selectedTicket
    ? TICKET_CATEGORIES.find((c) => c.value === selectedTicket.category)?.label || selectedTicket.category
    : "";

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === "pending").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <Layout>
      <Seo title="Support Tickets – NxteVia Admin" canonical={typeof window !== "undefined" ? window.location.href : ""} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

        <section className="container py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <TicketIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Support Tickets
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage user support requests and resolve issues efficiently.
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tickets</CardTitle>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All time tickets</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</CardTitle>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting response</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolved</CardTitle>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolved}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Successfully closed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Tickets</CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                          placeholder="Search tickets..."
                          className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" size="icon" onClick={loadTickets} disabled={loading} className="h-9 w-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={filter === "pending" ? "default" : "outline"}
                      onClick={() => setFilter("pending")}
                      size="sm"
                      className={cn("h-8 rounded-full text-xs", filter === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filter === "resolved" ? "default" : "outline"}
                      onClick={() => setFilter("resolved")}
                      size="sm"
                      className={cn("h-8 rounded-full text-xs", filter === "resolved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700")}
                    >
                      Resolved
                    </Button>
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      onClick={() => setFilter("all")}
                      size="sm"
                      className={cn("h-8 rounded-full text-xs", filter === "all" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700")}
                    >
                      All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {error ? (
                    <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 m-4 rounded-xl border border-red-100 dark:border-red-900/20">
                      <div className="flex justify-center mb-2"><AlertCircle className="h-6 w-6" /></div>
                      {error}
                    </div>
                  ) : loading && tickets.length === 0 ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />)}
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
                        <TicketIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tickets found</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                          <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="pl-6 font-medium text-slate-500 dark:text-slate-400">Subject</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">From</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Status</TableHead>
                            <TableHead className="font-medium text-slate-500 dark:text-slate-400">Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTickets.map((ticket) => (
                            <TableRow
                              key={ticket.id}
                              className={cn(
                                "cursor-pointer border-slate-100 dark:border-slate-800 transition-colors",
                                selectedTicketId === ticket.id
                                  ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                              )}
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              <TableCell className="pl-6 py-3">
                                <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{ticket.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-slate-700 dark:text-slate-300">{ticket.createdBy.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{ticket.createdBy.role}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={ticket.status === "resolved" ? "secondary" : "default"} className={cn("capitalize", ticket.status === 'resolved' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50")}>
                                  {ticket.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail Sidebar */}
            <div className="space-y-6">
              {selectedTicket ? (
                <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-800 shadow-sm sticky top-6 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg leading-tight text-slate-900 dark:text-white">{selectedTicket.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="font-normal border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {categoryLabel}
                          </Badge>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            #{selectedTicket.id.slice(0, 8)}
                          </span>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => {
                          setSelectedTicketId(null);
                          setResolutionNotes("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      {/* Reporter Info */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900 dark:text-white">{selectedTicket.createdBy.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {selectedTicket.createdBy.role}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">Description</Label>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
                          {selectedTicket.description}
                        </div>
                      </div>

                      {/* Resolution Section */}
                      {selectedTicket.status === "resolved" ? (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                            <CheckCircle2 className="h-4 w-4" /> Resolved
                          </div>
                          <div className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                            {selectedTicket.notes || "No resolution notes provided."}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500 pt-3 border-t border-green-200/50 dark:border-green-900/30">
                            Closed by {selectedTicket.resolvedByName || "Admin"} on {selectedTicket.resolvedAt ? new Date(selectedTicket.resolvedAt).toLocaleDateString() : "—"}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => handleReopenTicket(selectedTicket.id)}
                            disabled={loading}
                          >
                            Reopen Ticket
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <Label htmlFor="notes" className="text-slate-900 dark:text-white">Resolution Notes</Label>
                          <Textarea
                            id="notes"
                            rows={4}
                            placeholder="Describe how the issue was resolved..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="resize-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                          />
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" onClick={handleCloseTicket} disabled={loading}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                      <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-slate-900 dark:text-white">No ticket selected</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Select a ticket from the list to view details and take action.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
