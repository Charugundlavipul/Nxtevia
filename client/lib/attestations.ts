import { supabase } from "@/lib/supabase";

export interface LegalAttestation {
    id: string;
    company_id: string;
    job_id: string;
    attestation_type: string;
    version: string;
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
}

export const ATTESTATION_TYPES = {
    ESA_STUDENT_EXEMPTION: "ESA_STUDENT_EXEMPTION",
};

export async function createAttestation(
    jobId: string,
    type: string,
    version: string
): Promise<LegalAttestation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Attempt to get IP address (best effort from client side)
    let ipAddress = "unknown";
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        if (res.ok) {
            const json = await res.json();
            ipAddress = json.ip;
        }
    } catch (err) {
        console.warn("Failed to fetch IP for attestation", err);
    }

    const { data, error } = await supabase
        .from("legal_attestations")
        .insert({
            company_id: user.id,
            job_id: jobId,
            attestation_type: type,
            version: version,
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating attestation:", error);
        throw error;
    }

    return data;
}
