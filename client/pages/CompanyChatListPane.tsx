import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllConversations, findOrCreateConversation, subscribeToConversations, Conversation, searchUsers, UserProfile } from "@/lib/messaging";
import { fetchMyOpportunities, Opportunity } from "@/lib/opportunities";
import { fetchApplicationsForOpportunity, Application } from "@/lib/applications";
import { useNavigate } from "react-router-dom";
import { Search, X, Plus, ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import * as React from "react";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface CompanyChatListPaneProps {
  currentConversationId?: string;
}

export default function CompanyChatListPane({ currentConversationId }: CompanyChatListPaneProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [companyId, setCompanyId] = React.useState<string>("");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);

  // New Message State
  const [isNewMessageOpen, setIsNewMessageOpen] = React.useState(false);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [selectedOppId, setSelectedOppId] = React.useState<string>("");
  const [applicants, setApplicants] = React.useState<Application[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = React.useState<string>("");
  const [loadingOpps, setLoadingOpps] = React.useState(false);
  const [loadingApplicants, setLoadingApplicants] = React.useState(false);
  const [startingChat, setStartingChat] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
      if (user) {
        setCompanyId(user.id);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    if (!companyId) return;

    const refresh = async () => {
      try {
        const convs = await getAllConversations(companyId);
        setConversations(convs);
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    };

    refresh();

    const unsubscribe = subscribeToConversations(companyId, (payload) => {
      refresh();
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [companyId]);

  // Fetch opportunities when modal opens
  React.useEffect(() => {
    if (isNewMessageOpen && companyId) {
      setLoadingOpps(true);
      fetchMyOpportunities()
        .then(setOpportunities)
        .catch(err => console.error("Failed to fetch opportunities", err))
        .finally(() => setLoadingOpps(false));
    }
  }, [isNewMessageOpen, companyId]);

  // Fetch applicants when opportunity selected
  React.useEffect(() => {
    if (selectedOppId) {
      setLoadingApplicants(true);
      fetchApplicationsForOpportunity(selectedOppId)
        .then(setApplicants)
        .catch(err => console.error("Failed to fetch applicants", err))
        .finally(() => setLoadingApplicants(false));
    } else {
      setApplicants([]);
    }
    setSelectedApplicantId("");
  }, [selectedOppId]);

  const handleStartChat = async () => {
    if (!selectedApplicantId || !selectedOppId) return;

    setStartingChat(true);
    try {
      const opp = opportunities.find(o => o.id === selectedOppId);
      const conversationId = await findOrCreateConversation(
        companyId,
        "company",
        selectedApplicantId,
        "seeker",
        selectedOppId,
        opp?.title
      );
      setIsNewMessageOpen(false);
      navigate(`/company/chats/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
    } finally {
      setStartingChat(false);
    }
  };

  const filtered = React.useMemo(() => {
    let result = conversations;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.job_title?.toLowerCase().includes(q) ||
        c.participants.some(p => (p.profile?.display_name || p.user_id).toLowerCase().includes(q))
      );
    }

    return result;
  }, [conversations, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/company/dashboard')} title="Back to Dashboard" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Messages
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setIsNewMessageOpen(true)}
            title="New Message"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
              <MessageSquare className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <Button variant="link" onClick={() => setIsNewMessageOpen(true)} className="text-primary text-xs">
                Start a new conversation
              </Button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const otherParticipant = conv.participants.find(p => p.role === "seeker");
            const otherName = otherParticipant?.profile?.display_name || otherParticipant?.user_id || "Seeker";
            const unreadCount = conv.unread_count || 0;
            const lastMsg = conv.last_message;
            const preview = lastMsg?.content ? (lastMsg.content.substring(0, 35) + (lastMsg.content.length > 35 ? "..." : "")) : "No messages yet";
            const isActive = conv.id === currentConversationId;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/company/chats/${conv.id}`)}
                className={cn(
                  "w-full p-3 rounded-xl transition-all text-left group border relative",
                  isActive
                    ? "bg-primary/5 dark:bg-primary/20 border-primary/20 dark:border-primary/80 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-slate-800"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className={cn(
                        "text-xs font-semibold",
                        isActive
                          ? "bg-primary/10 dark:bg-primary/40 text-primary dark:text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {otherName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={otherParticipant?.user_id} className="h-3 w-3 border-2 border-white dark:border-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-sm font-semibold truncate", isActive ? "text-primary dark:text-white" : "text-slate-900 dark:text-white")}>
                        {otherName}
                      </span>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {new Date(lastMsg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate", unreadCount > 0 ? "font-medium text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                        {preview}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="h-5 min-w-[1.25rem] px-1 flex items-center justify-center bg-primary text-white text-[10px] rounded-full shadow-sm border-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Select an opportunity and applicant to start a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="opportunity">Opportunity</Label>
              <select
                id="opportunity"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                disabled={loadingOpps}
              >
                <option value="">Select an opportunity...</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title}
                  </option>
                ))}
              </select>
              {loadingOpps && <span className="text-xs text-slate-500">Loading opportunities...</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="applicant">Applicant</Label>
              <select
                id="applicant"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                value={selectedApplicantId}
                onChange={(e) => setSelectedApplicantId(e.target.value)}
                disabled={!selectedOppId || loadingApplicants}
              >
                <option value="">Select an applicant...</option>
                {applicants.map((app) => {
                  const snap = app.applicant_snapshot || {};
                  const profile = snap.profile || {};
                  const seeker = snap.seeker || {};
                  const name = profile.display_name || seeker.contact_email || "Applicant";
                  return (
                    <option key={app.applicant_id} value={app.applicant_id}>
                      {name}
                    </option>
                  );
                })}
              </select>
              {loadingApplicants && <span className="text-xs text-slate-500">Loading applicants...</span>}
              {!loadingApplicants && selectedOppId && applicants.length === 0 && (
                <span className="text-xs text-slate-500">No applicants found for this opportunity.</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleStartChat} disabled={!selectedApplicantId || startingChat}>
              {startingChat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
