"use client";

import { useEffect, useRef, useState } from "react";
import { groupLabels, INFRA_GROUPS, marketMeta, pricingMeta, stageById, stages, type ItemGroup } from "@/content/pricing";
import type { OfferQuote } from "@/lib/plan/offer";
import { chooseTier, setScope, toggleChoice, type Plan, type PlanChoices, type ServiceView } from "@/lib/plan/build";
import { solutionHeadline } from "@/lib/plan/headline";
import type { ScopeId } from "@/content/pricing";
import { gbp, gbpRange, moneyRange, perMonth, ratingLabel, weeks } from "@/lib/plan/format";
import { Icon } from "@/components/common/Icon";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { CheaperOptions } from "./CheaperOptions";
import { QuotationView } from "./QuotationView";
import type { CostOption, ReferenceAnalysis } from "@/lib/plan/reference";
import styles from "./Plan.module.css";

export type PlanBrief = {
  title?: string;
  overview?: string;
  architecture?: string;
  advice?: { item: string | null; action: "add" | "remove" | "info"; message: string }[];
};

type PlanDialogProps = {
  plan: Plan;
  solutionTitle: string;
  brief?: PlanBrief;
  briefStatus: "idle" | "loading" | "ready" | "unavailable";
  choices: PlanChoices;
  onChoices: (choices: PlanChoices) => void;
  /** Adjusts the options to fit a target price; returns what changed. */
  onFitBudget: (target: number) => string[];
  /** Active new-customer offer for this estimate (admin-configured). */
  offer?: OfferQuote | null;
  negotiation?: { preferredBudget?: number; note?: string };
  /** "Request a better price": saved with the enquiry, never promised. */
  onNegotiate: (n: { preferredBudget?: number; note?: string }) => void;
  reference?: ReferenceAnalysis;
  getOptions: () => CostOption[];
  onApplyOption: (option: CostOption) => void;
  /** Applies the next cheaper version; returns its name, or null when already the leanest. */
  onMakeCheaper: () => string | null;
  /** Shown while the enquiry hasn't moved past the plan step. */
  onContinue?: () => void;
  onConsult?: () => void;
  onModify: () => void;
  /** Customer details for the quotation; an email is required to view it. */
  contact: { name?: string; email?: string; company?: string; phone?: string };
  onContact: (contact: { email: string; name?: string }) => void;
  onClose: () => void;
};

type Tab = "quote" | "cheaper" | "architecture" | "compare";

const STATUS: Record<ServiceView["status"], string> = {
  included: "Included",
  recommended: "Recommended",
  optional: "Optional",
  not_needed: "Not needed yet",
};

const FEATURE_GROUPS: ItemGroup[] = ["product", "ai", "integrations", "communication"];

/**
 * Full-screen solution plan: AI-generated indicative estimate, architecture
 * builder and comparisons. Every number comes from the pricing engine and
 * recalculates instantly when the customer changes an option.
 */
