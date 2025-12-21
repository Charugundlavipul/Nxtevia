import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { provisionProfileForRole } from "@/lib/signup";
import { savePendingSignup } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Mail, User, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function GoogleIcon() { return (<svg aria-hidden viewBox="0 0 533.5 544.3" className="h-5 w-5"><path fill="#4285F4" d="M533.5 278.4c0-18.6-1.6-37-5-54.8H272v103.8h147.3c-6.3 34.3-25.1 63.4-53.6 82.9v68.6h86.7c50.7-46.7 80.1-115.5 80.1-200.5z" /><path fill="#34A853" d="M272 544.3c72.6 0 133.7-24.1 178.3-65.4l-86.7-68.6c-24.1 16.2-55 25.7-91.6 25.7-70.4 0-130.1-47.5-151.5-111.2H30.9v69.8C75.4 486 166.7 544.3 272 544.3z" /><path fill="#FBBC04" d="M120.5 324.8c-10-29.7-10-61.6 0-91.3v-69.8H30.9c-40.6 80.9-40.6 149.9 0 230.8l89.6-69.7z" /><path fill="#EA4335" d="M272 106.1c38.8-.6 75.9 14 104.1 40.8l77.4-77.4C404.8 24.4 343.9-.1 272 0 166.7 0 75.4 58.3 30.9 150.7l89.6 69.8C141.9 156.8 201.6 106.1 272 106.1z" /></svg>); }
function MicrosoftIcon() { return (<svg aria-hidden viewBox="0 0 23 23" className="h-5 w-5"><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg>); }

export default function CreateAccount() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "company">("student");
  const [manualMode, setManualMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const apiRole = role === "student" ? "seeker" : "company";

  const connect = async (provider: "google" | "azure") => {
    const next = `/signup/complete?role=${role}`;
    const redirectTo = `${window.location.origin}/login?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) {
      toast({ title: "OAuth error", description: error.message, duration: 3000 });
    } else {
      toast({ title: "Redirecting", description: `Continue with ${provider === "google" ? "Google" : "Microsoft"}.`, duration: 2000 });
    }
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !password) { toast({ title: "Error", description: "Email and password are required.", duration: 3000 }); setLoading(false); return; }
    if (!name) { toast({ title: "Error", description: role === "company" ? "Company name is required." : "Full name is required.", duration: 3000 }); setLoading(false); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast({ title: "Invalid email", description: "Please enter a valid email address.", duration: 3000 }); setLoading(false); return; }
    if (password.length < 6) { toast({ title: "Password too short", description: "Use at least 6 characters.", duration: 3000 }); setLoading(false); return; }
    if (password !== confirmPassword) { toast({ title: "Passwords do not match", description: "Please make sure both passwords match.", duration: 3000 }); setLoading(false); return; }
    try {
      // Use window.location.origin to ensure it points to the current domain (e.g. Vercel)
      const next = `/signup/complete?role=${role}`;
      const emailRedirectTo = `${window.location.origin}/login?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: { role: apiRole, name },
          emailRedirectTo,
        },
      });
      if (error || !data?.user) { toast({ title: "Could not create account", description: error?.message ?? "Please try again.", duration: 3500 }); setLoading(false); return; }

      if (!data.session) {
        savePendingSignup({ role, name, email: email.toLowerCase() });
        toast({ title: "Check your inbox", description: "Confirm your email, then return to finish setup.", duration: 4000 });
        navigate(`/signup/verify?role=${role}`);
        return;
      }

      await provisionProfileForRole(data.session, role, name, email);
      toast({ title: "Account created", description: "Signed up successfully.", duration: 2500 });
      navigate(`/signup/complete?role=${role}`);
    } catch (err) {
      toast({ title: "Signup failed", description: err instanceof Error ? err.message : "Unexpected error", duration: 3500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Seo title="Create your account - NxteVia" description="Sign up with Google, Microsoft, or email." canonical={window.location.href} />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400">Join NxteVia to connect with opportunities.</p>
          </div>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-slate-800 shadow-xl">
            <CardContent className="p-8 space-y-6">

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setRole("student")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                    role === "student"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <User className="h-4 w-4" />
                  Seeker
                </button>
                <button
                  onClick={() => setRole("company")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                    role === "company"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Company
                </button>
              </div>

              <div className="space-y-3">
                <Button variant="outline" size="lg" className="w-full justify-start h-12 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium" onClick={() => connect("google")}>
                  <GoogleIcon /> <span className="ml-3">Sign up with Google</span>
                </Button>
                <Button variant="outline" size="lg" className="w-full justify-start h-12 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium" onClick={() => connect("azure")}>
                  <MicrosoftIcon /> <span className="ml-3">Sign up with Microsoft</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
                </div>
              </div>

              {!manualMode ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  onClick={() => setManualMode(true)}
                >
                  <Mail className="mr-2 h-4 w-4" /> Sign up with email
                </Button>
              ) : (
                <form onSubmit={handleManual} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{role === "company" ? "Company Name" : "Full Name"}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === "company" ? "Acme Inc." : "John Doe"}
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder={role === "company" ? "contact@company.com" : "name@example.com"}
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</Label>
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="••••••••"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm</Label>
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        placeholder="••••••••"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-medium transition-all hover:scale-[1.02]"
                    >
                      {loading ? "Creating..." : "Create Account"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setManualMode(false)}
                      className="h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
