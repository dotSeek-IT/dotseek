"use client";

import { useMemo } from "react";
import type { Plan, PlanChoices } from "@/lib/plan/build";
import { gbp, weeks } from "@/lib/plan/format";
import {
  costDrivers,
  costDriverSummary,
  optionForBudget,
  setDriverState,
  type CostDriver,
  type CostOption,
  type ReferenceAnalysis,
} from "@/lib/plan/reference";
import styles from "./Plan.module.css";

const STATES: { id: CostDriver["state"]; label: string }[] = [
  { id: "keep", label: "Keep" },
  { id: "remove", label: "Remove" },
  { id: "later", label: "Add later" },
];

/**
 * "Want something similar within a smaller budget?": Full / Optimised / MVP /
 * Basic versions, budget matching and the feature cost breakdown with
 * Keep / Remove / Add later. Every change updates the quotation immediately.
 */
export function CheaperOptions({
  plan,
  choices,
  reference,
  getOptions,
  onApplyOption,
  onChoices,
}: {
  plan: Plan;
  choices: PlanChoices;
  reference?: ReferenceAnalysis;
  getOptions: () => CostOption[];
  onApplyOption: (option: CostOption) => void;
  onChoices: (choices: PlanChoices) => void;
}) {
  // Options depend on the requirement (answers), not on every toggle; recompute when the estimate changes.
  const options = useMemo(getOptions, [plan.estimate.recommended, plan.selected.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const full = options.find((o) => o.id === "full");
  const drivers = useMemo(() => (full ? costDrivers(full.plan, choices).map((d) => ({ ...d, state: costDrivers(plan, choices).find((x) => x.id === d.id)?.state ?? d.state })) : []), [full, plan, choices]);
  const budget = plan.budget?.[1];
  const fitting = budget !== undefined && Number.isFinite(budget) ? optionForBudget(options, budget) : null;
  // The version matching the current estimate (only the first, when two cost the same).
  const currentId = options.find((o) => Math.abs(o.plan.estimate.recommended - plan.estimate.recommended) < 1)?.id;
  const current = (o: CostOption) => o.id === currentId;

  return (
    <>
      {reference && (
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Your reference: {reference.host}</h3>
          <p>{reference.summary}</p>
          {reference.evidence.length > 0 && <p className={styles.phaseItems}>{reference.evidence.join(" · ")}</p>}
          <p className={styles.note}>
            We use references only to understand layout style, features, interaction patterns and approximate complexity. DotSeek never copies a
            third-party site: your solution uses original implementation, branding, content and assets unless you own them or have permission to
            reuse them.
          </p>
        </section>
      )}

      <section className={styles.block}>
        <h3 className={styles.blockTitle}>Want something similar within a smaller budget?</h3>
        <p className={styles.explain}>{reference?.costDrivers ?? costDriverSummary(drivers, plan.selected.includes("mobile_app") && !plan.selected.includes("frontend"))}</p>
        <div className={styles.options}>
          {options.map((o) => (
            <article key={o.id} className={styles.option2} data-current={current(o) || undefined}>
              <p className={styles.tierLevel}>{o.plan.stageInfo.name}</p>
              <strong>{o.name}</strong>
              <p className={styles.muted}>{o.scope}</p>
              <p className={styles.packagePrice}>
                {gbp(o.plan.estimate.min)}–{gbp(o.plan.estimate.max)}
              </p>
              <p className={styles.muted}>
                Recommended {gbp(o.plan.estimate.recommended)} · {weeks(o.plan.weeks)}
              </p>
              {o.keep.length > 0 && (
                <>
                  <p className={styles.optionLabel}>Keeps</p>
                  <ul className={styles.optionList}>
                    {o.keep.slice(0, 6).map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </>
              )}
              {o.simplify.length > 0 && (
                <>
                  <p className={styles.optionLabel}>Simplifies</p>
                  <ul className={`${styles.optionList} ${styles.optionMuted}`}>
                    {o.simplify.slice(0, 6).map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </>
              )}
              <button type="button" className={styles.smallButton} onClick={() => onApplyOption(o)} disabled={current(o)}>
                {current(o) ? "Selected" : "Use this version"}
              </button>
            </article>
          ))}
        </div>
        <p className={styles.note}>Indicative ranges only; actual pricing depends on the confirmed requirements.</p>
      </section>

      {budget !== undefined && Number.isFinite(budget) && full && full.plan.estimate.recommended > budget && (
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Within your budget of {gbp(budget)}</h3>
          <p>
            Building every feature{reference ? " from the reference" : ""} within {gbp(budget)} would not be realistic. However, we can create a
            simplified Phase 1 version that keeps the most important design and business functionality.
          </p>
          {fitting ? (
            <div className={styles.fitResult}>
              <p>
                <strong>{fitting.name}</strong>, about {gbp(fitting.plan.estimate.recommended)}
              </p>
              <p className={styles.optionLabel}>Included</p>
              <ul>
                {fitting.keep.slice(0, 8).map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
              <p className={styles.optionLabel}>Later upgrades</p>
              <ul>
                {full.keep
                  .filter((k) => !fitting.plan.services.some((x) => x.selected && x.label === k))
                  .slice(0, 8)
                  .map((k) => (
                    <li key={k}>{k}</li>
                  ))}
              </ul>
              <button type="button" className={styles.smallButton} onClick={() => onApplyOption(fitting)}>
                Use this version
              </button>
            </div>
          ) : (
            <p className={styles.muted}>Even the basic version is above this budget. Tell us your budget and the team will suggest how to start.</p>
          )}
        </section>
      )}

      {drivers.length > 0 && (
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>What drives the cost</h3>
          <p className={styles.muted}>Keep, remove or add each feature later; the quotation updates straight away.</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Cost impact</th>
                <th scope="col" className={styles.num}>
                  About
                </th>
                <th scope="col">
                  <span className="sr-only">Choice</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.label}</td>
                  <td>
                    <span className={styles.impactPill} data-impact={d.impact}>
                      {d.impact}
                    </span>
                  </td>
                  <td className={styles.num}>{d.cost ? gbp(d.cost) : ""}</td>
                  <td>
                    <div className={styles.scopeOptions} role="radiogroup" aria-label={`${d.label}: keep, remove or add later`}>
                      {STATES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          role="radio"
                          aria-checked={d.state === st.id}
                          className={styles.scopeOption}
                          onClick={() => onChoices(setDriverState(choices, d, st.id))}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className={styles.block}>
        <h3 className={styles.blockTitle}>Compare options</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Scope</th>
              <th scope="col" className={styles.num}>
                Estimate
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td className={styles.small}>{o.scope}</td>
                <td className={styles.num}>
                  {gbp(o.plan.estimate.min)}–{gbp(o.plan.estimate.max)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
