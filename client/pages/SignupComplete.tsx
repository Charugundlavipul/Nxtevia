import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";

type UiRole = "student" | "company";

export default function SignupComplete() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const paramRole = params.get("role");
  const storedRole = (typeof window !== "undefined" && localStorage.getItem("eaas_role")) || null;
  const rawRole = (paramRole || storedRole) as UiRole | null;
  const role: UiRole | null =
    rawRole === "company" ? "company" : rawRole === "student" ? "student" : null;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const isCompany = role === "company";
  const nextPath = isCompany ? "/company/profile/create" : "/seekers/profile/create";

  return (
    <Layout>
      <Seo
        title="Account created - NxteVia"
        description="Your account is ready. Next, complete your profile."
        canonical={typeof window !== "undefined" ? window.location.href : ""}
      />
      <section className="container py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Account created</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your {isCompany ? "company" : "seeker"} account is ready. One last step:
                complete your profile so we can match you correctly.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              {isCompany ? (
                <>
                  <p>Next you&apos;ll add key details about your organization:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Organization name and description</li>
                    <li>Contact email and location</li>
                    <li>Industries and Project/Work Types</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>Next you&apos;ll add information to help companies understand your fit:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>A short bio and your skills</li>
                    <li>Experience, portfolio items, and resume details</li>
                    <li>Location and availability</li>
                  </ul>
                </>
              )}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                className="h-11 rounded-xl"
                onClick={() => navigate(nextPath)}
              >
                Continue to profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate(role === "company" ? "/company/home" : "/seekers/home")}
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

