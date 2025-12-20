import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { codeToFlagEmoji } from "@/lib/countries";
import { type UiProject } from "@/lib/projects";

export function ProjectCard({ project }: { project: UiProject }) {
  const flag = codeToFlagEmoji(project.country || "");
  const region = (project.country || "").toLowerCase();
  return (
    <Card className="h-full flex flex-col bg-card">
      <CardHeader className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            {project.title}
          </CardTitle>
          <Badge variant="secondary">{flag}</Badge>
        </div>
        <CardDescription className="truncate">{project.org}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          {project.skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-2">
          <span className="rounded-full border px-2 py-1 bg-white text-[#545454]">
            {region}
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {project.modality}
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {project.durationWeeks} weeks
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {project.hoursPerWeek} hrs/week
          </span>
          {project.stipend !== "none" && (
            <span className="rounded-md bg-warning text-warning-foreground px-2 py-1">
              {project.stipend === "micro" ? "Small pay" : "Paid"}
            </span>
          )}
        </div>
        <div className="pt-2 flex gap-2">
          <Button
            asChild
            className="flex-1"
            aria-label={`Apply to ${project.title}`}
          >
            <Link to={`/apply/form/${encodeURIComponent(project.id)}`}>
              Apply
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1"
            variant="details"
            aria-label={`View details for ${project.title}`}
          >
            <Link to={`/seekers/opportunities/${encodeURIComponent(project.id)}`}>
              Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
