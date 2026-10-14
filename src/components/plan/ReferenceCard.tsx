import type { Plan } from "@/lib/plan/build";
import { gbp, weeks } from "@/lib/plan/format";
import { REFERENCE_FEATURES, REFERENCE_FEATURE_IDS, type ReferenceAnalysis } from "@/lib/plan/referenceFeatures";
import styles from "./Plan.module.css";

/** The services a solution like this needs, in plain groups. */
function likelyServices(plan: Plan): string[] {
  const sel = new Set(plan.selected);
  const any = (...ids: string[]) => ids.some((id) => sel.has(id));
  return [
    any("frontend", "landing") && "Frontend",
    any("backend") && "Backend",
    any("sql_db") && "Database",
    any("admin", "cms") && (sel.has("admin") ? "Admin" : "Content management"),
    (plan.selected.some((id) => id.startsWith("int_")) || any("payments")) && "Integrations",
    plan.services.some((x) => x.selected && x.group === "ai") && "AI",
    any("mobile_app") && "Mobile app",
    "Infrastructure",
  ].filter(Boolean) as string[];
}

/** Chat card after a reference URL is analysed. */
export function ReferenceCard({ analysis, plan }: { analysis: ReferenceAnalysis; plan: Plan }) {
  const detected = REFERENCE_FEATURE_IDS.filter((f) => analysis.features[f]).map((f) => REFERENCE_FEATURES[f]);
  return (
    <section className={styles.card} aria-label="Reference analysis">
      <p className={styles.estimateBadge}>Reference analysis</p>
      <p className={styles.cardTitle}>{analysis.host}</p>
      <dl className={styles.cardFigures}>
        <div>
          <dt>Reference complexity</dt>
          <dd>{plan.stageInfo.name}</dd>
        </div>
        <div>
          <dt>Estimated build range</dt>
          <dd>
            {gbp(plan.estimate.min)}–{gbp(plan.estimate.max)}
          </dd>
        </div>
        <div>
          <dt>Estimated timeline</dt>
          <dd>{weeks(plan.weeks)}</dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>About {analysis.pages}</dd>
        </div>
      </dl>
      <p className={styles.cardLabel}>Likely required services</p>
      <p className={styles.chipsRow}>
        {likelyServices(plan).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </p>
      {detected.length > 0 && (
        <>
          <p className={styles.cardLabel}>Features spotted</p>
          <p className={styles.cardMuted}>{detected.join(" · ")}</p>
        </>
      )}
      <p className={styles.cardMuted}>
        We use references only to understand layout style, features and complexity. Your solution is original, with your own branding, content and
        assets (unless you own the reference or have permission to reuse it).
      </p>
    </section>
  );
}
