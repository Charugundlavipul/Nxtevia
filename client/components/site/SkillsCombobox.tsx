import { useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_SKILLS: string[] = [
  "Customer Success Management", "UX Design", "UI Design", "Product Management", "Frontend Development", "Backend Development", "Fullstack", "React", "Next.js", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "SQL", "NoSQL", "Data Analysis", "Power BI", "Tableau", "Excel", "Machine Learning", "NLP", "SEO", "SEM", "Content Writing", "Copywriting", "Email Marketing", "Social Media", "Sales", "CRM", "HubSpot", "Salesforce", "Figma", "UX Research", "QA Testing", "Automation", "Cypress", "Jest", "DevOps", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "APIs", "REST", "GraphQL", "Design", "Branding", "Illustration", "HTML", "CSS", "Accessibility", "WCAG", "Analytics", "Product Analytics", "A/B Testing", "Project Management", "Agile", "Scrum", "Notion", "Zapier"
];

function uniquePush(list: string[], value: string) {
  const v = value.trim();
  if (!v) return list;
  if (list.some((s) => s.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}

export function SkillsCombobox({
  selected,
  onChange,
  placeholder = "Add skills",
  className
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = DEFAULT_SKILLS;
    return pool
      .filter((s) => !selected.includes(s))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 12);
  }, [query, selected]);

  const add = (v: string) => {
    const next = uniquePush(selected, v);
    onChange(next);
    setQuery("");
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const remove = (v: string) => {
    onChange(selected.filter((s) => s !== v));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query.trim()) add(query.trim());
    }
    if (e.key === "Backspace" && !query && selected.length) {
      remove(selected[selected.length - 1]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1 text-sm",
            "focus-within:ring-2 focus-within:ring-ring",
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <span>{s}</span>
              <button type="button" aria-label={`Remove ${s}`} onClick={() => remove(s)} className="opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={selected.length ? "" : placeholder}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search skills" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No matches. Press Enter to add.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((s) => (
                <CommandItem key={s} value={s} onSelect={() => add(s)}>
                  {s}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
