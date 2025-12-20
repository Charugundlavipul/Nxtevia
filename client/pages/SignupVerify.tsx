import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      toast({ title: "Refresh failed", description: error.message, duration: 3500 });
      setChecking(false);
      return;
    }
    if (data.session) {
      finalize(data.session);
    } else {
      setChecking(false);
    }
  }, [finalize]);

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finalize(session);
      }
    });
    refreshStatus();
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
      <section className="container py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a verification link to your email. Confirm it, then refresh this page to continue.
              </p>
            </div>
            <>
              {missingInfo ? (
                <div className="text-sm text-warning">
                  We’ll ask for your details again after you confirm your email.
                </div>
              ) : null}
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Keep this tab open while you verify your email.</p>
                <p>Once confirmed, we’ll take you straight to the next step to complete your profile.</p>
              </div>
              <Button className="w-full" onClick={refreshStatus} disabled={checking}>
                {checking ? "Checking status..." : "I verified my email"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/login")}>
                Back to sign in
              </Button>
            </>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
