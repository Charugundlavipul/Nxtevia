import { ChatLayout } from "@/components/chat/ChatLayout";
import CompanyChatListPane from "./CompanyChatListPane";
import { Outlet, useParams } from "react-router-dom";
import { Send } from "lucide-react";

export default function CompanyChatPage() {
    const { conversationId } = useParams();

    // If we are at the root /company/chats, render the placeholder
    // If we have a conversationId, the Outlet will assume responsibility? 
    // Wait, ChatLayout expects children.
    // We need to render the Sidebar once, and then the content is either the placeholder OR the Outlet.

    // Actually, better pattern with React Router v6 nested routes:
    // The Layout renders the Sidebar and an <Outlet /> for the main content.
    // The "Index" route renders the placeholder.
    // The ":id" route renders the ChatWindow content.

    return (
        <ChatLayout sidebar={<CompanyChatListPane currentConversationId={conversationId} />}>
            <Outlet />
        </ChatLayout>
    );
}
