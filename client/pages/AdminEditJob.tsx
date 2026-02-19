import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SkillsCombobox } from "@/components/site/SkillsCombobox";
import { COUNTRIES } from "@/lib/countries";
import { adminCompaniesList } from "@/lib/adminCompanies";
import { adminGetSubmission, adminUpsertSubmission, AdminSubmission } from "@/lib/admin";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

interface EditValues {
  org_name: string;
  website?: string;
  country: "US" | "IN" | "CA";
  state?: string;
  city?: string;
  postal_code?: string;
  contact_email: string;
  modality: "remote" | "hybrid" | "on-site";
  title: string;
  problem_statement: string;
  desired_outcome: string;
  scope: string;
  duration: string;
  hours_per_week: string;
  stipend: string;
  skills_csv: string; // comma-separated
}

export default function AdminEditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const submission = React.useMemo(() => (id ? adminGetSubmission(id) : undefined), [id]);
  const viewSub: AdminSubmission = React.useMemo(() => {
    if (submission) return submission;
    const idVal = id || "";
    const companies = adminCompaniesList();
    let foundCompany: ReturnType<typeof adminCompaniesList>[number] | undefined;
    let foundPosting: (ReturnType<typeof adminCompaniesList>[number]["postings"][number]) | undefined;
    for (const c of companies) {
      const p = c.postings.find((pp) => pp.submissionId === idVal);
      if (p) { foundCompany = c; foundPosting = p; break; }
    }
    const now = new Date().toISOString();
    return {
      id: idVal || `sub_${Date.now()}`,
      org_name: foundCompany?.name ?? "Acme Labs",
      website: foundCompany?.website ?? "https://example.org",
      country: (foundCompany?.country as any) ?? "US",
      state: undefined,
      city: foundCompany ? undefined : "San Francisco",
      postal_code: undefined,
      contact_email: foundCompany?.email ?? "hr@example.org",
      modality: ["remote", "hybrid", "on-site"][idVal.length % 3] as any,
      title: foundPosting?.title ?? "Onboarding microsite",
      desired_outcome: "Publish project outcome with clear KPIs.",
      scope: "Milestones, acceptance criteria, and final outputs with QA.",
      duration: idVal.length % 2 === 0 ? "0–3 months" : "4–6 months",
      hours_per_week: idVal.length % 2 === 0 ? "5-10" : "10-20",
      stipend: idVal.length % 4 === 0 ? "No pay" : "Benefits based",
      skills_csv: idVal.length % 2 === 0 ? "React, SQL, Data Viz" : "Figma, HTML, SEO",
      createdAt: now,
      status: foundPosting?.status ?? "pending",
      history: [
        { at: now, action: "submitted" },
        ...(foundPosting?.status ? [{ at: now, action: foundPosting.status }] as any : []),
      ],
    };
  }, [submission, id]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditValues>({
    defaultValues: {
      org_name: "",
      website: "",
      country: "US",
      state: "",
      city: "",
      postal_code: "",
      contact_email: "",
      modality: "remote",
      title: "",
      problem_statement: "",
      desired_outcome: "",
      scope: "",
      duration: "0–3 months",
      hours_per_week: "5-10",
      stipend: "No pay",
      skills_csv: "",
    },
  });

  React.useEffect(() => {
    reset({
      org_name: viewSub.org_name,
      website: viewSub.website || "",
      country: viewSub.country,
      state: viewSub.state || "",
      city: viewSub.city || "",
      postal_code: viewSub.postal_code || "",
      contact_email: viewSub.contact_email,
      modality: viewSub.modality,
      title: viewSub.title,
      problem_statement: "", // AdminSubmission mock doesn't have problem_statement separate, likely needs update or ignored.
      desired_outcome: viewSub.desired_outcome,
      scope: viewSub.scope,
      duration: viewSub.duration,
      hours_per_week: viewSub.hours_per_week,
      stipend: viewSub.stipend,
      skills_csv: viewSub.skills_csv,
    });
  }, [viewSub, reset]);

  const onSubmit = (values: EditValues) => {
    const updated: AdminSubmission = {
      id: viewSub.id,
      createdAt: submission?.createdAt || viewSub.createdAt || new Date().toISOString(),
      status: submission?.status || viewSub.status,
      history: submission?.history || viewSub.history || [{ at: new Date().toISOString(), action: "submitted" }],
      org_name: values.org_name,
      website: values.website,
      country: values.country,
      state: values.state,
      city: values.city,
      postal_code: values.postal_code,
      contact_email: values.contact_email,
      modality: values.modality,
      title: values.title,
      desired_outcome: values.desired_outcome,
      scope: values.scope,
      duration: values.duration,
      hours_per_week: values.hours_per_week,
      stipend: values.stipend,
      skills_csv: values.skills_csv,
    };
    adminUpsertSubmission(updated);
    navigate(`/admin/jobs/job_id=${viewSub.id}`);
  };

  return (
    <Layout>
      <Seo title={`Edit Job – ${viewSub.title} (Admin)`} canonical={window.location.href} />
      <section className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold">Edit Job</h1>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="text-lg font-semibold mb-2">Company info</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Company / Org name</label>
                <Input {...register("org_name", { required: true })} placeholder="Acme Labs" aria-invalid={!!errors.org_name} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <Input type="url" {...register("website")} placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Select value={watch("country")} onValueChange={(v) => setValue("country", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {COUNTRIES.map(({ code, label }) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State / Province</label>
                <Input {...register("state")} placeholder="e.g., California" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input {...register("city")} placeholder="e.g., San Francisco" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal code</label>
                <Input {...register("postal_code")} placeholder="e.g., 94105" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Contact email</label>
                <Input type="email" {...register("contact_email", { required: true, pattern: /[^\s@]+@[^\s@]+\.[^\s@]+/ })} placeholder="name@org.com" aria-invalid={!!errors.contact_email} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-lg font-semibold mb-2">Opportunity details</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Workmode</label>
                <Select value={watch("modality")} onValueChange={(v) => setValue("modality", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On‑site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Opportunity title</label>
                <Input {...register("title", { required: true })} placeholder="Design an onboarding microsite" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Problem Statement</label>
                <Textarea rows={4} {...register("problem_statement")} placeholder="What is the problem you are trying to solve?" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Desired Outcome</label>
                <Textarea rows={4} {...register("desired_outcome", { required: true })} placeholder="What outcome do you want to achieve?" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Opportunity scope</label>
                <Textarea rows={4} {...register("scope", { required: true })} placeholder="Describe milestones, acceptance criteria, and final outputs" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <Select value={watch("duration")} onValueChange={(v) => setValue("duration", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0–3 months">0–3 months</SelectItem>
                    <SelectItem value="4–6 months">4–6 months</SelectItem>
                    <SelectItem value="7–9 months">7–9 months</SelectItem>
                    <SelectItem value="10–12 months">10–12 months</SelectItem>
                    <SelectItem value=">12 months">More than 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hours / week</label>
                <Select value={watch("hours_per_week")} onValueChange={(v) => setValue("hours_per_week", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hours/week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10">5–10</SelectItem>
                    <SelectItem value="10-20">10–20</SelectItem>
                    <SelectItem value="20+">20+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stipend</label>
                <Select value={watch("stipend")} onValueChange={(v) => setValue("stipend", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stipend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No pay">No pay</SelectItem>
                    <SelectItem value="Benefits based">Benefits based</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Skills (comma‑separated)</label>
                <SkillsCombobox selected={watch("skills_csv").split(",").map((s) => s.trim()).filter(Boolean)} onChange={(arr) => setValue("skills_csv", arr.join(", "))} placeholder="e.g., Customer Success Management, UX Design" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="h-12 rounded-xl">Save Changes</Button>
            <Button type="button" variant="ghost" onClick={() => navigate(`/admin/jobs/job_id=${viewSub.id}`)}>Cancel</Button>
          </div>
        </form>
      </section>
    </Layout>
  );
}
