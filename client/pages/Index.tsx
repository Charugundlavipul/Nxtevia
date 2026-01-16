import * as React from "react";
import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Link as LinkIcon,
  Briefcase,
  FileText,
  Users,
  Compass,
  Sparkles,
  Rocket,
  ShieldCheck,
  Globe,
  ArrowRight,
  CheckCircle2,
  Building2,
  GraduationCap,
  Clock,
  UserPlus,
  Search,
  Send,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchActiveOpportunities, type Opportunity } from "@/lib/opportunities";
import { Link, useLocation } from "react-router-dom";

type Role = "student" | "company" | null;

const publicBaseUrl = import.meta.env.BASE_URL || "/";

function HeroOrbit({ seekerMode, companyMode }: { seekerMode: boolean; companyMode: boolean }) {
  const [role, setRole] = React.useState<Role | null>(null);
  React.useEffect(() => {
    const r =
      (typeof window !== "undefined" &&
        (localStorage.getItem("eaas_role") as Role)) ||
      null;
    setRole(r);
  }, []);
  const showPost = role !== "student";
  const showStart = role !== "company";

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-12 bg-slate-50 dark:bg-slate-950"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-2000"
        />
      </div>

      <div className="relative z-10 container grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left space-y-8 relative z-10"
        >


          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Where skills meet <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary dark:from-primary dark:to-primary">
              real-world impact
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Connect talent and companies in one integrated space built for the future of work. Build verifiable experience as you collaborate, grow your portfolio, and move seamlessly toward meaningful employment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            {showStart && (
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                <Link to={(typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true") ? "/seekers/browse_opportunities" : "/login"}>
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
            {showPost && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-full text-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-white"
              >
                <Link to={companyMode || role === "company" ? "/company/post_opportunities" : "/signup?next=/company/post-opportunity"}>
                  Post Opportunity
                </Link>
              </Button>
            )}
          </div>

          <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary dark:text-white" />
              <span className="font-medium">Verified Experience</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative w-full aspect-square max-w-lg mx-auto">
            {/* Orbit Animation Container */}
            <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-slate-700/50 lg:border lg:border-slate-200 lg:dark:border-slate-800/50"></div>
            <div className="absolute inset-[15%] rounded-full border-2 border-slate-300 dark:border-slate-700/50 lg:border lg:border-slate-200 lg:dark:border-slate-800/50"></div>
            <div className="absolute inset-[30%] rounded-full border-2 border-slate-300 dark:border-slate-700/50 lg:border lg:border-slate-200 lg:dark:border-slate-800/50"></div>

            {/* Floating Icons */}
            <div className="absolute inset-0 orbit-spin orbit-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <Briefcase className="h-8 w-8 text-primary dark:text-purple-500" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <GraduationCap className="h-8 w-8 text-primary dark:text-purple-500" />
              </div>
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <Globe className="h-8 w-8 text-primary dark:text-purple-500" />
              </div>
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <Building2 className="h-8 w-8 text-primary dark:text-purple-500" />
              </div>
            </div>

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 flex items-center justify-center">
                <img
                  src="/assets/nxtevia-logo-light.webp"
                  alt="NxteVia"
                  className="w-20 h-auto dark:hidden"
                />
                <img
                  src="/assets/nxtevia-logo-dark.webp"
                  alt="NxteVia"
                  className="w-20 h-auto hidden dark:block"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section >
  );
}

function Mission() {
  const seekerBg = `${publicBaseUrl}cta-career-growth.png`;
  const companyBg = `${publicBaseUrl}cta-hiring-talent.png`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
    >
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 border-primary/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
          >
            Our Vision
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Empowering every individual to grow through real-world experience.
          </h2>

        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="absolute inset-0">
              <img
                src={seekerBg}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-right opacity-20 dark:opacity-10"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
            </div>
            <CardContent className="relative p-8">
              <div className="h-12 w-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">For Seekers</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Bridge the gap in your resume by connecting with organizations that offer real-world project opportunities.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Build a verifiable portfolio
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Gain Professional experience
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Improve employability
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            <div className="absolute inset-0">
              <img
                src={companyBg}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-right opacity-20 dark:opacity-10"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
            </div>
            <CardContent className="relative p-8">
              <div className="h-12 w-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-primary dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">For Companies</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Connect with talented individuals who can support you with short-term projects/work anywhere in your journey.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Access diverse talent
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Accelerate projects
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Build your pipeline
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}

function Highlights() {
  const items = [
    {
      t: "Find Opportunities",
      d: "Discover short-term opportunities matched to your skills and gain real-world experience.",
      i: Compass,
      c: "text-indigo-600 dark:text-indigo-400",
      b: "bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10"
    },
    {
      t: "Showcase Skills",
      d: "Utilize your skills by working on real opportunities and stand out to potential employers.",
      i: Sparkles,
      c: "text-indigo-600 dark:text-indigo-400",
      b: "bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10"
    },
    {
      t: "Get Hired",
      d: "Turn experience into opportunity - get noticed and land your next role.",
      i: Rocket,
      c: "text-indigo-600 dark:text-indigo-400",
      b: "bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10"
    },
  ];
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="container py-16 bg-slate-50 dark:bg-slate-950"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((c, i) => {
          const Icon = c.i;
          return (
            <Card key={c.t} className="group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8">
                <div className={cn("inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-6 transition-transform group-hover:scale-110", c.b, c.c)}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{c.t}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{c.d}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.section>
  );
}

function HowItWorks({ seekerMode, companyMode }: { seekerMode: boolean; companyMode: boolean }) {
  if (seekerMode) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        id="how-it-works"
        className="py-16 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-24"
      >
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">How it Works</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Your journey to a meaningful career in 3 simple steps</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line (Desktop) */}
            {/* Removed connecting line for cleaner dark mode styling */}

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  title: "Create Profile",
                  desc: "Sign up and showcase your educational background, skills, and interests to stand out.",
                  icon: UserPlus,
                  step: "01",
                  delay: "0"
                },
                {
                  title: "Browse Opportunities",
                  desc: "Explore short-term projects and verified opportunities that match your career goals.",
                  icon: Compass,
                  step: "02",
                  delay: "100"
                },
                {
                  title: "Select & Apply",
                  desc: "Submit your application, work on real projects, and earn verified experience.",
                  icon: Send,
                  step: "03",
                  delay: "200"
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-slate-950/70 p-8 pt-12 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-slate-950/30 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
                  style={{ animationDelay: `${item.delay}ms` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <div className="h-12 w-12 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 shadow-sm relative z-10">
                      <div className="h-8 w-8 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                    </div>
                  </div>

                  <div className="h-16 w-16 mx-auto bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100/80 dark:group-hover:bg-indigo-900/20 transition-all duration-300">
                    <item.icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Link to="/seekers/browse_opportunities">
                  Find Your Opportunity <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      id="how-it-works"
      className="py-16 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-24"
    >
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">How it works</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Simple steps to get started with NxteVia</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          <Card className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-slate-200 dark:border-slate-800">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">For Seekers</h3>
                <Badge variant="secondary">Step-by-step</Badge>
              </div>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Create a Profile</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sign up and showcase your skills and interests.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Browse Opportunities</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Find projects that match your career goals.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Select and Apply</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Submit your application.</p>
                  </div>
                </li>
              </ol>
              {!companyMode && (
                <Button asChild className="w-full mt-8">
                  <Link to={(typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true") ? "/seekers/browse_opportunities" : "/login"}>
                    Browse Opportunities <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {!seekerMode && (
            <Card className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-slate-200 dark:border-slate-800">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">For Companies</h3>
                  <Badge variant="secondary">Step-by-step</Badge>
                </div>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Create Company Profile</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Register your organization and verify details.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Post Opportunities</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Define scope, requirements, and deliverables.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Review & Hire</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Select best candidates</p>
                    </div>
                  </li>
                </ol>
                <Button asChild className="w-full mt-8" variant="outline">
                  <Link to={companyMode ? "/company/post_opportunities" : "/signup?next=/company/post-opportunity"}>
                    Post Opportunities <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.section>
  );
}


function FeaturedProjects({ companyMode }: { companyMode: boolean }) {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchActiveOpportunities()
      .then((data) => setOpportunities(data.slice(0, 3)))
      .catch((err) => console.error("Failed to load featured opportunities", err))
      .finally(() => setLoading(false));
  }, []);

  const authed =
    typeof window !== "undefined" &&
    localStorage.getItem("eaas_authed") === "true";



  if (companyMode) return null;

  // Don't show section if no opportunities and not loading
  if (!loading && opportunities.length === 0) return null;

  return (
    <section
      id="opportunities"
      className="relative py-24 bg-slate-50 dark:bg-slate-950 overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 border-primary/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
            >
              Curated Opportunities
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Opportunities</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Hand-picked opportunities to help you build your portfolio, gain verifiable experience, and connect with top companies.
            </p>
          </div>
          <Button asChild size="lg" className="hidden md:inline-flex rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Link to={authed ? "/seekers/opportunities" : "/login"}>
              View All Opportunities <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between">
                    <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                    <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            opportunities.map((p, index) => (
              <Card
                key={p.id}
                className="group relative h-full flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mb-2 capitalize font-medium",
                          p.modality === 'remote' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50" :
                            p.modality === 'hybrid' ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50" :
                              "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                        )}
                      >
                        {p.modality}
                      </Badge>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        {p.company_name}
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary dark:group-hover:text-white dark:hover:text-white transition-colors">
                        {p.title}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Clock className="h-3.5 w-3.5" />
                      {p.duration}
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Briefcase className="h-3.5 w-3.5" />
                      {p.hours} hrs/week
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <DollarSign className="h-3.5 w-3.5" />
                      {p.stipend === "none" || p.stipend === "unpaid" ? "Unpaid" : p.stipend === "micro" ? "Stipend" : "Paid"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(p.skills || []).slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                      {(p.skills?.length || 0) > 4 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                          +{p.skills!.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button asChild className="w-full group-hover:bg-primary transition-all shadow-sm group-hover:shadow-primary/25" size="lg">
                      <Link to={`/seekers/opportunities/${encodeURIComponent(p.id)}`} className="flex items-center justify-center gap-2">
                        View Details
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Button asChild size="lg" className="w-full rounded-full shadow-lg shadow-primary/20">
            <Link to={authed ? "/seekers/opportunities" : "/login"}>
              View All Opportunities <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FAQ({ companyMode }: { companyMode?: boolean }) {
  const baseFaqs = [
    {
      q: "What is NxteVia?",
      a: "NxteVia is a platform that connects students, newcomers to a country, and career changers with real-world work opportunities to help them gain hands-on experience. Each opportunity is offered by a verified company on NxteVia, so your skills and contributions hold real value when showcasing them to future employers.",
    },
    {
      q: "Who can join NxteVia?",
      a: "Anyone can join NxteVia. Whether you’re a student, a newcomer to a country, or a professional exploring a new field — NxteVia helps you connect with organizations seeking emerging talent. Employers can also post opportunities to find motivated individuals eager to learn and contribute.",
    },
    {
      q: "Are the opportunities paid?",
      a: "Opportunities on NxteVia are learning-based and may be either paid or unpaid, depending on the organization. Regardless of pay, every seeker receives verifiable proof of work experience on NxteVia to strengthen their professional portfolio.",
    },
    {
      q: "How is experience verified?",
      a: "After you complete an opportunity, the company verifies your participation directly on your NxteVia profile. This verified experience can help you build a trusted, experience-backed resume.",
    },
    {
      q: "How long do opportunities last?",
      a: "They are short-term opportunities, and each company can decide the length of the tenure. This information will be available along with each posted opportunity.",
    },
    {
      q: "Is NxteVia available in my country?",
      a: "NxteVia is expanding globally, starting with opportunities in Canada. As we grow, more regions will be added — so stay tuned!",
    },
  ];

  const companyFaqs = [
    {
      q: "What is NxteVia for companies?",
      a: "NxteVia helps companies connect with skilled talent through short-term, outcomes-based opportunities. Post opportunities, evaluate real work, and hire top performers with confidence.",
    },
    {
      q: "Who can apply to our projects?",
      a: "NxteVia connects you with students, career changers, and emerging professionals. Applicants are motivated to gain real-world experience and showcase their skills through verified work.",
    },
    {
      q: "How do I evaluate applicants?",
      a: "You can review submitted profiles and other application materials. Our platform lets you verify work, give feedback, and approve candidates before considering them for full-time hiring. There is no commitment for offering full-time employment required.",
    },
    {
      q: "What is the Review period of a posted opportunity?",
      a: "Most reviews are completed within 48 hours. You’ll see status updates on your dashboard.",
    },
    {
      q: "What if revisions are requested?",
      a: "You’ll see a comment in the job’s History. Update the brief and resubmit from your dashboard.",
    },
    {
      q: "Can I remove an opportunity?",
      a: "Yes. Open the job and click Remove opportunity in the actions panel.",
    },
    {
      q: "How do I post an opportunity as an employer?",
      a: "Employers can easily sign up, create a brief description of the opportunity, and post an opportunity. Once you receive applications from seekers, you can review profiles, shortlist candidates, and offer opportunities — all within the NxteVia platform.",
    },
  ];

  const faqs = companyMode ? [...baseFaqs, ...companyFaqs] : baseFaqs;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      id="faq"
      className="container py-16 max-w-6xl"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to know about the platform</p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="grid md:grid-cols-2 gap-6 items-start"
      >
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 px-6"
          >
            <AccordionTrigger className="text-left font-medium text-slate-900 dark:text-white hover:text-primary dark:hover:text-white hover:no-underline py-6">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400 pb-6 leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Still have questions?{" "}
          <Link className="text-primary dark:text-indigo-300 font-medium hover:underline" to="/contact">
            Contact our support team
          </Link>
        </p>
      </div>
    </motion.section>
  );
}

function FinalCTA({ seekerMode, companyMode }: { seekerMode: boolean; companyMode: boolean }) {
  const authed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
  const bgImage = companyMode ? `${publicBaseUrl}cta-hiring-talent.png` : `${publicBaseUrl}cta-career-growth.png`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative py-20 overflow-hidden"
    >
      {/* Subtle Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/40 z-10" />
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover object-right opacity-40 grayscale-[0.2] dark:opacity-20"
        />
      </div>

      <div className="container relative z-20 max-w-4xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 px-4 py-1 border-primary/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 backdrop-blur-sm rounded-full">
          {companyMode ? "Enterprise Grade" : "Career Accelerator"}
        </Badge>

        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          {companyMode ? "Ready to find your next star?" : "Start your career journey today."}
        </h2>

        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          {companyMode
            ? "Connect with verified talent and streamline your hiring process."
            : "Connect talent and companies in one integrated space."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
            <Link to={authed ? (companyMode ? "/company/post_opportunities" : "/seekers/browse_opportunities") : "/login"}>
              {companyMode ? "Post Opportunities" : "Browse Opportunities"}
            </Link>
          </Button>
          {!seekerMode && !companyMode && (
            <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full border-slate-200 dark:border-slate-800 hover:bg-white/50 dark:hover:bg-slate-900 hover:text-primary dark:hover:text-white transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <Link to="/signup?next=/company/post-opportunity">
                Post an Opportunity
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default function HomePage() {
  const location = useLocation();
  const seekerMode = location.pathname.startsWith("/seekers/home");
  const params = new URLSearchParams(location.search);
  const companyParam = params.get("company") === "true";
  const companyMode = companyParam || location.pathname.startsWith("/company/home") || location.pathname.startsWith("/company");

  return (
    <Layout>
      <Seo
        title="NxteVia"
        description="Gain real project experience you can showcase on your CV—at home or in a new country."
        canonical={window.location.href}
      />
      <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <HeroOrbit seekerMode={seekerMode} companyMode={companyMode} />
        <Mission />
        <Highlights />
        <FeaturedProjects companyMode={companyMode} />
        <HowItWorks seekerMode={seekerMode} companyMode={companyMode} />
        <FAQ companyMode={companyMode} />
        <FinalCTA seekerMode={seekerMode} companyMode={companyMode} />
      </div>
    </Layout>
  );
}
