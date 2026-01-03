import { useState } from "react";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, LogOut, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Banned() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("Account Suspension Appeal");
    const [description, setDescription] = useState("");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate("/login");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast({ title: "Description required", description: "Please explain why you are appealing.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Fetch profile for required name/role fields
            // Try seeker first, then company
            let role = "student";
            let name = "Unknown User";

            const { data: seeker } = await supabase.from("seeker_profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle();
            if (seeker) {
                role = "student";
                name = `${seeker.first_name} ${seeker.last_name}`;
            } else {
                const { data: company } = await supabase.from("company_profiles").select("company_name").eq("user_id", user.id).maybeSingle();
                if (company) {
                    role = "company";
                    name = company.company_name;
                } else {
                    // Fallback to metadata
                    name = user.user_metadata?.name || user.email || "Unknown";
                    const metaRole = user.user_metadata?.role;
                    // Normalize role to schema constraints
                    if (metaRole === "company") role = "company";
                    else if (metaRole === "admin") role = "admin";
                    else role = "student"; // Default to student for 'seeker' or any other value
                }
            }

            const { error } = await supabase
                .from("tickets")
                .insert({
                    creator_id: user.id,
                    title: `APPEAL: ${subject}`, // Map subject -> title
                    description: description,
                    category: "other", // 'appeal' not in allowed enum list
                    status: "pending", // Schema default is pending
                    creator_name: name,
                    creator_role: role
                });

            if (error) throw error;

            toast({
                title: "Appeal Submitted",
                description: "Our team will review your request. You will be notified via email."
            });
            setDescription("");
            setSubject("Account Suspension Appeal"); // Reset subject
        } catch (err: any) {
            console.error("Appeal error:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to submit appeal.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-50 relative overflow-hidden">
            {/* Background pattern for 'Lockdown' feel */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            <Seo title="Account Suspended" description="Your account has been suspended." canonical={window.location.href} />

            <Card className="max-w-md w-full border-red-900/50 shadow-2xl bg-slate-900/50 backdrop-blur-xl relative z-10">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-white tracking-tight">Access Denied</CardTitle>
                        <CardDescription className="text-slate-400 mt-2 text-base">
                            Your account has been suspended due to a violation of our terms.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-red-500/10 p-4 rounded-xl text-sm text-red-200 border border-red-500/20 flex gap-3">
                        <div className="shrink-0 mt-0.5 w-1 h-1 bg-red-500 rounded-full" />
                        <p>All platform features (jobs, applications, chat) are currently locked using a dedicated security policy.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-slate-300">Case Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled
                                className="bg-slate-950/50 border-slate-800 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-300">Appeal Statement</Label>
                            <Textarea
                                id="description"
                                placeholder="Explain why your account should be reinstated..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[120px] bg-slate-950/50 border-slate-800 text-slate-200 focus:border-blue-500/50"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20" disabled={loading}>
                            {loading ? "Submitting..." : (
                                <>
                                    <Send className="w-4 h-4 mr-2" /> Submit Appeal
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-slate-800">
                        <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/50" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
