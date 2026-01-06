import { Send } from "lucide-react";
import { ChatLayout } from "@/components/chat/ChatLayout";
import CompanyChatListPane from "./CompanyChatListPane";

// Note: In the new layout system, this component will be rendered inside the Outlet.
// But wait, the Layout ALREADY renders the Sidebar. 
// So this component should just render the "Empty State" div.

export default function CompanyChatPlaceholder() {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 h-full">
            <div className="text-center space-y-4">
                <div className="bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 p-6 rounded-full inline-flex mb-2 shadow-sm">
                    <Send className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Messages</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">Select a conversation from the list to start chatting with seekers.</p>
            </div>
        </div>
    );
}
