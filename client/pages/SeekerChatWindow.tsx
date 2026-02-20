import { ChatLayout, ChatHeader, ChatInputArea } from "@/components/chat/ChatLayout";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getConversation, getMessages, sendMessage, subscribeToMessages, markAsRead, uploadChatAttachment, Message, Conversation } from "@/lib/messaging";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Paperclip, Smile, MoreHorizontal, X, ArrowLeft, User } from "lucide-react";
import SeekerChatListPane from "./SeekerChatListPane";
import * as React from "react";
import { toast } from "@/components/ui/use-toast";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ChatLoadingState } from "@/components/chat/ChatLoadingState";

export default function SeekerChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [seekerId, setSeekerId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  const emojis = ['😀', '😂', '😍', '😭', '😎', '🔥', '👍', '🙌', '❤️', '💯', '✨', '🚀', '😊', '😇', '😅', '😆'];

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSeekerId(user.id);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    if (!conversationId || !seekerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [conv, msgs] = await Promise.all([
          getConversation(conversationId),
          getMessages(conversationId, 50)
        ]);

        setConversation(conv);
        setMessages(msgs);
        if (conv) {
          await markAsRead(conversationId, seekerId);
        }
      } catch (error) {
        console.error("Failed to load conversation", error);
      } finally {
        setLoading(false);
      }
    };

    load();

    const unsubscribe = subscribeToMessages(conversationId, (payload) => {
      if (payload.eventType === "INSERT") {
        setMessages((prev) => [...prev, payload.new]);
        markAsRead(conversationId, seekerId);
      } else if (payload.eventType === "UPDATE") {
        setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      } else if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [conversationId, seekerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const otherParticipant = conversation?.participants.find(p => p.role !== "seeker");
  const displayName = otherParticipant?.profile?.display_name || (otherParticipant?.role === "admin" ? "Admin" : otherParticipant?.user_id) || "Company";
  const initials = displayName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "A";
  const otherUserId = otherParticipant?.user_id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !conversationId) return;

    let attachments;

    if (selectedFiles.length > 0) {
      try {
        const uploaded = await Promise.all(selectedFiles.map(async (file) => {
          const { path } = await uploadChatAttachment(conversationId, file);
          return {
            id: `${Date.now()}_${Math.random()}`,
            name: file.name,
            type: (file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'document') as any,
            size: file.size,
            path: path
          };
        }));
        attachments = uploaded;
      } catch (err) {
        console.error("Upload failed", err);
        toast({
          title: "Upload Failed",
          description: "Failed to upload attachments. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      await sendMessage(
        conversationId,
        seekerId,
        message,
        attachments
      );

      setMessage("");
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Message not sent",
        description: err instanceof Error ? err.message : "Unable to send your message right now.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const groupMessagesByDate = (msgs: typeof messages) => {
    const groups: { date: string; messages: typeof messages }[] = [];
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString();
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading && messages.length === 0) {
    return (
      <ChatLayout
        sidebar={<SeekerChatListPane currentConversationId={conversationId} />}
      >
        <ChatLoadingState />
      </ChatLayout>
    );
  }

  if (!conversationId) {
    return (
      <ChatLayout sidebar={<SeekerChatListPane currentConversationId={undefined} />}>
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-center space-y-4">
            <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-6 rounded-full inline-flex mb-2 shadow-sm">
              <Send className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Messages</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">Select a conversation from the list to start chatting.</p>
          </div>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout sidebar={<SeekerChatListPane currentConversationId={conversationId} />}>
      <Seo
        title={`Chat with ${displayName} – Seeker`}
        description="View conversation"
        canonical={typeof window !== "undefined" ? window.location.href : ""}
      />

      <ChatHeader>
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => navigate("/seeker/chats")} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <OnlineIndicator userId={otherUserId} className="h-3 w-3 border-2 border-white dark:border-slate-900" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate text-slate-900 dark:text-white">{displayName}</h1>
            {conversation?.job_title && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conversation.job_title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {otherUserId && otherParticipant?.role !== 'admin' && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              onClick={() => navigate(`/profile/${otherUserId}`)}
            >
              <User className="h-3.5 w-3.5" />
              View Profile
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </ChatHeader>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="space-y-8 max-w-3xl mx-auto">
          {messageGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                <Smile className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-2 text-slate-400 dark:text-slate-500 rounded-full border border-slate-100 dark:border-slate-800">
                      {group.date}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {group.messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMe={msg.sender_id === seekerId}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="bg-slate-100 dark:bg-slate-800 rounded-md pl-3 pr-2 py-1.5 flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="truncate max-w-[200px] text-xs font-medium">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInputArea>
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-6 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-3 grid grid-cols-8 gap-1 z-20 w-80 animate-in fade-in zoom-in-95 duration-200">
            {emojis.map((emoji, idx) => (
              <button key={idx} onClick={() => { handleEmojiClick(emoji); setShowEmojiPicker(false); }} className="text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-2 transition-colors">
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
          <div className="flex gap-1 pb-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button> */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2.5 min-h-[44px] max-h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() && selectedFiles.length === 0}
            size="icon"
            className="h-9 w-9 rounded-xl shrink-0 mb-0.5 transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </ChatInputArea>
    </ChatLayout>
  );
}
