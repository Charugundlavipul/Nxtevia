export function getApplicationStatusLabel(status: string): string {
  const normalized = (status || "").toLowerCase();
  if (normalized === "hired" || normalized === "accepted") return "selected";
  return normalized.replace(/_/g, " ");
}

export function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTeamGoalLabel(goal: string): string {
  if (goal === "hire_full_time") return "Add full-time team members later";
  if (goal === "project_support") return "Gain project support";
  return goal
    .replace(/_/g, " ")
    .replace(/hiring/gi, "selection")
    .replace(/hire/gi, "select");
}
