import { answerRows } from "@/content/enquiryFlows";
import { agencyComparison, formatRateDate, moneyForSnapshot, rateText } from "@/lib/currency/money";
import { solutionById } from "@/content/solutions";
import { pricingMeta, stageById, tierById } from "@/content/pricing";
import type { Enquiry, EnquiryStatus } from "@/lib/enquiries/store";
import { gbp, weeks } from "@/lib/plan/format";
import { ArchitectureDiagram } from "@/components/plan/ArchitectureDiagram";
import styles from "./Portal.module.css";

export const statusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_customer: "Awaiting customer",
  closed: "Closed",
};

export function StatusPill({ status }: { status: EnquiryStatus }) {
  return <span className={`${styles.pill} ${styles[`status_${status}`]}`}>{statusLabels[status]}</span>;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(iso));

export { formatDate };

/** Open enquiry whose latest message is from the customer: the team owes a reply. */
export const needsReply = (e: Enquiry) => e.status !== "closed" && e.thread.at(-1)?.from === "customer";

/** Up to two initials for the customer avatar. */
export const initials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

/** Brief, answers and (optionally) the pre-enquiry chat for one enquiry. */
export function EnquiryDetails({ enquiry, showTranscript }: { enquiry: Enquiry; showTranscript: boolean }) {
  const solution = solutionById(enquiry.solution);
  const { summary } = enquiry;
  return (
    <div className={styles.stack}>
      {summary && (
        <section className={styles.card} aria-labelledby="brief-title">
          <p className={styles.kicker}>Project brief</p>
          <h2 id="brief-title" className={styles.cardTitle}>
            {summary.title}
          </h2>
          <p className={styles.muted}>Recommended: {summary.recommendedSolution}</p>
          <p>{summary.overview}</p>
          <div className={styles.columns}>
            <BriefList title="Suggested features" items={summary.suggestedFeatures} />
            <BriefList title="Suggested technology" items={summary.suggestedTechnology} />
            <BriefList title="Questions to clarify" items={summary.openQuestions} />
          </div>
          <p className={styles.note}>AI-generated suggestions, to be confirmed with the DotSeek team.</p>
        </section>
      )}

      {enquiry.plan && <PlanSnapshot enquiry={enquiry} team={showTranscript} />}

      <section className={styles.card} aria-labelledby="answers-title">
        <p className={styles.kicker}>{solution?.title ?? "Enquiry"}</p>
        <h2 id="answers-title" className={styles.cardTitle}>
          Enquiry details
        </h2>
        <dl className={styles.answers}>
          {answerRows(enquiry.answers).map((row) => (
            <div key={row.id}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {showTranscript && enquiry.transcript?.length ? (
        <section className={styles.card} aria-labelledby="chat-title">
          <h2 id="chat-title" className={styles.cardTitle}>
            Chat before the enquiry
          </h2>
          <ol className={styles.transcript}>
            {enquiry.transcript.map((turn, i) => (
              <li key={i} className={turn.role === "user" ? styles.fromCustomer : styles.fromAssistant}>
                <span>{turn.role === "user" ? "Visitor" : "AI consultant"}</span>
                <p>{turn.content}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

/** The AI-generated indicative estimate and architecture saved with the enquiry. */
/** `team`: the admin view, which also shows the GBP base and how the currency was set. */
function PlanSnapshot({ enquiry, team }: { enquiry: Enquiry; team: boolean }) {
  const plan = enquiry.plan!;
  // Shown in the currency the customer saw, at the rate saved with the quotation.
  const money = moneyForSnapshot(enquiry.currency);
  const cur = enquiry.currency;
  const uk = plan.markets.find((m) => m.id === "uk");
  const advice = [...plan.advice.map((a) => a.message), ...(enquiry.summary?.advice ?? []).map((a) => a.message)];
  return (
    <section className={styles.card} aria-labelledby="plan-title">
      <p className={styles.kicker}>{pricingMeta.label}</p>
      <h2 id="plan-title" className={styles.cardTitle}>
        Estimate &amp; architecture
      </h2>
      {enquiry.consultation && <p className={styles.flag}>Consultation call requested</p>}
      <dl className={styles.figures}>
        <div>
          <dt>Recommended</dt>
          <dd>
            {money.total(plan.estimate?.recommended ?? plan.build)}
            {!money.isGbp && (
              <small className={styles.refValue}>
                {money.ref(plan.estimate?.recommended ?? plan.build)}
                {team && ` (GBP base ${gbp(plan.estimate?.recommended ?? plan.build)})`}
              </small>
            )}
          </dd>
        </div>
        {cur && !money.isGbp && (
          <div>
            <dt>Currency</dt>
            <dd>
              {cur.customerCurrency}, {rateText(cur.region)}
              <small className={styles.refValue}>
                Rate checked {formatRateDate(cur.rateCheckedAt)}
                {team &&
                  ` · ${cur.selection === "manual" ? "chosen by the customer" : `detected (${cur.detectedCountry ?? "unknown"})`} · regional factor ${cur.regionalFactor} · invoice in ${cur.invoiceCurrency}`}
              </small>
            </dd>
          </div>
        )}
        {plan.estimate && (
          <div>
            <dt>Estimate range</dt>
            <dd>
              {money.total(plan.estimate.min)}–{money.total(plan.estimate.max)}
            </dd>
          </div>
        )}
        {plan.stage && (
          <div>
            <dt>Business stage</dt>
            <dd>{stageById(plan.stage)?.name}</dd>
          </div>
        )}
        {enquiry.offer && (
          <div>
            <dt>{enquiry.offer.label}</dt>
            <dd>
              From {money.fmt(enquiry.offer.price)}
              {!enquiry.offer.eligible && " (not first enquiry)"}
            </dd>
          </div>
        )}
        {enquiry.negotiation?.preferredBudget && (
          <div>
            <dt>Preferred budget</dt>
            <dd>{money.fmt(enquiry.negotiation.preferredBudget)}</dd>
          </div>
        )}
        <div>
          <dt>Timeline</dt>
          <dd>{weeks(plan.weeks)}</dd>
        </div>
        <div>
          <dt>Running costs</dt>
          <dd>{money.perMonth(plan.monthly.running)}</dd>
        </div>
        <div>
          <dt>Maintenance</dt>
          <dd>{money.perMonth(plan.monthly.maintenance)}</dd>
        </div>
        {uk?.agencyGbp && (
          <div>
            <dt>{agencyComparison(plan.markets, money).label}</dt>
            <dd>{agencyComparison(plan.markets, money).value}</dd>
          </div>
        )}
      </dl>
      <p className={styles.muted}>
        Architecture: <strong>{tierById(plan.tier)?.name}</strong>
        {plan.tier !== plan.recommendedTier && ` (recommended: ${tierById(plan.recommendedTier)?.name})`}
      </p>
      <ArchitectureDiagram diagram={plan.diagram} />
      {enquiry.summary?.architecture && <p>{enquiry.summary.architecture}</p>}
      {enquiry.negotiation?.note && <p className={styles.muted}>Customer&apos;s note on price: {enquiry.negotiation.note}</p>}
      {enquiry.reference && (
        <p className={styles.muted}>
          Reference:{" "}
          <a href={enquiry.reference.url} rel="noopener noreferrer nofollow" target="_blank">
            {enquiry.reference.host}
          </a>{" "}
          ({enquiry.reference.kind}, about {enquiry.reference.pages} pages or screens). {enquiry.reference.summary}
        </p>
      )}
      <table className={styles.lines}>
        <tbody>
          {plan.lines.map((l) => (
            <tr key={l.id}>
              <td>{l.label}</td>
              <td>{money.fmt(l.cost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Estimated total</th>
            <td>{money.total(plan.build)}</td>
          </tr>
        </tfoot>
      </table>
      <BriefList title="Infrastructure" items={plan.services.filter((x) => x.selected && ["performance", "data", "storage", "background", "security", "devops"].includes(x.group)).map((x) => x.label)} />
      <BriefList title="Consultant recommendations" items={advice} />
      <p className={styles.note}>
        {pricingMeta.disclaimer} Pricing table reviewed {plan.pricingReviewed}.
      </p>
    </section>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className={styles.listTitle}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** The conversation between the customer and the DotSeek team. */
export function Thread({ enquiry, viewer }: { enquiry: Enquiry; viewer: "team" | "customer" }) {
  return (
    <section className={styles.card} aria-labelledby="thread-title">
      <h2 id="thread-title" className={styles.cardTitle}>
        Conversation
      </h2>
      {enquiry.thread.length === 0 ? (
        <p className={styles.muted}>
          {viewer === "team"
            ? "No messages yet. Your reply is emailed to the customer with a link back to this conversation."
            : "The DotSeek team will reply here and by email. You can add more details at any time."}
        </p>
      ) : (
        <ol className={styles.thread}>
          {enquiry.thread.map((m) => (
            <li key={m.id} className={m.from === viewer ? styles.mine : styles.theirs}>
              <div className={styles.messageMeta}>
                <strong>{m.from === "team" ? (m.author ?? "DotSeek team") : (m.author ?? "Customer")}</strong>
                <time dateTime={m.at}>{formatDate(m.at)}</time>
              </div>
              <p>{m.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
