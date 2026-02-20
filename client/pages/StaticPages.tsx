import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlaceholderPage from "./PlaceholderPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { COUNTRIES } from "@/lib/countries";
import { ArrowRight, CheckCircle2, Building2, GraduationCap, HelpCircle } from "lucide-react";

function SkillsAutosuggestRHFField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const list = (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <SkillsCombobox
      selected={list}
      onChange={(arr) => onChange(arr.join(", "))}
      placeholder="e.g., Customer Success Management, UX Design"
    />
  );
}

export const PostProject = () => {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      org: "",
      website: "",
      country: "US",
      region: "",
      city: "",
      postalCode: "",
      contactEmail: "",
      title: "",
      problem: "",
      scope: "",
      skills: "",
      modality: "remote",
      duration: "0-3m",
      hours: "5-10",
      stipend: "none",
    },
  });

  const onSubmit = (values: any) => {
    setSubmitted(true);
    toast({
      title: "Thanks!",
      description: "We’ll review in 24–48 hours and publish.",
      duration: 3000,
    });
    console.log("Post an Opportunity (prototype)", values);
    reset();
  };

  return (
    <Layout>
      <Seo
        title="Post an Opportunity – NxteVia"
        description="Submit a scoped learning project. Reviewed within 24–48 hours."
        canonical={window.location.href}
      />
      <section className="relative py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Post an Opportunity</h1>
            <p className="text-slate-600 dark:text-slate-400">Submit a scoped project to connect with top talent.</p>
          </div>

          {submitted ? (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submission Received!</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Thanks! We’ll review your opportunity in 24–48 hours and publish it to our network.
                </p>
                <Button className="mt-6" onClick={() => setSubmitted(false)}>Post Another</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-8">
                <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>

                  {/* Company Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b pb-2">Company Details</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                        Company / Org name
                      </label>
                      <Input
                        {...register("org", { required: true })}
                        placeholder="Acme Labs"
                        className="bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Website
                        </label>
                        <Input
                          {...register("website")}
                          placeholder="https://"
                          type="url"
                          className="bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Country
                        </label>
                        <Select
                          value={watch("country")}
                          onValueChange={(v) => setValue("country", v)}
                        >
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {COUNTRIES.map(({ code, label }) => (
                              <SelectItem key={code} value={code}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          State / Province
                        </label>
                        <Input {...register("region")} placeholder="e.g., California" className="bg-slate-50 dark:bg-slate-950" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">City</label>
                        <Input
                          {...register("city")}
                          placeholder="e.g., San Francisco"
                          className="bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Postal code
                        </label>
                        <Input {...register("postalCode")} placeholder="e.g., 94105" className="bg-slate-50 dark:bg-slate-950" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Contact email
                        </label>
                        <Input
                          {...register("contactEmail", { required: true })}
                          placeholder="name@org.com"
                          type="email"
                          className="bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Modality
                        </label>
                        <Select
                          value={watch("modality")}
                          onValueChange={(v) => setValue("modality", v)}
                        >
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                            <SelectValue placeholder="Work mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="on-site">On‑site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Opportunity Details */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b pb-2">Opportunity Details</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                        Opportunity title
                      </label>
                      <Input
                        {...register("title", { required: true })}
                        placeholder="Design an onboarding microsite"
                        className="bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                        Desired outcome
                      </label>
                      <Textarea
                        {...register("problem", { required: true })}
                        rows={4}
                        placeholder="What outcome do you want to achieve?"
                        className="bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                        Opportunity scope
                      </label>
                      <Textarea
                        {...register("scope", { required: true })}
                        rows={4}
                        placeholder="Describe milestones, acceptance criteria, and final outputs"
                        className="bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Duration
                        </label>
                        <Select
                          value={watch("duration")}
                          onValueChange={(v) => setValue("duration", v)}
                        >
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-3m">0–3 months</SelectItem>
                            <SelectItem value="4-6m">4–6 months</SelectItem>
                            <SelectItem value="7-9m">7–9 months</SelectItem>
                            <SelectItem value="10-12m">10–12 months</SelectItem>
                            <SelectItem value=">12m">More than 12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Hours / week
                        </label>
                        <Select
                          value={watch("hours")}
                          onValueChange={(v) => setValue("hours", v)}
                        >
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                            <SelectValue placeholder="Hours/week" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5-10">5–10</SelectItem>
                            <SelectItem value="10-15">10–15</SelectItem>
                            <SelectItem value="15-20">15–20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                          Stipend
                        </label>
                        <Select
                          value={watch("stipend")}
                          onValueChange={(v) => setValue("stipend", v)}
                        >
                          <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                            <SelectValue placeholder="Stipend" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No pay</SelectItem>
                            <SelectItem value="micro" disabled>
                              Benefits based (Coming soon)
                            </SelectItem>
                            <SelectItem value="modest" disabled>
                              Paid (Coming soon)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                        Skills (comma‑separated)
                      </label>
                      <SkillsAutosuggestRHFField
                        value={watch("skills")}
                        onChange={(v) => setValue("skills", v)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Submitting creates a draft; we review for ethics & safety.
                    </span>
                    <Button type="submit" size="lg" className="shadow-lg shadow-primary/20">
                      Submit Opportunity
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const Apply = () => (
  <Layout>
    <Seo
      title="Apply – NxteVia"
      description="Apply to opportunities in minutes with a short profile and pitch."
      canonical={window.location.href}
    />
    <PlaceholderPage
      title="Apply"
      description="Application form with optional prefill from ?projectId will be added here."
    />
  </Layout>
);

export const Students = () => (
  <Layout>
    <Seo
      title="Students – NxteVia"
      description="Close your résumé gap with verifiable experience."
      canonical={window.location.href}
    />
    <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20">
              For Seekers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Build Your Resume with <br />
              <span className="text-primary">Real Experience</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Turn short-term collaborations into verified experience — and open doors to your next step. No more "experience required" paradox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <a href="/seekers/opportunities">Browse opportunities <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/home#faq">Read FAQs</a>
              </Button>
            </div>


          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-3xl blur-2xl transform -rotate-3"></div>
            <img
              src="/assets/static-1.webp"
              alt="Student showcasing verifiable credential"
              className="relative w-full h-[500px] object-cover rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export const Companies = () => (
  <Layout>
    <Seo
      title="Companies – NxteVia"
      description="Ship opportunities faster and discover great talent."
      canonical={window.location.href}
    />
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl transform rotate-3"></div>
            <img
              src="/assets/static-2.webp"
              alt="Hiring meeting success"
              className="relative w-full h-[500px] object-cover rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              For Companies
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              See Talent in <br />
              <span className="text-indigo-600 dark:text-indigo-400">Action</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Post Openings, View Applicants and Bring the Best On-Board! Evaluate candidates based on real work, not just resumes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                <a href="/company/post-opportunity">Post an opportunity <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Diverse Talent</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Risk-Free Hiring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export const Educators = () => (
  <Layout>
    <PlaceholderPage
      title="Educators"
      description="WIL/Co‑op alignment and educator kit CTA."
    />
  </Layout>
);

export const US = () => (
  <Layout>
    <PlaceholderPage
      title="United States"
      description="Regional landing with localized proof points."
    />
  </Layout>
);

export const IN = () => (
  <Layout>
    <PlaceholderPage
      title="India"
      description="Regional landing with low‑data and stipend details."
    />
  </Layout>
);

export const CA = () => (
  <Layout>
    <PlaceholderPage
      title="Canada"
      description="Regional landing with WIL/Co‑op focus and FR band."
    />
  </Layout>
);

export const Blog = () => (
  <Layout>
    <PlaceholderPage
      title="Blog"
      description="Seed posts will be added here."
    />
  </Layout>
);

export const BlogPost = () => (
  <Layout>
    <PlaceholderPage
      title="Blog Post"
      description="Blog detail template to come."
    />
  </Layout>
);

export const About = () => (
  <Layout>
    <PlaceholderPage title="About" />
  </Layout>
);

export const Contact = () => (
  <Layout>
    <PlaceholderPage title="Contact" />
  </Layout>
);

export const FAQ = () => {
  const items = [
    {
      q: "What is NxteVia?",
      a: "NxteVia is a platform that helps freshers and professionals gain real‑world opportunity experience they can showcase on their CVs. Each opportunity is verified, so your skills and contributions carry weight with future employers.",
    },
    {
      q: "How long do opportunities last?",
      a: "Opportunities typically run between 2 to 8 weeks, depending on scope. You’ll see the estimated duration before applying.",
    },
    {
      q: "How is NxteVia different from an internship?",
      a: "Internships often require long commitments and may be hard to access. NxteVia offers short, flexible, structured opportunities that directly give you proof of skills — without needing a traditional internship.",
    },
    {
      q: "Is NxteVia available in my country?",
      a: "NxteVia supports opportunities in multiple regions and is expanding globally — starting with the US, India, and Canada.",
    },
    {
      q: "Can employers trust NxteVia credentials?",
      a: "Yes. Each opportunity and credential is verified by the organization/mentor you work with, making it credible and recognizable by employers.",
    },
    {
      q: "How do I post an opportunity as an employer?",
      a: "Employers can sign up, create a brief, and post an opportunity. You’ll receive applications from seekers/professionals and can review, shortlist, and assign quickly.",
    },
    {
      q: "What if I don’t finish an opportunity?",
      a: "We encourage full commitment, but if you cannot complete it, the employer can record it as incomplete. In such cases, you won’t receive a credential, but you can always reapply for new opportunities.",
    },
  ];
  return (
    <Layout>
      <Seo
        title="FAQ – NxteVia"
        description="Frequently asked questions about NxteVia opportunities and credentials."
        canonical={window.location.href}
      />
      <section className="py-20 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about NxteVia opportunities and credentials.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="grid gap-4"
          >
            {items.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 px-6 shadow-sm"
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
              <a href="/contact" className="text-primary dark:text-indigo-300 font-medium hover:underline">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const Privacy = () => (
  <Layout>
    <PlaceholderPage title="Privacy" />
  </Layout>
);

export const Terms = () => (
  <Layout>
    <PlaceholderPage title="Terms" />
  </Layout>
);
