import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminSession } from "@/hooks/useAdminSession";
import { supabase } from "@/lib/supabase";


function useAdminProfile() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [prefs, setPrefs] = React.useState<{ emailNotifications: boolean; weeklyReports: boolean }>({ emailNotifications: true, weeklyReports: false });
  const [lastLogin, setLastLogin] = React.useState<string | null>(null);
  const { session } = useAdminSession();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const user = session?.user;
    const md = (user?.user_metadata as any) || {};
    setName(md?.name || "Admin");
    setEmail(user?.email || "admin@example.com");
    const pRaw = localStorage.getItem("eaas_admin_prefs");
    const p = pRaw ? JSON.parse(pRaw) : undefined;
    setPrefs({ emailNotifications: p?.emailNotifications ?? true, weeklyReports: p?.weeklyReports ?? false });
    setLastLogin(user?.last_sign_in_at ?? null);
  }, [session]);

  const savePrefs = () => {
    localStorage.setItem("eaas_admin_prefs", JSON.stringify(prefs));
    toast({ title: "Preferences saved", description: "Your local preferences have been updated." });
  };

  const saveAccount = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const updates: any = {
        data: { name }
      };
      let emailChanged = false;
      if (email !== session.user.email) {
        updates.email = email;
        emailChanged = true;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      // Also update the public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('user_id', session.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      toast({
        title: "Account updated",
        description: emailChanged ? "Details saved. Check your email to confirm the address change." : "Your account details have been saved."
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { name, setName, email, setEmail, prefs, setPrefs, savePrefs, saveAccount, lastLogin, loading };
}

export default function AdminProfile() {
  const nav = useNavigate();
  const { admin, checking } = useAdminSession();
  const { name, setName, email, setEmail, prefs, setPrefs, savePrefs, saveAccount, lastLogin, loading } = useAdminProfile();
  const initials = React.useMemo(() => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "AD", [name]);

  React.useEffect(() => {
    if (checking) return;
    if (!admin) {
      nav("/admin/login", { replace: true });
    }
  }, [admin, checking, nav]);

  const signOut = () => {
    supabase.auth.signOut().finally(() => nav("/admin/login", { replace: true }));
  };

  return (
    <Layout>
      <Seo title="Admin – Profile" description="Admin account and preferences" canonical={window.location.href} />
      <section className="container py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">Admin Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your admin account and preferences.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="font-semibold">Account</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Last login: {lastLogin ? new Date(lastLogin).toLocaleString() : "—"}</div>
                <div className="flex gap-2">
                  <Button onClick={saveAccount} disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
                  <Button variant="outline" asChild><Link to="/admin/dashboard">Go to dashboard</Link></Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="font-semibold">Preferences</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Email notifications</div>
                    <div className="text-xs text-muted-foreground">Receive admin alerts via email.</div>
                  </div>
                  <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => setPrefs({ ...prefs, emailNotifications: !!v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Weekly reports</div>
                    <div className="text-xs text-muted-foreground">Summary of activity every Monday.</div>
                  </div>
                  <Switch checked={prefs.weeklyReports} onCheckedChange={(v) => setPrefs({ ...prefs, weeklyReports: !!v })} />
                </div>
                <div>
                  <Button onClick={savePrefs}>Save preferences</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="font-semibold">Quick links</div>
                <div className="grid gap-2">
                  <Button asChild variant="outline"><Link to="/admin/jobs">Opportunities</Link></Button>
                  <Button asChild variant="outline"><Link to="/admin/seekers">Seekers</Link></Button>
                  <Button asChild variant="outline"><Link to="/admin/companies">Companies</Link></Button>
                  <Button asChild variant="outline"><Link to="/admin/analytics">Analytics</Link></Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="font-semibold">Session</div>
                <div className="text-sm text-muted-foreground">You are signed in as <span className="text-foreground">{email}</span>.</div>
                <Button variant="destructive" onClick={signOut}>Sign out</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
