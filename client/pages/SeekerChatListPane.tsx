import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllConversations, subscribeToConversations, Conversation } from "@/lib/messaging";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, MessageSquare } from "lucide-react";
import * as React from "react";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SeekerChatListPaneProps {
  currentConversationId?: string;
}

export default function SeekerChatListPane({ currentConversationId }: SeekerChatListPaneProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "unread">("all");
  const [seekerId, setSeekerId] = React.useState<string>("");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
      if (user) {
        setSeekerId(user.id);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    if (!seekerId || seekerId === "seeker_default") return;

    const refresh = async () => {
      try {
        const convs = await getAllConversations(seekerId);
        setConversations(convs);
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    };

    refresh();

    const unsubscribe = subscribeToConversations(seekerId, (payload) => {
      refresh();
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [seekerId]);

  const filtered = React.useMemo(() => {
    let result = conversations;

    if (filterType === "unread") {
      result = result.filter(c => (c.unread_count || 0) > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.job_title?.toLowerCase().includes(q) ||
        c.participants.some(p => (p.profile?.display_name || p.user_id).toLowerCase().includes(q))
      );
    }

    return result;
  }, [conversations, searchQuery, filterType]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seekers/dashboard')} title="Back to Dashboard" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                filterType === "all"
                  ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              All Chats
            </button>
            <button
              onClick={() => setFilterType("unread")}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                filterType === "unread"
                  ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Unread
            </button>
          </div>
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
              {searchQuery ? "No conversations found" : filterType === "unread" ? "No unread messages" : "No conversations yet"}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const otherParticipant = conv.participants.find(p => p.role !== "seeker");
            const otherName = otherParticipant?.profile?.display_name || (otherParticipant?.role === "admin" ? "Admin" : otherParticipant?.user_id) || "Company";
            const unreadCount = conv.unread_count || 0;
            const lastMsg = conv.last_message;
            const preview = lastMsg?.content ? (lastMsg.content.substring(0, 35) + (lastMsg.content.length > 35 ? "..." : "")) : "No messages yet";
            const isActive = conv.id === currentConversationId;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/seeker/chats/${conv.id}`)}
                className={cn(
                  "w-full p-3 rounded-xl transition-all text-left group border relative",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-slate-800"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className={cn(
                        "text-xs font-semibold",
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {otherParticipant?.role === "admin" ? "A" : otherName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={otherParticipant?.user_id} className="h-3 w-3 border-2 border-white dark:border-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-sm font-semibold truncate", isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white")}>
                        {otherParticipant?.role === "admin" ? "Admin" : otherName}
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
                        <Badge className="h-5 min-w-[1.25rem] px-1 flex items-center justify-center bg-blue-600 text-white text-[10px] rounded-full shadow-sm border-0">
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
    </div>
  );
}
