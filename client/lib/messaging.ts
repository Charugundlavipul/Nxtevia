import { supabase } from "./supabase";

export type UserRole = "admin" | "company" | "seeker";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  attachments?: any[];
  sender?: {
    display_name: string;
    role: UserRole;
  };
}

export interface Participant {
  user_id: string;
  role: UserRole;
  joined_at: string;
  last_read_at?: string;
  profile?: {
    display_name: string;
    role?: UserRole;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  job_id?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  last_message?: Message;
  unread_count?: number;
}

export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`public:messages:conversation_id=eq.${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

export async function editMessage(messageId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", messageId);

  if (error) throw error;
}


export function subscribeToConversations(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`public:conversation_participants:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversation_participants",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

async function enrichConversations(conversations: any[], participations: any[]): Promise<Conversation[]> {
  // 1. Bulk fetch all unique participant profiles
  const allParticipantIds = new Set<string>();
  conversations.forEach(c => {
    c.participants.forEach((p: any) => allParticipantIds.add(p.user_id));
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .in("user_id", Array.from(allParticipantIds));

  const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]));

  const enrichedConversations = await Promise.all(
    conversations.map(async (conv) => {
      // Fetch last message (still per-row, hard to optimize without custom view/RPC)
      // Optimized to just fetch the ID and content to be lighter
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Map profiles from cache
      const participantsWithProfiles = conv.participants.map((p: any) => {
        const profile = profileMap.get(p.user_id);
        return {
          ...p,
          profile: profile || { display_name: "Unknown User", role: p.role }
        };
      });

      // Calculate unread count
      const myPart = participations.find((p) => p.conversation_id === conv.id);
      const lastRead = myPart?.last_read_at ? new Date(myPart.last_read_at) : new Date(0);

      let unreadCount = 0;
      if (myPart) {
        // We can optimization this by strictly counting > last_read
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("created_at", lastRead.toISOString());
        unreadCount = count || 0;
      }

      return {
        ...conv,
        participants: participantsWithProfiles,
        last_message: lastMsg || undefined,
        unread_count: unreadCount,
      };
    })
  );

  return enrichedConversations;
}

export async function getAllConversations(userId: string): Promise<Conversation[]> {
  console.log("Fetching conversations for user:", userId);
  const { data: participations, error: partError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (partError) {
    console.error("Error fetching participations:", partError);
    return [];
  }

  if (!participations || participations.length === 0) {
    console.log("No participations found for user:", userId);
    return [];
  }

  const conversationIds = participations.map((p) => p.conversation_id);

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        role,
        joined_at,
        last_read_at
      )
    `)
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (convError) {
    console.error("Error fetching conversations:", convError);
    return [];
  }

  return enrichConversations(conversations, participations);
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        role,
        joined_at,
        last_read_at
      )
    `)
    .eq("id", conversationId)
    .single();

  if (error || !conversation) return null;

  // Bulk fetch profiles
  const userIds = conversation.participants.map((p: any) => p.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .in("user_id", userIds);

  const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]));

  const participantsWithProfiles = conversation.participants.map((p: any) => ({
    ...p,
    profile: profileMap.get(p.user_id)
  }));

  return { ...conversation, participants: participantsWithProfiles };
}

export async function getMessages(conversationId: string, limit = 50): Promise<Message[]> {
  // Fetch latest messages (descending)
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Reverse to get chronological order (oldest -> newest) for display
  const chronMessages = (messages || []).reverse();

  // Bulk fetch profiles
  const senderIds = Array.from(new Set(chronMessages.map((m) => m.sender_id)));

  if (senderIds.length === 0) return chronMessages;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .in("user_id", senderIds);

  const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]));

  const messagesWithSenders = chronMessages.map((msg) => ({
    ...msg,
    sender: profileMap.get(msg.sender_id) || { display_name: "Unknown", role: "seeker" as UserRole }
  }));

  return messagesWithSenders;
}

export async function createConversation(
  participants: { userId: string; role: UserRole }[],
  jobId?: string,
  jobTitle?: string
): Promise<string> {
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({
      job_id: jobId,
      job_title: jobTitle,
    })
    .select()
    .single();

  if (convError) throw convError;

  const participantsData = participants.map((p) => ({
    conversation_id: conv.id,
    user_id: p.userId,
    role: p.role,
  }));

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participantsData);

  if (partError) throw partError;

  return conv.id;
}

export async function findOrCreateConversation(
  myId: string,
  myRole: UserRole,
  otherId: string,
  otherRole: UserRole,
  jobId?: string,
  jobTitle?: string
): Promise<string> {
  const myConvs = await getAllConversations(myId);
  const existing = myConvs.find((c) =>
    c.participants.length === 2 &&
    c.participants.some((p) => p.user_id === otherId)
  );

  if (existing) return existing.id;

  if (myRole === "seeker") {
    throw new Error("Seekers cannot start a new conversation.");
  }

  return createConversation(
    [
      { userId: myId, role: myRole },
      { userId: otherId, role: otherRole },
    ],
    jobId,
    jobTitle
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachments?: any[]
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    attachments,
  });

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

export interface UserProfile {
  id: string;
  display_name: string;
  role: UserRole;
  email?: string;
}

export async function searchUsers(query: string, role?: UserRole): Promise<UserProfile[]> {
  if (!query.trim()) return [];

  let queryBuilder = supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .ilike("display_name", `%${query}%`)
    .limit(20);

  if (role) {
    queryBuilder = queryBuilder.eq("role", role);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.user_id,
    display_name: p.display_name,
    role: p.role,
  }));
}

export async function uploadChatAttachment(conversationId: string, file: File): Promise<{ path: string }> {
  // Sanitize filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${conversationId}/${fileName}`;

  const { error } = await supabase.storage
    .from('attached-documents')
    .upload(filePath, file);

  if (error) throw error;

  return { path: filePath };
}

export async function getAttachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('attached-documents')
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }

  return data.signedUrl;
}
