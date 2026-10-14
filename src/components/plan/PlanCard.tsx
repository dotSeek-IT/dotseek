import type { Plan } from "@/lib/plan/build";
import { gbp, gbpRange, perMonth, weeks } from "@/lib/plan/format";
import type { OfferQuote } from "@/lib/plan/offer";
import { Icon } from "@/components/common/Icon";
import styles from "./Plan.module.css";

/** Compact estimate in the chat log; opens the full plan. */
export function PlanCard({ plan, title, offer, onOpen }: { plan: Plan; title: string; offer?: OfferQuote | null; onOpen: () => void }) {
  return (
    <section className={styles.card} aria-label="Your estimate">
      <p className={styles.estimateBadge}>{plan.label}</p>
      <p className={styles.cardTitle}>{title}</p>
      <dl className={styles.cardFigures}>
        <div>
          <dt>Estimate range</dt>
          <dd>
            {gbp(plan.estimate.min)}–{gbp(plan.estimate.max)}
          </dd>
        </div>
        <div>
          <dt>Recommended</dt>
          <dd>{gbp(plan.estimate.recommended)}</dd>
        </div>
        {offer && (
          <div className={styles.cardOffer}>
            <dt>{offer.label}</dt>
            <dd>From {gbp(offer.price)}</dd>
          </div>
        )}
        <div>
          <dt>Business stage</dt>
          <dd>{plan.stageInfo.name}</dd>
        </div>
        <div>
          <dt>Timeline</dt>
          <dd>{weeks(plan.weeks)}</dd>
        </div>
        <div>
          <dt>Running costs</dt>
          <dd>{perMonth(plan.monthly.running)}</dd>
        </div>
        <div>
          <dt>Typical UK agency</dt>
          <dd>{gbpRange(plan.markets[0].agencyGbp)}</dd>
        </div>
      </dl>
      <button type="button" className={styles.primary} onClick={onOpen}>
        Open estimate &amp; architecture <Icon name="arrow" />
      </button>
    </section>
  );
}
