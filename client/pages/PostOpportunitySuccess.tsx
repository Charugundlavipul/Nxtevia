import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "react-router-dom";

export default function PostOpportunitySuccess() {
  const { state } = useLocation() as { state?: any };
  const title = state?.title as string | undefined;
  const org = state?.org as string | undefined;
  const modality = state?.modality as string | undefined;
  const duration = state?.duration as string | undefined;
  const city = state?.city as string | undefined;
  const country = state?.country as string | undefined;

  return (
    <Layout>
      <Seo title="Your opportunity has been posted! – NxteVia" canonical={window.location.href} />
      <section className="container py-12 max-w-2xl text-center">
        <div className="mx-auto mb-4 size-14 rounded-full bg-[#F2F0FF] flex items-center justify-center text-[#17048A]">✓</div>
        <h1 className="text-3xl font-semibold">Your opportunity has been posted!</h1>
        <p className="text-muted-foreground mt-2">We’ve received your submission and it’s now under review. You’ll be notified once it’s live on NxteVia.</p>

        {(title || org) && (
          <div className="mt-6 text-left">
            <div className="font-semibold">{title ?? "Opportunity submitted"}</div>
            <div className="text-sm text-muted-foreground">{org ?? "Your organization"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {[city, country].filter(Boolean).join(", ")}
              {modality ? ` · ${modality}` : ""}
              {duration ? ` · ${duration.replace("m"," months")}` : ""}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-11 rounded-xl"><a href="/dashboard">View Submitted Opportunities</a></Button>
          <Button asChild variant="outline" className="h-11 rounded-xl"><a href="/post-opportunity">Post Another Opportunity</a></Button>
          <Button asChild variant="ghost" className="h-11"><a href="/">Go to Homepage</a></Button>
        </div>

        <Card className="mt-8 text-left">
          <CardContent className="p-5">
            <div className="font-semibold mb-2">What happens next?</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>We review every opportunity for authenticity and ethical compliance.</li>
              <li>Once approved, it appears on the NxteVia platform.</li>
              <li>You’ll receive an email confirmation with your listing details.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
