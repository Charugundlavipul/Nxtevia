import { useState } from "react";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLES = [
  {
    id: "company",
    label: "Company / Organization",
    desc: "Post real-world opportunities and find skilled talent.",
    cta: "I want to Post Opportunities",
    href: "/company/post-opportunity",
  },
  {
    id: "seeker",
    label: "Seeker / Professional",
    desc: "Apply to real projects, gain experience, and grow your career.",
    cta: "I want to Find Opportunities",
    href: "/opportunities",
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export default function Onboarding() {
  const params = new URLSearchParams(window.location.search);
  const hint = (
    params.get("role") ||
    localStorage.getItem("eaas_role") ||
    ""
  ).toString();
  const normalized = hint === "student" ? "seeker" : hint;
  const initRole =
    normalized === "company" || normalized === "seeker"
      ? (normalized as RoleId)
      : null;
  const [role, setRole] = useState<RoleId | null>(initRole);
  const [work, setWork] = useState<"remote" | "hybrid" | "on-site">("remote");

  const onContinue = () => {
    if (!role || !work) return;
    localStorage.setItem("eaas_onboarded", "true");
    localStorage.setItem("eaas_role", role);
    localStorage.setItem("eaas_work", work);
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next) {
      window.location.assign(next);
    } else {
      window.location.assign(
        role === "company" ? "/company/post-opportunity" : "/opportunities",
      );
    }
  };

  return (
    <Layout>
      <Seo
        title="Get started on NxteVia"
        description="Choose how you’ll use the platform to post real‑world opportunities or gain experience."
        canonical={window.location.href}
      />
      <section className="container py-12">
        <h1 className="text-3xl font-bold text-center">
          Get started on NxteVia
        </h1>
        <p className="text-muted-foreground mt-2 text-center">
          Choose how you’ll use the platform to post real‑world opportunities or
          gain experience.
        </p>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {(initRole ? ROLES.filter((r) => r.id === initRole) : ROLES).map(
            (r) => (
              <button
                key={r.id}
                className={`text-left rounded-lg border transition hover:ring-2 hover:ring-[#17048A] hover:shadow-sm ${role === r.id ? "bg-[#F2F0FF] border-[#17048A] ring-2 ring-[#17048A]" : "border-[#E5E7EB] bg-card"}`}
                onClick={() => setRole(r.id)}
              >
                <Card className="bg-transparent border-0 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <div className="font-semibold">{r.label}</div>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                    <div>
                      <Button asChild size="sm">
                        <a href={r.href}>{r.cta}</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ),
          )}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="font-semibold mb-2">Verification</div>
              <p className="text-sm text-muted-foreground">
                Connect your Google or LinkedIn for trust signals.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="default">
                  <a href="/login">Connect LinkedIn</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/login">Connect Google</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {(role === "company" ||
            window.location.pathname.startsWith("/company")) && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="font-semibold">Company quick start</div>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                  <li>Set what applicants must submit on your forms.</li>
                  <li>
                    Publish an opportunity with a clear scope and outcome.
                  </li>
                  <li>
                    Review applicants, schedule interviews, and track selections.
                  </li>
                </ul>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline">
                    <a href="/company/requirements">Configure Requirements</a>
                  </Button>
                  <Button asChild>
                    <a href="/company/post-opportunity">Post Opportunity</a>
                  </Button>
                  <Button asChild variant="secondary">
                    <a href="/company/dashboard">Open Dashboard</a>
                  </Button>
                  <Button asChild variant="ghost">
                    <a href="/company/faq">Read FAQ</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8">
          <Button
            onClick={onContinue}
            disabled={!role || !work}
            className="h-12 rounded-xl"
          >
            Continue
          </Button>
        </div>
      </section>
    </Layout>
  );
}

