import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionValid, setSessionValid] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if there is an active session (which happens after clicking the reset link)
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setSessionValid(true);
            } else {
                // If no session, they might have lost the hash fragment or link expired
                setSessionValid(false);
            }
        });

        // Also listen for auth state changes just in case
        const string = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                setSessionValid(true);
            } else if (event === "SIGNED_OUT") {
                setSessionValid(false);
            }
        });

        return () => {
            string.data.subscription.unsubscribe();
        };
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        if (password !== confirmPassword) {
            toast({ title: "Passwords match error", description: "Passwords do not match.", duration: 3000 });
            return;
        }
        if (password.length < 6) {
            toast({ title: "Accout security", description: "Password must be at least 6 characters.", duration: 3000 });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast({ title: "Success", description: "Password has been updated. You can now sign in.", duration: 4000 });

            // Sign out to force clean login or redirect to dashboard? 
            // Usually good UX is to keep them logged in, but let's redirect to login for clarity
            // or just redirect to home/dashboard if already authed. 
            // Supabase keeps session active.

            navigate("/login");
        } catch (err) {
            toast({ title: "Reset failed", description: err instanceof Error ? err.message : "Could not update password", duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    if (sessionValid === null) {
        return <Layout><div className="flex h-[50vh] items-center justify-center">Loading...</div></Layout>;
    }

    if (sessionValid === false) {
        return (
            <Layout>
                <Seo title="Invalid Link - NxteVia" description="Password reset link invalid." />
                <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-900/10">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-xl font-bold text-red-900 dark:text-red-400">Invalid or Expired Link</h1>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Button asChild className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                                <Link to="/forgot-password">Request New Link</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Seo title="Reset Password - NxteVia" description="Create a new password." />
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950">
                <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Enter your new password below.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-white dark:bg-slate-950"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-white dark:bg-slate-950"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
