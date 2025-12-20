import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAdminSession } from "@/hooks/useAdminSession";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { admin, checking } = useAdminSession();

  React.useEffect(() => {
    if (admin && !checking) {
      const params = new URLSearchParams(loc.search);
      const next = params.get("next");
      navigate(next || "/admin/profile", { replace: true });
    }
  }, [admin, checking, loc.search, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    trackEvent("admin_login_start", { provider: "password" });
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    if (!email || !password) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      toast({ title: "Sign in failed", description: error?.message ?? "Invalid credentials", duration: 3000 });
      return;
    }
    const role = (data.session.user.app_metadata as any)?.role || (data.session.user.user_metadata as any)?.role;
    if (role !== "admin") {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "This account is not an admin.", duration: 3000 });
      return;
    }
    trackEvent("admin_login_success");
    toast({ title: "Admin signed in", description: "Welcome back.", duration: 1500 });
    const params = new URLSearchParams(loc.search);
    const next = params.get("next");
    navigate(next || "/admin/profile", { replace: true });
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("nv_theme", "light");
    }
  }, []);

  return (
    <>
      <Seo title="Admin Sign in – NxteVia" description="Admin access panel." canonical={window.location.href} />
      <div className="min-h-screen flex flex-col bg-white">
        <header className="sticky top-0 z-40 w-full border-b">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/home" className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F92b357447c84469e810f664e6a70c853%2F38cb528327ce42aaad0ef44c24b7d60a?format=webp&width=240"
                alt="NxteVia"
                className="h-8 w-auto"
                fetchpriority="high"
                decoding="async"
              />
              <span className="sr-only">NxteVia</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 grid place-items-center bg-muted/20 p-6 md:p-10">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Admin Sign in</h1>
                <p className="text-sm text-muted-foreground">This area is separate from the user login.</p>
              </div>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@nxtevia.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Enter your password" required />
                </div>
                <Button type="submit" className="w-full" disabled={checking}>Sign In</Button>
              </form>
              <p className="mt-6 text-center text-xs text-muted-foreground">Need help? Email <a className="underline" href="mailto:support@nxtevia.com">support@nxtevia.com</a></p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
