import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { Paperclip } from "lucide-react";
import { getAttachmentUrl } from "@/lib/messaging";

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        created_at: string;
        sender_id: string;
        sender?: {
            display_name: string;
            role?: string;
        };
        attachments?: any[];
    };
    isMe: boolean;
    showAvatar?: boolean;
    showSenderName?: boolean;
}

import { deleteMessage, editMessage } from "@/lib/messaging";
import { MoreVertical, Edit2, Key, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function MessageBubble({ message, isMe, showAvatar = true, showSenderName = true }: MessageBubbleProps) {
    const senderName = isMe ? "You" : (message.sender?.display_name || "User");
    const initials = senderName.charAt(0).toUpperCase();

    const [isEditing, setIsEditing] = React.useState(false);
    const [editContent, setEditContent] = React.useState(message.content);

    const isEditable = isMe && (Date.now() - new Date(message.created_at).getTime() < 30 * 60 * 1000);

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        try {
            await editMessage(message.id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to edit message", error);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this message?")) {
            try {
                await deleteMessage(message.id);
            } catch (error) {
                console.error("Failed to delete message", error);
            }
        }
    };

    return (
        <div className={cn("flex gap-3 mb-4 group animate-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
            {!isMe && showAvatar && (
                <div className="relative mt-1 flex-shrink-0">
                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={message.sender_id} className="h-2.5 w-2.5 border-[1.5px] border-white dark:border-slate-900" />
                </div>
            )}
            {!isMe && !showAvatar && <div className="w-8 flex-shrink-0" />}

            <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                {!isMe && showSenderName && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1 mb-1">{senderName}</span>
                )}

                <div className="relative group/bubble">
                    {isEditing ? (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="h-8 text-sm min-w-[200px]"
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSaveEdit}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words transition-all",
                                isMe
                                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-blue-500/20"
                                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm hover:shadow-md dark:hover:bg-slate-800/80"
                            )}
                        >
                            {message.content}

                            {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-3 space-y-1.5 pt-2 border-t border-white/20 dark:border-slate-700/50">
                                    {message.attachments.map((att: any) => (
                                        <AttachmentItem key={att.id} attachment={att} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions Menu */}
                    {isEditable && !isEditing && (
                        <div className={cn("absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity", isMe ? "-left-8" : "-right-8")}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <MoreVertical className="h-3 w-3 text-slate-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isMe ? "end" : "start"}>
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <span className={cn("text-[10px] text-slate-400 dark:text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity", isMe ? "mr-1" : "ml-1")}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
}

function AttachmentItem({ attachment }: { attachment: any }) {
    const [url, setUrl] = React.useState<string | null>(
        (attachment.url && !attachment.url.startsWith("blob:")) ? attachment.url : null
    );

    React.useEffect(() => {
        if (!url && attachment.path) {
            getAttachmentUrl(attachment.path).then(u => {
                if (u) setUrl(u);
            });
        }
    }, [attachment.path, url]);

    return (
        <a
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "flex items-center gap-2 text-xs bg-black/5 dark:bg-white/10 p-2 rounded-md transition-colors",
                url ? "hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer" : "opacity-70 cursor-wait"
            )}
            onClick={(e) => {
                if (!url) e.preventDefault();
            }}
        >
            <Paperclip className="h-3.5 w-3.5 opacity-70" />
            <span className="truncate max-w-[150px] font-medium">{attachment.name}</span>
        </a>
    );
}
