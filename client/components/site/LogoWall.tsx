import {
  Building2,
  Landmark,
  Rocket,
  ShieldCheck,
  Factory,
  BriefcaseBusiness,
} from "lucide-react";

export function LogoWall() {
  const items = [
    { name: "Acme University", Icon: Landmark },
    { name: "Global NGO", Icon: ShieldCheck },
    { name: "Bright Labs", Icon: Rocket },
    { name: "Northwind", Icon: Factory },
    { name: "Open Skills", Icon: Building2 },
    { name: "StartOps", Icon: BriefcaseBusiness },
  ];
  return (
    <div>
      <ul className="flex flex-wrap items-center gap-2 md:gap-3 py-1">
        {items.map(({ name, Icon }) => (
          <li key={name}>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card text-foreground/90 px-3 py-2 shadow-sm hover:bg-card/80 hover:shadow transition-colors">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">{name}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
