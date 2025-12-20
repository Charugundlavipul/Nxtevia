import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRICES: Record<
  string,
  {
    label: string;
    tiers: { name: string; price: string; features: string[]; cta: string }[];
  }
> = {
  USD: {
    label: "USD",
    tiers: [
      {
        name: "Free",
        price: "$0",
        features: ["1 opportunity / mo", "Email support", "Airtable sync"],
        cta: "Get started",
      },
      {
        name: "Starter",
        price: "$49",
        features: ["Up to 5 opportunities", "Priority listing", "Basic screening"],
        cta: "Choose Starter",
      },
      {
        name: "Growth",
        price: "$199",
        features: [
          "Unlimited opportunities",
          "Featured placement",
          "Talent referrals",
        ],
        cta: "Choose Growth",
      },
    ],
  },
  CAD: {
    label: "CAD",
    tiers: [
      {
        name: "Free",
        price: "$0",
        features: ["1 opportunity / mo", "Email support", "Airtable sync"],
        cta: "Get started",
      },
      {
        name: "Starter",
        price: "$65",
        features: ["Up to 5 opportunities", "Priority listing", "Basic screening"],
        cta: "Choose Starter",
      },
      {
        name: "Growth",
        price: "$269",
        features: [
          "Unlimited opportunities",
          "Featured placement",
          "Talent referrals",
        ],
        cta: "Choose Growth",
      },
    ],
  },
  INR: {
    label: "INR",
    tiers: [
      {
        name: "Free",
        price: "₹0",
        features: ["1 opportunity / mo", "Email support", "Airtable sync"],
        cta: "Get started",
      },
      {
        name: "Starter",
        price: "₹999",
        features: ["Up to 5 opportunities", "Priority listing", "Basic screening"],
        cta: "Choose Starter",
      },
      {
        name: "Growth",
        price: "₹3999",
        features: [
          "Unlimited opportunities",
          "Featured placement",
          "Talent referrals",
        ],
        cta: "Choose Growth",
      },
    ],
  },
};

export function PricingTable() {
  const [currency, setCurrency] = useState<keyof typeof PRICES>("USD");
  const { tiers } = PRICES[currency];

  return (
    <section id="pricing" className="container py-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold">Pricing for Companies</h3>
          <p className="text-muted-foreground text-sm">
            Simple plans. No contracts. Currency selector included.
          </p>
        </div>
        <div className="w-40">
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as keyof typeof PRICES)}
          >
            <SelectTrigger aria-label="Select currency">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>
                Best for{" "}
                {tier.name === "Free"
                  ? "trying things out"
                  : tier.name === "Starter"
                    ? "SMEs and NGOs"
                    : "scaling teams"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-extrabold">{tier.price}</div>
              <ul className="space-y-2 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" asChild>
                <a href="/company/post-opportunity">{tier.cta}</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
