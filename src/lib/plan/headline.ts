import type { Plan } from "./build";

/**
 * What the customer actually asked for, from the plan itself: the app and/or
 * website being built (e.g. "Hybrid mobile app (iPhone first)"), rather than
 * the broad solution category. Used in the quotation's Solution box and title.
 */
export function solutionHeadline(plan: Plan, fallback: string): { name: string; detail: string } {
  const picked = (id: string) => plan.services.find((s) => s.id === id && s.selected);
  const app = picked("mobile_app");
  // Customer-facing names for the web part (the catalogue's line labels are internal).
  const web = picked("landing")
    ? "Landing page website"
    : picked("frontend")
      ? plan.solution === "website"
        ? picked("ecommerce")
          ? "E-commerce website"
          : picked("admin") || picked("auth")
            ? "Website with customer portal"
            : "Website"
        : plan.solution === "software"
          ? "Web application"
          : null
      : null;
  const name = app && web ? `${web} + ${app.label}` : (app?.label ?? web ?? fallback);
  const architecture = plan.tiers.find((t) => t.current)?.name;
  const detail = [
    `${plan.stageInfo.name} stage`,
    picked("managed_backend") ? "Firebase or Supabase backend" : architecture ? `${architecture} architecture` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { name, detail };
}
