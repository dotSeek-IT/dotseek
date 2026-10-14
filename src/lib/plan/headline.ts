import type { Plan } from "./build";

/**
 * What the customer actually asked for, from the plan itself: the app and/or
 * website being built (e.g. "Hybrid mobile app (iPhone first)"), rather than
 * the broad solution category. Used in the quotation's Solution box and title.
 */
export function solutionHeadline(plan: Plan, fallback: string): { name: string; detail: string } {
  const picked = (id: string) => plan.services.find((s) => s.id === id && s.selected);
  const app = picked("mobile_app");
  const web = picked("frontend") ?? picked("landing");
  const name = app && web ? `${web.label} + ${app.label}` : (app?.label ?? (plan.solution === "website" && web ? web.label : fallback));
  const architecture = plan.tiers.find((t) => t.current)?.name;
  const detail = [
    `${plan.stageInfo.name} stage`,
    picked("managed_backend") ? "Firebase or Supabase backend" : architecture ? `${architecture} architecture` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { name, detail };
}
