import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { provisionProfileForRole, type UiRole } from "@/lib/signup";
import { clearPendingSignup, readPendingSignup, savePendingSignup, type PendingSignup } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

export default function SignupVerify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [pending, setPending] = useState<PendingSignup | null>(() => readPendingSignup());
  const [missingInfo, setMissingInfo] = useState(false);

  useEffect(() => {
    if (pending) return;
    const roleParam = params.get("role");
    if (roleParam === "student" || roleParam === "company") {
      const fallback: PendingSignup = {
        role: roleParam,
        name: params.get("name") || "",
        email: params.get("email") || "",
      };
      savePendingSignup(fallback);
      setPending(fallback);
      setMissingInfo(false);
    }
  }, [params, pending]);

  const buildSignInPath = useCallback(() => {
    const roleParam = params.get("role");
    const role =
      pending?.role ||
      (roleParam === "student" || roleParam === "company" ? roleParam : null);
    const nextPath = role ? `/signup/complete?role=${role}` : "/signup/complete";
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [params, pending]);

  const finalize = useCallback(
    async (session: Session) => {
      const stored = readPendingSignup();
      const metadataRole = session.user.user_metadata?.role;
      const inferredRole: UiRole =
        stored?.role ||
        (metadataRole === "company" ? "company" : "student");
      if (!inferredRole) {
        setMissingInfo(true);
        return;
      }
      setChecking(true);
      try {
        const derivedName = stored?.name || session.user.user_metadata?.name || session.user.email || "";
        const derivedEmail = stored?.email || session.user.email || "";
        await provisionProfileForRole(session, inferredRole, derivedName, derivedEmail);
        clearPendingSignup();
        setPending(null);
        toast({ title: "Email confirmed", description: "Let’s finish setting up your profile.", duration: 2500 });
        navigate(`/signup/complete?role=${inferredRole}`, { replace: true });
      } catch (err) {
        toast({
          title: "Could not finish signup",
          description: err instanceof Error ? err.message : "Unexpected error",
          duration: 4000,
        });
      } finally {
        setChecking(false);
      }
    },
    [navigate],
  );

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      toast({ title: "Check failed", description: error.message, duration: 3500 });
      setChecking(false);
      return;
    }
    const session = data.session;
    if (!session) {
      const loginPath = buildSignInPath();
      setChecking(false);
      toast({
        title: "Sign in to continue",
        description: "We couldn't find a signed-in session on this device. If you verified on another device, please sign in to finish setup.",
        duration: 5000,
        action: (
          <ToastAction altText="Sign in" onClick={() => navigate(loginPath)}>
            Sign in
          </ToastAction>
        ),
      });
      return;
    }
    const isConfirmed = Boolean(session.user.email_confirmed_at || session.user.confirmed_at);
    if (!isConfirmed) {
      setChecking(false);
      toast({ title: "Verification required", description: "Kindly verify your email to proceed.", duration: 3500 });
      return;
    }
    finalize(session);
  }, [buildSignInPath, finalize, navigate]);

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finalize(session);
      }
    });
    // Don't auto-run on mount if we just want them to wait, but running it once is okay to check if magic link worked.
    // refreshStatus(); 
    return () => {
      subscription.data?.subscription.unsubscribe();
    };
  }, [finalize, refreshStatus]);

  return (
    <Layout>
      <Seo
        title="Confirm your email - NxteVia"
        description="Check your inbox to finish creating your account."
        canonical={typeof window !== "undefined" ? window.location.href : ""}
      />
      <section className="container py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your inbox</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                We sent a verification link to your email. Confirm it, then click the button below or sign in.
              </p>
            </div>
            <>
              {missingInfo ? (
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  We’ll ask for your details again after you confirm your email.
                </div>
              ) : null}
              <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <p>Keep this tab open while you verify your email.</p>
                <p>Once confirmed, clicking below will finish your setup.</p>
              </div>
              <Button className="w-full" onClick={refreshStatus} disabled={checking}>
                {checking ? "Checking status..." : "I verified my email"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => navigate(buildSignInPath())}
              >
                Back to sign in
              </Button>
            </>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
