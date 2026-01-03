import { supabase } from "./supabase";
import type { Opportunity } from "./opportunities";

export async function toggleBookmark(opportunityId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to bookmark");

    // Check if exists
    const { data: existing, error: checkError } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
        // Remove
        const { error: deleteError } = await supabase
            .from("bookmarks")
            .delete()
            .eq("id", existing.id);
        if (deleteError) throw deleteError;
        return false; // Not bookmarked
    } else {
        // Add
        const { error: insertError } = await supabase
            .from("bookmarks")
            .insert({
                user_id: user.id,
                opportunity_id: opportunityId
            });
        if (insertError) throw insertError;
        return true; // Bookmarked
    }
}

export async function checkIsBookmarked(opportunityId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

    if (error) return false;
    return !!data;
}

export async function fetchBookmarks(): Promise<Opportunity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("bookmarks")
        .select(`
      opportunity_id,
      opportunities:opportunity_id (
        *
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform nested response flat
    // @ts-ignore
    return data.map((d: any) => d.opportunities).filter(Boolean) as Opportunity[];
}
