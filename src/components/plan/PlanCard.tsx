import type { Plan } from "@/lib/plan/build";
import { CurrencySelector, RefAmount } from "@/components/currency/Currency";
import { useRegion } from "@/components/currency/useRegion";
import { agencyComparison } from "@/lib/currency/money";
import { gbp, perMonth, weeks } from "@/lib/plan/format";
import type { OfferQuote } from "@/lib/plan/offer";
import { Icon } from "@/components/common/Icon";
import styles from "./Plan.module.css";

/** Compact estimate in the chat log; opens the full plan. */
export function PlanCard({ plan, title, offer, onOpen }: { plan: Plan; title: string; offer?: OfferQuote | null; onOpen: () => void }) {
  // Re-render in the visitor's currency (and when they change it).
  const { money } = useRegion();
  return (
    <section className={styles.card} aria-label="Your estimate">
      <p className={styles.estimateBadge}>{plan.label}</p>
      <p className={styles.cardTitle}>{title}</p>
      <CurrencySelector className={styles.cardCurrency} />
      <dl className={styles.cardFigures}>
        <div>
          <dt>Estimate range</dt>
          <dd>
            {money.total(plan.estimate.min)}–{money.total(plan.estimate.max)}
          </dd>
        </div>
        <div>
          <dt>Recommended</dt>
          <dd>
            {money.total(plan.estimate.recommended)}
            <RefAmount gbp={plan.estimate.recommended} />
          </dd>
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
          <dt>{agencyComparison(plan.markets, money).label}</dt>
          <dd>{agencyComparison(plan.markets, money).value}</dd>
        </div>
      </dl>
      <button type="button" className={styles.primary} onClick={onOpen}>
        Open estimate &amp; architecture <Icon name="arrow" />
      </button>
    </section>
  );
}
