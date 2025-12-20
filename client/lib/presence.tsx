import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
// If useSession is not available, we'll use the supabase client directly in useEffect

interface PresenceContextType {
    onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export const usePresence = () => useContext(PresenceContext);

export const useIsUserOnline = (userId: string | undefined) => {
    const { onlineUsers } = usePresence();
    if (!userId) return false;
    return onlineUsers.has(userId);
};

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [myId, setMyId] = useState<string | null>(null);

    useEffect(() => {
        // Get current user ID
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setMyId(user.id);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setMyId(session?.user.id || null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!myId) return;

        const channel = supabase.channel("global_presence", {
            config: {
                presence: {
                    key: myId,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const users = new Set<string>();

                // newState is an object where keys are presence keys (user IDs in our case)
                // and values are arrays of presence objects.
                Object.keys(newState).forEach((key) => {
                    users.add(key);
                });

                setOnlineUsers(users);
            })
            .on("presence", { event: "join" }, ({ key, newPresences }) => {
                setOnlineUsers((prev) => {
                    const next = new Set(prev);
                    next.add(key);
                    return next;
                });
            })
            .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
                setOnlineUsers((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [myId]);

    return (
        <PresenceContext.Provider value={{ onlineUsers }}>
            {children}
        </PresenceContext.Provider>
    );
};
