import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const redirectUrl = `${window.location.origin}/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
                redirectTo: redirectUrl,
            });

            if (error) {
                // Supabase might return rate limit errors or security based errors.
                // For security, we might want to be vague, but for valid users catching typos is good.
                // Defaulting to showing the message for now as this is a dev environment context mostly.
                toast({ title: "Request failed", description: error.message, duration: 3000 });
            } else {
                setSubmitted(true);
                toast({ title: "Email sent", description: "Check your inbox for a password reset link.", duration: 5000 });
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong. Please try again.", duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Seo title="Forgot Password - NxteVia" description="Reset your password." canonical={window.location.href} />
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950">
                <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                    <CardContent className="p-8 space-y-6">
                        {!submitted ? (
                            <>
                                <div className="space-y-2 text-center">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot password?</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={onSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="bg-white dark:bg-slate-950"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Sending link..." : "Send Reset Link"}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Check your email</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        We've sent a password reset link to <span className="font-medium text-slate-900 dark:text-slate-200">{email}</span>.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setSubmitted(false);
                                        setEmail("");
                                    }}
                                >
                                    Try another email
                                </Button>
                            </div>
                        )}

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
