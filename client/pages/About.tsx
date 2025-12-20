import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CheckCircle2, Globe, ShieldCheck, Users, Building2, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <Seo
        title="About – NxteVia"
        description="NxteVia connects talent seeking experience with companies offering project-based opportunities."
        canonical={window.location.href}
      />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50"></div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Our Mission</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Empowering Growth Through <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 dark:from-indigo-400 dark:to-primary">
                Real-World Experience
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              We bridge the gap between ambitious talent and forward-thinking organizations through flexible, outcome-driven work experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="container space-y-20">

          {/* Vision & Mission Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  To help individuals gain real-world experience through short-term, project-based opportunities that drive career growth and strengthen professional credibility.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Empowering every individual to grow through real-world experience, creating a global workforce validated by skills and outcomes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How We Work */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How We Work</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                NxteVia connects skilled individuals with companies offering practical projects — enabling both sides to achieve more. Talent gets hands-on exposure and verifiable results, while companies benefit from motivated contributors who deliver measurable outcomes.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-none mt-1">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Verifiable Outcomes</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      Every completed opportunity generates verifiable results that can be shared on LinkedIn and your CV.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none mt-1">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Global Reach</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      Inclusive, border-agnostic experiences that work seamlessly across time zones and modalities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-3xl blur-2xl transform rotate-3"></div>
              <Card className="relative bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Success Story</div>
                      <div className="text-xs text-slate-500">Verified Outcome</div>
                    </div>
                  </div>
                  <blockquote className="text-lg text-slate-700 dark:text-slate-300 italic mb-6">
                    "Delivered a market analysis and interactive dashboard used in internal decision-making. This project gave me the exact experience I needed to land my full-time role."
                  </blockquote>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Sarah Jenkins</div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Hired</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-8 md:p-12 text-center border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Start your growth journey with NxteVia today
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <Link to="/seekers/opportunities">
                  Browse Opportunities <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white dark:bg-slate-900">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
