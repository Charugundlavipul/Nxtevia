import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { BadgeCheck, BellRing, Globe2, ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 533.5 544.3" className="h-5 w-5">
      <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.6-37-5-54.8H272v103.8h147.3c-6.3 34.3-25.1 63.4-53.6 82.9v68.6h86.7c50.7-46.7 80.1-115.5 80.1-200.5z" />
      <path fill="#34A853" d="M272 544.3c72.6 0 133.7-24.1 178.3-65.4l-86.7-68.6c-24.1 16.2-55 25.7-91.6 25.7-70.4 0-130.1-47.5-151.5-111.2H30.9v69.8C75.4 486 166.7 544.3 272 544.3z" />
      <path fill="#FBBC04" d="M120.5 324.8c-10-29.7-10-61.6 0-91.3v-69.8H30.9c-40.6 80.9-40.6 149.9 0 230.8l89.6-69.7z" />
      <path fill="#EA4335" d="M272 106.1c38.8-.6 75.9 14 104.1 40.8l77.4-77.4C404.8 24.4 343.9-.1 272 0 166.7 0 75.4 58.3 30.9 150.7l89.6 69.8C141.9 156.8 201.6 106.1 272 106.1z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg aria-hidden viewBox="0 0 23 23" className="h-5 w-5">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const ensureProfile = async (
    userId: string,
    email: string,
    name?: string,
    preferredRole: string = "student",
  ) => {
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (preferredRole === "admin") {
      if (profileRow?.role !== "admin") {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert({
            user_id: userId,
            role: "admin",
            display_name: name || profileRow?.display_name || "Admin"
          });
        if (upsertErr) {
          toast({ title: "Profile sync failed", description: upsertErr.message, duration: 3000 });
        }
      }
      return { mappedRole: "admin", displayName: name || profileRow?.display_name || "Admin" };
    }

    if (profileRow?.role === "admin") {
      return { mappedRole: "admin", displayName: profileRow.display_name };
    }

    let mappedRole: "student" | "company" | "admin" = "student";
    if (!profileErr && profileRow) {
      mappedRole = profileRow.role === "company" ? "company" : "student";
    } else {
      const fallbackRole = preferredRole === "company" ? "company" : "student";
      const fallbackApiRole = fallbackRole === "company" ? "company" : "seeker";
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ user_id: userId, role: fallbackApiRole, display_name: name || email.split("@")[0] || "User" });
      if (upsertErr) {
        toast({ title: "Profile sync failed", description: upsertErr.message, duration: 3000 });
      }
      mappedRole = fallbackRole;
    }

    if (mappedRole === "company") {
      await supabase.from("company_profiles").upsert({ user_id: userId, contact_email: email, name: name || "Company" });
    } else {
      await supabase.from("seeker_profiles").upsert({ user_id: userId, contact_email: email });
    }

    return { mappedRole, displayName: profileRow?.display_name ?? name };
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      const user = session?.user;
      if (!session || !user) return;

      const role = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role || "student";

      const ensured = await ensureProfile(
        user.id,
        user.email || "",
        (user.user_metadata as any)?.name,
        role,
      );
      const mappedRole = ensured.mappedRole;
      const name = ensured.displayName || (user.user_metadata as any)?.name;
      const email = user.email ?? "";
      localStorage.setItem("eaas_authed", "true");
      localStorage.setItem("eaas_role", mappedRole);
      if (name) localStorage.setItem("eaas_name", name);
      if (email) localStorage.setItem("eaas_email", email);
      localStorage.setItem("eaas_user_id", user.id);
      if (session.access_token) {
        localStorage.setItem("supabase_access_token", session.access_token);
        localStorage.setItem("supabase_refresh_token", session.refresh_token ?? "");
      }
      if (mappedRole === "company") {
        navigate("/company/home", { replace: true });
      } else if (mappedRole === "admin") {
        navigate("/admin/profile", { replace: true });
      } else {
        navigate("/seekers/home", { replace: true });
      }
    });
  }, [navigate]);

  const setLocalSession = (session: any, mappedRole: "student" | "company" | "admin", name?: string, email?: string, userId?: string) => {
    localStorage.setItem("eaas_authed", "true");
    localStorage.setItem("eaas_role", mappedRole);
    if (name) localStorage.setItem("eaas_name", name);
    if (email) localStorage.setItem("eaas_email", email);
    if (userId) localStorage.setItem("eaas_user_id", userId);
    if (session?.access_token) {
      localStorage.setItem("supabase_access_token", session.access_token);
      localStorage.setItem("supabase_refresh_token", session.refresh_token ?? "");
    }
  };

  const [needsVerification, setNeedsVerification] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const resendVerification = async () => {
    if (!lastEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: lastEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      toast({ title: "Email sent", description: "Check your inbox for the confirmation link.", duration: 4000 });
      setNeedsVerification(false);
    } catch (err) {
      toast({ title: "Failed to send", description: err instanceof Error ? err.message : "Could not send email", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    if (!email || !password) {
      toast({ title: "Missing details", description: "Email and password are required.", duration: 2500 });
      setLoading(false);
      return;
    }

    setLastEmail(email);
    trackEvent("login_start", { provider: "password", role: "auto" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setNeedsVerification(true);
          toast({ title: "Verification required", description: "Please verify your email address.", variant: "destructive" });
        } else {
          toast({ title: "Sign in failed", description: error.message, duration: 3500 });
        }
        setLoading(false);
        return;
      }

      if (!data?.session || !data?.user) {
        toast({ title: "Sign in failed", description: "Check your credentials.", duration: 3500 });
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      const role = (data.user.app_metadata as any)?.role || (data.user.user_metadata as any)?.role || "student";

      const ensured = await ensureProfile(
        userId,
        email,
        (data.user.user_metadata as any)?.name,
        role,
      );
      const mappedRole = ensured.mappedRole;
      const name = ensured.displayName || (data.user.user_metadata as any)?.name;

      if (mappedRole === "admin") {
        await supabase.auth.signOut();
        toast({ title: "Access denied", description: "Admins must use the Admin Login page.", duration: 4000 });
        setLoading(false);
        return;
      }

      setLocalSession(data.session, mappedRole as any, name, email, userId);

      toast({ title: "Signed in", description: "Welcome back!", duration: 2000 });

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (next) {
        navigate(next);
      } else if (mappedRole === "company") {
        navigate("/company/home");
      } else {
        navigate("/seekers/home");
      }
    } catch (err) {
      toast({ title: "Sign in failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 3500 });
    } finally {
      setLoading(false);
    }
  };

  const startSocial = async (provider: "google" | "azure") => {
    trackEvent("signup_start", { provider, role: "auto" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, duration: 3500 });
    } else {
      toast({ title: "Redirecting", description: `Continue with ${provider === "google" ? "Google" : "Microsoft"}.`, duration: 2000 });
    }
  };

  return (
    <Layout>
      <Seo title="Sign in - NxteVia" description="Access your NxteVia account to continue." canonical={window.location.href} />
      <section className="min-h-[calc(100vh-8rem)] grid lg:grid-cols-2">
        {/* Left Side - Hero/Branding */}
        <aside className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary/80 to-primary/60 text-white p-12 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white/90">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F92b357447c84469e810f664e6a70c853%2F9c0dae291b494ea096fed8d35c697dd9?format=webp&width=200"
                alt="NxteVia"
                className="h-8 w-auto"
              />
            </div>
            <h2 className="mt-12 text-4xl font-bold leading-tight tracking-tight">
              Where skills meet <br />
              <span className="text-white/80">real-world opportunities</span>
            </h2>
            <p className="mt-6 text-lg text-white/90 max-w-md leading-relaxed">
              Join thousands of students and companies building the future of work together. Find opportunities, gain experience, and get hired.
            </p>
          </div>

          <div className="relative z-10 mt-12 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-transform hover:scale-[1.02]">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <BadgeCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Verifiable Experience</h3>
                <p className="text-sm text-white/80">Build a portfolio that proves your skills</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-transform hover:scale-[1.02]">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Globe2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Global Opportunities</h3>
                <p className="text-sm text-white/80">Work with companies from around the world</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 text-sm text-white/60">
            © 2024 NxteVia Inc. All rights reserved.
          </div>
        </aside>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
              <p className="text-slate-500 dark:text-slate-400">Sign in to access your dashboard and opportunities.</p>
            </div>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                {needsVerification && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email not verified
                    </p>
                    <p className="mb-3">Please check your inbox ({lastEmail}) for the confirmation link.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resendVerification}
                      disabled={loading}
                      className="w-full border-amber-300 hover:bg-amber-100 text-amber-900"
                    >
                      {loading ? "Sending..." : "Resend Confirmation Email"}
                    </Button>
                  </div>
                )}
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
                      <Link to="#" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-medium text-base transition-all hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    onClick={() => startSocial("google")}
                  >
                    <GoogleIcon /> <span className="ml-3">Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    onClick={() => startSocial("azure")}
                  >
                    <MicrosoftIcon /> <span className="ml-3">Microsoft</span>
                  </Button>
                </div>
              </CardContent>
              <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                    Get started
                  </Link>
                </p>
              </div>
            </Card>

            <p className="text-center text-xs text-slate-400">
              By signing in, you agree to our <Link to="/terms" className="underline hover:text-slate-500">Terms</Link> and <Link to="/privacy" className="underline hover:text-slate-500">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
