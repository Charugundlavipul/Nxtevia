import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RegionTabs() {
  const features = [
    "Credit‑bearing templates",
    "DEI pipelines",
    "FERPA‑aware privacy",
    "Mobile‑first, low data usage",
    "WhatsApp updates",
    "Stipend friendly",
    "WIL/Co‑op alignment",
    "EN/FR toggle",
    "SME/NGO focus",
  ];
  return (
    <section className="container py-12">
      <h3 className="text-xl font-semibold mb-4">What you’ll get (global)</h3>
      <ul className="grid gap-2 md:grid-cols-3 text-sm">
        {features.map((f) => (
          <li key={f} className="p-3 rounded-md border bg-card">
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}
