import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import * as React from "react";
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ApplyThankYou() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const projectId = params.get("projectId") || "";

  useEffect(() => {
    if (projectId) trackEvent("thank_you_view", { projectId });
  }, [projectId]);

  return (
    <Layout>
      <Seo
        title="Application Submitted – NxteVia"
        canonical={window.location.href}
      />
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full text-center space-y-8">

          {/* Success Animation/Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75" />
            <div className="relative bg-white dark:bg-slate-900 rounded-full p-4 shadow-xl border border-green-100 dark:border-green-900 flex items-center justify-center h-full w-full">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Application Submitted!</h1>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Great updates are on the way. Your application has been sent successfully.
              You can track its status in your dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link to="/seekers/dashboard">Track Status</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 w-full sm:w-auto">
              <Link to="/seekers/opportunities">Browse More</Link>
            </Button>
          </div>

          <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Need to make changes? You can withdraw your application from the dashboard.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