export function PlanDialog(props: PlanDialogProps) {
  const { plan, brief, briefStatus, choices, onChoices, onClose } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const TABS: { id: Tab; label: string }[] = [
    { id: "quote", label: "Quotation" },
    { id: "cheaper", label: props.reference ? "Reference & cheaper options" : "Cheaper options" },
    { id: "architecture", label: "Architecture" },
    { id: "compare", label: "Compare" },
  ];
  const [tab, setTab] = useState<Tab>(props.reference ? "cheaper" : "quote");
  const [cheaperNote, setCheaperNote] = useState<string>();
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      // Return focus to whatever opened the estimate (card or review action).
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const toggle = (id: string, on: boolean) => onChoices(toggleChoice(choices, id, on));
  const scope = (id: string, value: ScopeId) => onChoices(setScope(choices, id, value));
  const selected = new Set(plan.selected);
  const advice: Plan["advice"] = [...plan.advice, ...(brief?.advice ?? []).map((a, i) => ({ id: `ai-${i}`, item: a.item ?? undefined, action: a.action, message: a.message }))];
  const stage = stageById(plan.stage)!;
  const applicable = (a: (typeof advice)[number]) =>
    a.item && ((a.action === "remove" && selected.has(a.item)) || (a.action === "add" && !selected.has(a.item)));

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    document.getElementById(`plan-tab-${next.id}`)?.focus();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="plan-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.shell}>
        <header className={styles.head}>
          <div className={styles.headText}>
            <p className={styles.estimateBadge}>{pricingMeta.label}</p>
            <h2 id="plan-title" className={styles.title}>
              {brief?.title || `${props.solutionTitle} plan`}
            </h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close estimate">
            <Icon name="close" />
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Estimate sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`plan-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`plan-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              className={styles.tab}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          <div className={styles.main} id={`plan-panel-${tab}`} role="tabpanel" aria-labelledby={`plan-tab-${tab}`} tabIndex={0}>
            {tab === "quote" && (
              <>
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Your requirement</h3>
                  {briefStatus === "loading" && <p className={styles.muted}>The AI consultant is reviewing your answers…</p>}
                  {brief?.overview && <p>{brief.overview}</p>}
                  <dl className={styles.profile}>
                    {plan.profile.map((p) => (
                      <div key={p.label}>
                        <dt>{p.label}</dt>
                        <dd>{p.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className={styles.block} aria-labelledby="stage-title">
                  <h3 id="stage-title" className={styles.blockTitle}>
                    Business stage: {stage.name}
                  </h3>
                  <p className={styles.muted}>{stage.summary} Start where you are and scale the same solution as the business grows.</p>
                  <ol className={styles.stages}>
                    {stages.map((st) => (
                      <li key={st.id} aria-current={st.id === plan.stage ? "step" : undefined}>
                        <strong>{st.name}</strong>
                        <span>{st.priceLabel}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <PriceSlider plan={plan} onFit={props.onFitBudget} onReset={() => onChoices({ provider: choices.provider })} />

                {advice.length > 0 && (
                  <section className={styles.block}>
                    <h3 className={styles.blockTitle}>Consultant recommendations</h3>
                    <ul className={styles.advice}>
                      {advice.map((a) => (
                        <li key={a.id}>
                          <Icon name="sparkle" />
                          <p>{a.message}</p>
                          {applicable(a) && (
                            <button type="button" className={styles.smallButton} onClick={() => toggle(a.item!, a.action === "add")}>
                              {a.action === "remove" ? "Remove it" : "Add it"}
                            </button>
                          )}
                          {a.choices && (
                            <button type="button" className={styles.smallButton} onClick={() => onChoices(a.choices!)}>
                              {a.choicesLabel}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Development estimate</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Item</th>
                        <th scope="col" className={styles.num}>
                          Range
                        </th>
                        <th scope="col" className={styles.num}>
                          Recommended
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.lines.map((l) => (
                        <tr key={l.id}>
                          <td>{l.label}</td>
                          <td className={`${styles.num} ${styles.subtle}`}>{l.min === l.max ? "" : `${gbp(l.min)}–${gbp(l.max)}`}</td>
                          <td className={styles.num}>{gbp(l.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row">Estimated total</th>
                        <td className={`${styles.num} ${styles.subtle}`}>
                          {gbp(plan.estimate.min)}–{gbp(plan.estimate.max)}
                        </td>
                        <td className={styles.num}>{gbp(plan.estimate.recommended)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <p className={styles.muted}>
                    Estimated timeline {weeks(plan.weeks)}. Based on about {plan.days} person-days of work.
                  </p>
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Features</h3>
                  <p className={styles.muted}>
                    Turn anything on or off, and choose Basic, Advanced or Custom for each item. The estimate updates straight away.
                  </p>
                  {FEATURE_GROUPS.map((group) => (
                    <ServiceGroup key={group} group={group} services={plan.services} onToggle={toggle} onScope={scope} />
                  ))}
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Hosting and running costs</h3>
                  <table className={styles.table}>
                    <tbody>
                      {plan.monthly.items.map((i) => (
                        <tr key={i.label}>
                          <td>
                            {i.label}
                            {i.usage && <span className={styles.tag}>usage based</span>}
                          </td>
                          <td className={styles.num}>{perMonth(i.range)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row">Running costs</th>
                        <td className={styles.num}>{perMonth(plan.monthly.running)}</td>
                      </tr>
                      <tr>
                        <th scope="row">Support & maintenance plan</th>
                        <td className={styles.num}>{perMonth(plan.monthly.maintenance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Recommended implementation phases</h3>
                  <ol className={styles.phases}>
                    {plan.phases.map((ph) => (
                      <li key={ph.name}>
                        <p className={styles.phaseHead}>
                          <strong>
                            {ph.name}
                            {ph.withinBudget && <span className={styles.fits}>Within your budget</span>}
                          </strong>
                          {ph.cost > 0 && (
                            <span>
                              {gbp(ph.cost)} <small className={styles.subtle}>({gbp(ph.min)}–{gbp(ph.max)})</small>
                            </span>
                          )}
                        </p>
                        <p className={styles.muted}>{ph.summary}</p>
                        <p className={styles.phaseItems}>{ph.items.join(" · ")}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}

            {tab === "cheaper" && (
              <CheaperOptions
                plan={plan}
                choices={choices}
                reference={props.reference}
                getOptions={props.getOptions}
                onApplyOption={props.onApplyOption}
                onChoices={onChoices}
              />
            )}

            {tab === "architecture" && (
              <>
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Architecture level</h3>
                  <div className={styles.tiers} role="radiogroup" aria-label="Architecture level">
                    {plan.tiers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={t.current}
                        className={styles.tierCard}
                        onClick={() => onChoices(chooseTier(choices, t.id))}
                      >
                        <span className={styles.tierTop}>
                          <span className={styles.tierLevel}>Level {t.level}</span>
                          {t.recommended && <span className={styles.recommended}>Recommended</span>}
                        </span>
                        <strong>{t.name}</strong>
                        <span className={styles.tierTagline}>{t.tagline}</span>
                        <span className={styles.tierCost}>{perMonth(t.monthly)}</span>
                        <span className={styles.tierFor}>{t.bestFor.slice(0, 3).join(" · ")}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Your architecture</h3>
                  <ArchitectureDiagram diagram={plan.diagram} caption="Updates automatically as you change features and services." />
                  {briefStatus === "loading" && <p className={styles.muted}>The AI consultant is explaining the architecture…</p>}
                  {brief?.architecture && <p className={styles.explain}>{brief.architecture}</p>}
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Infrastructure services</h3>
                  <p className={styles.muted}>
                    Each service shows why it is or isn&apos;t recommended for you, and how it changes cost, performance and complexity.
                  </p>
                  {INFRA_GROUPS.map((group) => (
                    <ServiceGroup key={group} group={group} services={plan.services} onToggle={toggle} onScope={scope} detailed />
                  ))}
                </section>

                {plan.upgradePath.length > 0 && (
                  <section className={styles.block}>
                    <h3 className={styles.blockTitle}>Future upgrade path</h3>
                    <ol className={styles.upgrade}>
                      {plan.upgradePath.map((u) => (
                        <li key={u.tier}>
                          <strong>{u.tier}</strong> <span className={styles.muted}>{perMonth(u.monthly)}</span>
                          <p>{u.adds.map((a) => `+ ${a}`).join("   ")}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </>
            )}

            {tab === "compare" && (
              <>
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Package options</h3>
                  <div className={styles.packages}>
                    {plan.packages.map((p, i) => (
                      <div key={p.id} className={styles.package} data-current={p.current || undefined}>
                        <p className={styles.tierLevel}>Option {i + 1}</p>
                        <strong>{p.name}</strong>
                        <p className={styles.muted}>{p.summary}</p>
                        <p className={styles.packagePrice}>{gbp(p.build)}</p>
                        <p className={styles.muted}>
                          {perMonth(p.monthly)} · {weeks(p.weeks)}
                        </p>
                        <button type="button" className={styles.smallButton} onClick={() => onChoices(p.choices)} disabled={p.current}>
                          {p.current ? "Selected" : "Use this package"}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Cloud provider comparison</h3>
                  <div className={styles.providerScroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th scope="col">Provider</th>
                          <th scope="col" className={styles.num}>
                            Monthly estimate
                          </th>
                          <th scope="col">Scalability</th>
                          <th scope="col">Reliability</th>
                          <th scope="col">Management</th>
                          <th scope="col">Pros and limitations</th>
                          <th scope="col">
                            <span className="sr-only">Choose</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.providers.map((p) => (
                          <tr key={p.id} data-unsuitable={!p.suitable || undefined}>
                            <td>
                              {p.option && <span className={styles.option}>Option {p.option}</span>}
                              <strong>{p.name}</strong>
                              <small className={styles.block2}>{p.suitable ? p.suits : "Not suited to this architecture level"}</small>
                            </td>
                            <td className={styles.num}>{perMonth(p.monthly)}</td>
                            <td>{ratingLabel(p.scalability)}</td>
                            <td>{ratingLabel(p.reliability)}</td>
                            <td>{p.management}</td>
                            <td className={styles.small}>
                              <strong>Pros:</strong> {p.pros.join("; ")}
                              <br />
                              <strong>Limitations:</strong> {p.limits.join("; ")}
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.smallButton}
                                aria-pressed={p.current}
                                disabled={!p.suitable}
                                onClick={() => onChoices({ ...choices, provider: p.id })}
                              >
                                {p.current ? "Selected" : "Use"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className={styles.note}>{pricingMeta.infraDisclaimer}</p>
                </section>

                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Indicative Market Estimate</h3>
                  <p className={styles.muted}>Typical prices for the same scope from freelancers and agencies, in local currency.</p>
                  <div className={styles.providerScroll}>
                    <table className={`${styles.table} ${styles.marketTable}`}>
                      <thead>
                        <tr>
                          <th scope="col">Market</th>
                          <th scope="col" className={styles.num}>
                            Freelancer
                          </th>
                          <th scope="col" className={styles.num}>
                            Agency
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={styles.highlightRow}>
                          <th scope="row">DotSeek</th>
                          <td className={styles.num} colSpan={2}>
                            {gbp(plan.estimate.min)}–{gbp(plan.estimate.max)} (recommended {gbp(plan.estimate.recommended)})
                          </td>
                        </tr>
                        {plan.markets.map((m) => (
                          <tr key={m.id}>
                            <td>{m.name}</td>
                            <td className={styles.num}>
                              {moneyRange(m.freelancer, m.currency, m.locale)}
                              {m.currency !== "GBP" && <small className={styles.block2}>{gbpRange(m.freelancerGbp)}</small>}
                            </td>
                            <td className={styles.num}>
                              {moneyRange(m.agency, m.currency, m.locale)}
                              {m.currency !== "GBP" && <small className={styles.block2}>{gbpRange(m.agencyGbp)}</small>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {plan.savings && (
                    <p>
                      Compared with a typical UK agency, the recommended estimate is <strong>{plan.savings.percent[0]}% to {plan.savings.percent[1]}%</strong>{" "}
                      lower ({gbpRange(plan.savings.amount)}).
                    </p>
                  )}
                  <p className={styles.note}>
                    {pricingMeta.marketDisclaimer} Market data and exchange rates reviewed {marketMeta.reviewed}.
                  </p>
                </section>
              </>
            )}
          </div>

          <aside className={styles.summary} aria-label="Estimate summary">
            <p className={styles.stagePill}>
              {stage.name} stage · {stage.priceLabel}
            </p>
            <dl className={styles.figures}>
              <div className={styles.figureMain}>
                <dt>Recommended estimate</dt>
                <dd>{gbp(plan.estimate.recommended)}</dd>
              </div>
              <div>
                <dt>Minimum</dt>
                <dd>{gbp(plan.estimate.min)}</dd>
              </div>
              <div>
                <dt>Maximum</dt>
                <dd>{gbp(plan.estimate.max)}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{weeks(plan.weeks)}</dd>
              </div>
              <div>
                <dt>Infrastructure & usage</dt>
                <dd>{perMonth(plan.monthly.running)}</dd>
              </div>
              <div>
                <dt>Maintenance</dt>
                <dd>{perMonth(plan.monthly.maintenance)}</dd>
              </div>
              <div>
                <dt>Typical UK agency</dt>
                <dd>{gbpRange(plan.markets[0].agencyGbp)}</dd>
              </div>
              {plan.savings && (
                <div>
                  <dt>Potential saving</dt>
                  <dd>
                    {plan.savings.percent[0]}% to {plan.savings.percent[1]}%
                  </dd>
                </div>
              )}
              <div>
                <dt>First-year total</dt>
                <dd>{gbpRange(plan.firstYear)}</dd>
              </div>
            </dl>
            {plan.budgetFit && (
              <p className={styles.budget} data-fit={plan.budgetFit}>
                {plan.budgetFit === "within" ? "Within your stated budget" : "Above your stated budget: see the phased plan"}
              </p>
            )}
            {props.offer && (
              <div className={styles.offer}>
                <p className={styles.offerLabel}>{props.offer.label}</p>
                <p>
                  <s>Standard estimate {gbp(props.offer.standard)}</s>
                </p>
                <p className={styles.offerPrice}>From {gbp(props.offer.price)}</p>
                <p className={styles.note}>
                  For a first enquiry{props.offer.expires ? `, until ${new Date(props.offer.expires).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : ""}. Confirmed by the DotSeek team.
                </p>
              </div>
            )}
            <Negotiation value={props.negotiation} onSave={props.onNegotiate} onDiscuss={props.onConsult} />
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => setQuoteOpen(true)}>
                View quotation <Icon name="arrow" />
              </button>
              <button
                type="button"
                className={styles.cheaper}
                onClick={() => {
                  const name = props.onMakeCheaper();
                  setCheaperNote(name ? `Switched to the ${name} version. Security, accessibility, responsive design and data protection stay in.` : "This is already the leanest version. Tell us your budget and the team will suggest how to start.");
                }}
              >
                Make this cheaper
              </button>
              {cheaperNote && (
                <p className={styles.note} role="status">
                  {cheaperNote}
                </p>
              )}
              {props.onContinue && (
                <button type="button" className={styles.secondary} onClick={props.onContinue}>
                  Continue to send enquiry
                </button>
              )}
              {props.onConsult && (
                <button type="button" className={styles.secondary} onClick={props.onConsult}>
                  Request a consultation
                </button>
              )}
              <div className={styles.textActions}>
                <button type="button" className={styles.textButton} onClick={props.onModify}>
                  Modify requirements
                </button>
                {!props.onContinue && (
                  <button type="button" className={styles.textButton} onClick={onClose}>
                    Back to summary
                  </button>
                )}
              </div>
            </div>
            <p className={styles.note}>{pricingMeta.disclaimer}</p>
          </aside>
        </div>

        {quoteOpen && (
          <QuotationView
            plan={plan}
            title={brief?.title || `${solutionHeadline(plan, props.solutionTitle).name} plan`}
            solutionTitle={props.solutionTitle}
            overview={brief?.overview}
            contact={props.contact}
            offer={props.offer}
            negotiation={props.negotiation}
            reference={props.reference}
            onContact={props.onContact}
            onSend={
              props.onContinue
                ? () => {
                    setQuoteOpen(false);
                    props.onContinue!();
                  }
                : undefined
            }
            onConsult={
              props.onConsult
                ? () => {
                    setQuoteOpen(false);
                    props.onConsult!();
                  }
                : undefined
            }
            onClose={() => setQuoteOpen(false)}
          />
        )}

        <div className={styles.mobileBar}>
          <p>
            Recommended <strong>{gbp(plan.estimate.recommended)}</strong>
          </p>
          {props.onContinue ? (
            <button type="button" className={styles.primary} onClick={() => setQuoteOpen(true)}>
              View quotation <Icon name="arrow" />
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={onClose}>
              Back to summary
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

function ServiceGroup({
  group,
  services,
  onToggle,
  onScope,
  detailed,
}: {
  group: ItemGroup;
  services: ServiceView[];
  onToggle: (id: string, on: boolean) => void;
  onScope: (id: string, scope: ScopeId) => void;
  detailed?: boolean;
}) {
  const items = services.filter((s) => s.group === group && s.id !== "discovery");
  if (!items.length) return null;
  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{groupLabels[group]}</h4>
      <ul className={styles.services}>
        {items.map((s) => (
          <li key={s.id} className={styles.service} data-status={s.status}>
            <button
              type="button"
              role="switch"
              aria-checked={s.selected}
              aria-label={`${s.label}${s.locked ? " (core, always included)" : ""}`}
              className={styles.switch}
              disabled={s.locked}
              onClick={() => onToggle(s.id, !s.selected)}
            >
              <span aria-hidden="true" />
            </button>
            <div className={styles.serviceText}>
              <p className={styles.serviceHead}>
                <strong>{s.label}</strong>
                <span className={styles.status} data-status={s.status}>
                  {s.locked ? "Core" : STATUS[s.status]}
                </span>
              </p>
              <p className={styles.reason}>{detailed || s.status !== "included" ? s.reason : s.summary}</p>
              {s.selected && s.scopeOptions && <ScopePicker service={s} onScope={onScope} />}
              {detailed && s.impact && (
                <p className={styles.impact}>
                  <span>Performance: {ratingLabel(s.impact[0])}</span>
                  <span>Reliability: {ratingLabel(s.impact[1])}</span>
                  <span>Scalability: {ratingLabel(s.impact[2])}</span>
                  <span>Complexity: {ratingLabel(s.impact[3])}</span>
                </p>
              )}
            </div>
            <p className={styles.serviceCost}>
              {s.setupCost > 0 && <span>+{gbp(s.setupCost)}</span>}
              {s.monthly && s.monthly[1] > 0 && <span>{perMonth(s.monthly)}</span>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Basic / Advanced / Custom for one selected item, with what each includes and its setup cost. */
function ScopePicker({ service, onScope }: { service: ServiceView; onScope: (id: string, scope: ScopeId) => void }) {
  const options = service.scopeOptions!;
  const current = options.find((o) => o.id === service.scope) ?? options[0];
  return (
    <div className={styles.scope}>
      <div className={styles.scopeOptions} role="radiogroup" aria-label={`${service.label}: level`}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === current.id}
            className={styles.scopeOption}
            onClick={() => onScope(service.id, o.id)}
          >
            {o.label}
            <small>{gbp(o.setupCost)}</small>
          </button>
        ))}
      </div>
      <p className={styles.scopeDetail}>{current.detail}</p>
    </div>
  );
}

/**
 * "Choose your price": the customer picks a target between the lowest viable
 * version and the premium version; the options adjust to fit and the changes
 * are listed. Everything can still be fine-tuned item by item afterwards.
 */
function PriceSlider({ plan, onFit, onReset }: { plan: Plan; onFit: (target: number) => string[]; onReset: () => void }) {
  const [min, max] = plan.priceRange;
  const step = 250;
  const [value, setValue] = useState(() => Math.min(max, Math.max(min, plan.target ?? plan.build)));
  const [changes, setChanges] = useState<string[] | null>(null);
  const [dirty, setDirty] = useState(false);

  // Apply shortly after the customer stops moving the slider.
  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => {
      setChanges(onFit(value));
      setDirty(false);
    }, 250);
    return () => window.clearTimeout(id);
  }, [value, dirty, onFit]);

  const pct = (n: number) => (max > min ? ((n - min) / (max - min)) * 100 : 0);
  const shown = changes?.slice(0, 6) ?? [];

  return (
    <section className={styles.block} aria-labelledby="price-title">
      <h3 id="price-title" className={styles.blockTitle}>
        Choose your price
      </h3>
      <p className={styles.muted}>
        Slide to the price you have in mind. We adjust the options to fit: lower levels and later phases below, the recommended architecture,
        recommended services and higher levels above. You can still change any item afterwards.
      </p>
      <div className={styles.price}>
        <div className={styles.priceHead}>
          <span>Your target</span>
          <strong>{gbp(value)}</strong>
          <span className={styles.priceNow}>Current estimate {gbp(plan.build)}</span>
        </div>
        <div className={styles.priceTrack}>
          <input
            type="range"
            className={styles.range}
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label="Target price"
            aria-valuetext={gbp(value)}
            onChange={(event) => {
              setValue(Number(event.target.value));
              setDirty(true);
            }}
            style={{ "--fill": `${pct(value)}%` } as React.CSSProperties}
          />
          <span className={styles.recMarker} style={{ left: `${pct(plan.recommendedPrice)}%` }} aria-hidden="true" />
        </div>
        <div className={styles.priceScale}>
          <span>
            Leanest version
            <br />
            {gbp(min)}
          </span>
          <span>
            Recommended
            <br />
            {gbp(plan.recommendedPrice)}
          </span>
          <span>
            Premium
            <br />
            {gbp(max)}
          </span>
        </div>
      </div>
      {changes && (
        <div className={styles.fitResult} aria-live="polite">
          {changes.length === 0 ? (
            <p>{value <= min ? `This is the leanest version of your project. Below about ${gbp(min)}, tell us your budget and the team can suggest a smaller first phase.` : "No changes were needed for this price."}</p>
          ) : (
            <>
              <p>
                Adjusted to <strong>{gbp(plan.build)}</strong>:
              </p>
              <ul>
                {shown.map((c) => (
                  <li key={c}>{c}</li>
                ))}
                {changes.length > shown.length && <li>and {changes.length - shown.length} more adjustments</li>}
              </ul>
            </>
          )}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              onReset();
              setValue(Math.min(max, Math.max(min, plan.recommendedPrice)));
              setChanges(null);
            }}
          >
            Reset to our recommendation
          </button>
        </div>
      )}
    </section>
  );
}

/** "Request a better price" / "Tell us your budget" / "Discuss this quote". Saved with the enquiry, never promised. */
function Negotiation({
  value,
  onSave,
  onDiscuss,
}: {
  value?: { preferredBudget?: number; note?: string };
  onSave: (n: { preferredBudget?: number; note?: string }) => void;
  onDiscuss?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(value?.preferredBudget ? String(value.preferredBudget) : "");
  const [note, setNote] = useState(value?.note ?? "");
  const saved = Boolean(value?.preferredBudget || value?.note);

  return (
    <div className={styles.negotiate}>
      {saved && !open ? (
        <p className={styles.negotiateSaved} role="status">
          {value?.preferredBudget ? `Your preferred budget of ${gbp(value.preferredBudget)} has been added to the enquiry.` : "Your note has been added to the enquiry."}{" "}
          DotSeek can review the scope and suggest whether the project can be adjusted or delivered in phases.
        </p>
      ) : null}
      {open ? (
        <form
          className={styles.negotiateForm}
          onSubmit={(event) => {
            event.preventDefault();
            const amount = Number(budget.replace(/[£,\s]/g, ""));
            onSave({ preferredBudget: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined, note: note.trim() || undefined });
            setOpen(false);
          }}
        >
          <label htmlFor="plan-budget">Your preferred budget (£)</label>
          <input id="plan-budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2000" />
          <label htmlFor="plan-note">Anything we should know? (optional)</label>
          <textarea id="plan-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className={styles.textActions}>
            <button type="submit" className={styles.smallButton}>
              Add to my enquiry
            </button>
            <button type="button" className={styles.textButton} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.textActions}>
          <button type="button" className={styles.textButton} onClick={() => setOpen(true)}>
            {saved ? "Change my budget" : "Request a better price"}
          </button>
          {!saved && (
            <button type="button" className={styles.textButton} onClick={() => setOpen(true)}>
              Tell us your budget
            </button>
          )}
          {onDiscuss && (
            <button type="button" className={styles.textButton} onClick={onDiscuss}>
              Discuss this quote
            </button>
          )}
        </div>
      )}
    </div>
  );
}
