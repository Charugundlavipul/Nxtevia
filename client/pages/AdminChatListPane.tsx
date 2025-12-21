import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllConversations, findOrCreateConversation, subscribeToConversations, Conversation, searchUsers, UserProfile } from "@/lib/messaging";
import { useNavigate } from "react-router-dom";
import { Search, X, Plus, ArrowLeft, MessageSquare } from "lucide-react";
import * as React from "react";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminChatListPaneProps {
  currentConversationId?: string;
}

export default function AdminChatListPane({ currentConversationId }: AdminChatListPaneProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newChatSearch, setNewChatSearch] = React.useState("");
  const [showNewChat, setShowNewChat] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [adminId, setAdminId] = React.useState<string>("");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
      if (user) {
        setAdminId(user.id);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    if (!adminId) return;

    const refresh = async () => {
      try {
        const convs = await getAllConversations(adminId);
        setConversations(convs);
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    };

    refresh();

    const unsubscribe = subscribeToConversations(adminId, (payload) => {
      refresh();
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [adminId]);

  React.useEffect(() => {
    const search = async () => {
      if (!newChatSearch.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchUsers(newChatSearch);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [newChatSearch]);

  const startNewConversation = async (seekerId: string, seekerName: string) => {
    try {
      const conversationId = await findOrCreateConversation(
        adminId,
        "admin",
        seekerId,
        "seeker" // Defaulting to seeker, but could be company
      );
      navigate(`/admin/chats/${conversationId}`);
      setNewChatSearch("");
      setShowNewChat(false);
    } catch (error) {
      console.error("Failed to start conversation", error);
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} title="Back to Dashboard" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowNewChat(true)}
            className="flex-1 justify-start gap-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            New Conversation
          </Button>
        </div>

        {showNewChat && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Start chat</h3>
              <button onClick={() => { setShowNewChat(false); setNewChatSearch(""); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search user..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                autoFocus
              />
            </div>
            {newChatSearch.trim() && (
              <div className="max-h-48 overflow-y-auto space-y-1 pt-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {isSearching ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">No users found</p>
                ) : (
                  searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => startNewConversation(user.id, user.display_name)}
                      className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate text-slate-900 dark:text-white">{user.display_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user.role}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
          </div>
        ) : (
          filtered.map((conv) => {
            const otherParticipant = conv.participants.find(p => p.role !== "admin");
            const otherName = otherParticipant?.profile?.display_name || otherParticipant?.user_id || "User";
            const unreadCount = conv.unread_count || 0;
            const lastMsg = conv.last_message;
            const preview = lastMsg?.content ? (lastMsg.content.substring(0, 35) + (lastMsg.content.length > 35 ? "..." : "")) : "No messages yet";
            const isActive = conv.id === currentConversationId;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/admin/chats/${conv.id}`)}
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
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {otherName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={otherParticipant?.user_id} className="h-3 w-3 border-2 border-white dark:border-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-sm font-semibold truncate", isActive ? "text-blue-700 dark:text-white" : "text-slate-900 dark:text-white")}>
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
